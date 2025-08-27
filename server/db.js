require("dotenv").config();
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");

let dbPromise = open({ 
  filename: process.env.DB_PATH || "./ladder.db", 
  driver: sqlite3.Database 
});

// Initialize database
(async () => {
  const db = await dbPromise;
  await db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      display_name TEXT,
      role TEXT DEFAULT 'nonmember',              -- nonmember | small | medium | large | mega
      membership_status TEXT DEFAULT 'none',      -- active | past_due | canceled | trialing | none
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      current_period_end INTEGER                  -- unix epoch seconds
    );

    CREATE TABLE IF NOT EXISTS tournament_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      status TEXT NOT NULL,                       -- paid | comped | refunded | pending
      stripe_payment_intent_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      UNIQUE(tournament_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS poolhalls (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      hall_id TEXT,
      name TEXT,
      max_slots INTEGER DEFAULT 32,
      is_open INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS operator_licenses (
      hall_id TEXT PRIMARY KEY,
      operator_user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      current_period_end INTEGER,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      price_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS operator_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hall_id TEXT NOT NULL,
      operator_user_id TEXT,
      name TEXT,
      email TEXT,
      phone TEXT,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      decided_at INTEGER,
      decided_by TEXT
    );

    CREATE TABLE IF NOT EXISTS operator_invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      hall_id TEXT NOT NULL,
      operator_user_id TEXT NOT NULL,
      email TEXT,
      status TEXT NOT NULL DEFAULT 'issued',
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS hall_pricing (
      hall_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (hall_id, key)
    );

    CREATE TABLE IF NOT EXISTS hall_settings (
      hall_id TEXT PRIMARY KEY,
      revenue_split_pct REAL,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS tournament_waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting',
      offer_url TEXT,
      offer_expires_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_email TEXT,
      subject TEXT,
      body TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_entries_tourney ON tournament_entries(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_poolhalls_city ON poolhalls(city);
    CREATE INDEX IF NOT EXISTS idx_waitlist_t ON tournament_waitlist(tournament_id);
  `);
})();

// User management functions
async function upsertUser({ id, email, display_name }) {
  const db = await dbPromise;
  const existing = await db.get("SELECT id FROM users WHERE id = ?", id);
  if (existing) {
    await db.run(
      "UPDATE users SET email = COALESCE(?, email), display_name = COALESCE(?, display_name) WHERE id = ?",
      email || null, display_name || null, id
    );
  } else {
    await db.run(
      "INSERT INTO users (id, email, display_name) VALUES (?, ?, ?)", 
      id, email || null, display_name || null
    );
  }
}

async function getUserById(id) {
  const db = await dbPromise;
  return db.get("SELECT * FROM users WHERE id = ?", id);
}

async function setStripeIds(id, { customerId, subscriptionId }) {
  await upsertUser({ id });
  const db = await dbPromise;
  await db.run(`
    UPDATE users
    SET stripe_customer_id = COALESCE(?, stripe_customer_id),
        stripe_subscription_id = COALESCE(?, stripe_subscription_id)
    WHERE id = ?
  `, customerId || null, subscriptionId || null, id);
}

async function setMembership(id, tier, status, currentPeriodEnd, ids = {}) {
  await upsertUser({ id });
  const db = await dbPromise;
  
  // Decide visible app role based on status
  let role = "nonmember";
  if (status === "active" || status === "trialing") {
    role = tier; // small | medium | large | mega
  }
  if (status === "past_due" || status === "canceled" || status === "unpaid") {
    role = "nonmember";
  }

  await db.run(`
    UPDATE users
    SET role = ?,
        membership_status = ?,
        current_period_end = ?,
        stripe_customer_id = COALESCE(?, stripe_customer_id),
        stripe_subscription_id = COALESCE(?, stripe_subscription_id)
    WHERE id = ?
  `, role, status || "none", currentPeriodEnd || null, ids.customer || null, ids.sub || null, id);
}

async function getStripeCustomerIdForUser(id) {
  const row = await getUserById(id);
  return row?.stripe_customer_id || null;
}

async function getMembershipStatus(id) {
  const u = await getUserById(id);
  if (!u) return null;
  
  return {
    userId: u.id,
    email: u.email,
    role: u.role,                                // nonmember | small | medium | large | mega
    status: u.membership_status,                 // active | past_due | canceled | trialing | none
    currentPeriodEnd: u.current_period_end,      // epoch seconds
    stripeCustomerId: u.stripe_customer_id || null,
    stripeSubscriptionId: u.stripe_subscription_id || null,
    // Pricing perks based on tier
    perks: {
      freeTournaments: ["large", "mega"].includes(u.role),
      commissionRate: ["small", "medium", "large", "mega"].includes(u.role) ? 0.05 : 0.15,
      maxPlayers: getMaxPlayersForRole(u.role),
      pricePerMonth: getPriceForRole(u.role)
    }
  };
}

function getMaxPlayersForRole(role) {
  switch(role) {
    case "small": return 15;
    case "medium": return 25;
    case "large": return 40;
    case "mega": return 999999; // unlimited
    default: return 0;
  }
}

function getPriceForRole(role) {
  switch(role) {
    case "small": return 199;
    case "medium": return 299;
    case "large": return 399;
    case "mega": return 799;
    default: return 0;
  }
}

// Tournament entry functions
async function getEntry(tournamentId, userId) {
  const db = await dbPromise;
  return db.get(
    "SELECT * FROM tournament_entries WHERE tournament_id = ? AND user_id = ?",
    tournamentId, userId
  );
}

async function recordTournamentEntry({ tournamentId, userId, amountCents, status, paymentIntentId }) {
  const existing = await getEntry(tournamentId, userId);
  if (existing) return existing;
  
  const db = await dbPromise;
  await db.run(`
    INSERT INTO tournament_entries (tournament_id, user_id, amount_cents, status, stripe_payment_intent_id)
    VALUES (?, ?, ?, ?, ?)
  `, tournamentId, userId, amountCents, status, paymentIntentId || null);
  
  return getEntry(tournamentId, userId);
}

// Admin functions
async function listMembers({ role, status } = {}) {
  const db = await dbPromise;
  let sql = "SELECT id, email, display_name, role, membership_status, current_period_end, stripe_customer_id FROM users WHERE 1=1";
  const args = [];
  if (role) { sql += " AND role = ?"; args.push(role); }
  if (status) { sql += " AND membership_status = ?"; args.push(status); }
  sql += " ORDER BY display_name COLLATE NOCASE";
  return db.all(sql, ...args);
}

function membersToCSV(rows) {
  const header = ["id","email","display_name","role","membership_status","current_period_end","stripe_customer_id"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([
      r.id, r.email || "", (r.display_name || "").replace(/,/g," "),
      r.role, r.membership_status, r.current_period_end || "", r.stripe_customer_id || ""
    ].join(","));
  }
  return lines.join("\n");
}

// Pool hall management
async function addPoolHall({ name, city }) {
  const db = await dbPromise;
  const id = require('crypto').randomUUID();
  await db.run(
    "INSERT INTO poolhalls (id, name, city) VALUES (?, ?, ?)",
    id, name, city
  );
  return db.get("SELECT * FROM poolhalls WHERE id = ?", id);
}

async function getPoolHalls() {
  const db = await dbPromise;
  return db.all("SELECT * FROM poolhalls ORDER BY name");
}

async function updatePoolHallStats(hallId, { wins, losses, points }) {
  const db = await dbPromise;
  return db.run(
    "UPDATE poolhalls SET wins = wins + ?, losses = losses + ?, points = points + ? WHERE id = ?",
    wins || 0, losses || 0, points || 0, hallId
  );
}

// Tournament management functions
async function upsertTournament({ id, hall_id, name, max_slots, is_open }) {
  const db = await dbPromise;
  const existing = await db.get("SELECT id FROM tournaments WHERE id = ?", id);
  if (existing) {
    await db.run(`
      UPDATE tournaments 
      SET hall_id = COALESCE(?, hall_id),
          name = COALESCE(?, name),
          max_slots = COALESCE(?, max_slots),
          is_open = COALESCE(?, is_open)
      WHERE id = ?
    `, hall_id, name, max_slots, is_open, id);
  } else {
    await db.run(`
      INSERT INTO tournaments (id, hall_id, name, max_slots, is_open)
      VALUES (?, ?, ?, ?, ?)
    `, id, hall_id, name, max_slots || 32, is_open || 1);
  }
  return db.get("SELECT * FROM tournaments WHERE id = ?", id);
}

async function getTournament(id) {
  const db = await dbPromise;
  return db.get("SELECT * FROM tournaments WHERE id = ?", id);
}

async function setTournamentOpen(id, isOpen) {
  const db = await dbPromise;
  return db.run("UPDATE tournaments SET is_open = ? WHERE id = ?", isOpen ? 1 : 0, id);
}

async function countConfirmedEntries(tournamentId) {
  const db = await dbPromise;
  const result = await db.get(`
    SELECT COUNT(*) as count FROM tournament_entries 
    WHERE tournament_id = ? AND status IN ('paid', 'comped')
  `, tournamentId);
  return result.count || 0;
}

async function listEntries(tournamentId) {
  const db = await dbPromise;
  return db.all(`
    SELECT * FROM tournament_entries 
    WHERE tournament_id = ? 
    ORDER BY created_at ASC
  `, tournamentId);
}

// Operator license functions
async function setOperatorLicense({ hallId, operatorUserId, status, currentPeriodEnd, customerId, subscriptionId, priceId }) {
  const db = await dbPromise;
  const existing = await db.get("SELECT hall_id FROM operator_licenses WHERE hall_id = ?", hallId);
  if (existing) {
    await db.run(`
      UPDATE operator_licenses 
      SET operator_user_id = ?, status = ?, current_period_end = ?,
          stripe_customer_id = COALESCE(?, stripe_customer_id),
          stripe_subscription_id = COALESCE(?, stripe_subscription_id),
          price_id = COALESCE(?, price_id)
      WHERE hall_id = ?
    `, operatorUserId, status, currentPeriodEnd, customerId, subscriptionId, priceId, hallId);
  } else {
    await db.run(`
      INSERT INTO operator_licenses (hall_id, operator_user_id, status, current_period_end, stripe_customer_id, stripe_subscription_id, price_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, hallId, operatorUserId, status, currentPeriodEnd, customerId, subscriptionId, priceId);
  }
  return db.get("SELECT * FROM operator_licenses WHERE hall_id = ?", hallId);
}

async function getOperatorLicense(hallId) {
  const db = await dbPromise;
  return db.get("SELECT * FROM operator_licenses WHERE hall_id = ?", hallId);
}

// Hall pricing and settings
function setHallPrice(hallId, key, value) {
  const db = require('sqlite3');
  const syncDb = new db.Database(process.env.DB_PATH || "./ladder.db");
  syncDb.prepare(`
    INSERT INTO hall_pricing (hall_id, key, value)
    VALUES (?, ?, ?)
    ON CONFLICT(hall_id, key) DO UPDATE SET value=excluded.value
  `).run(hallId, key, String(value));
  syncDb.close();
}

function getHallPrice(hallId, key) {
  const db = require('sqlite3');
  const syncDb = new db.Database(process.env.DB_PATH || "./ladder.db");
  const r = syncDb.prepare("SELECT value FROM hall_pricing WHERE hall_id=? AND key=?").get(hallId, key);
  syncDb.close();
  return r ? r.value : null;
}

function setHallSetting(hallId, { revenue_split_pct }) {
  const db = require('sqlite3');
  const syncDb = new db.Database(process.env.DB_PATH || "./ladder.db");
  const exists = syncDb.prepare("SELECT hall_id FROM hall_settings WHERE hall_id=?").get(hallId);
  const pct = (revenue_split_pct == null ? null : Number(revenue_split_pct));
  if (exists) {
    syncDb.prepare("UPDATE hall_settings SET revenue_split_pct=?, updated_at=strftime('%s','now') WHERE hall_id=?")
      .run(pct, hallId);
  } else {
    syncDb.prepare("INSERT INTO hall_settings (hall_id, revenue_split_pct) VALUES (?, ?)").run(hallId, pct);
  }
  syncDb.close();
}

function getHallSetting(hallId) {
  const db = require('sqlite3');
  const syncDb = new db.Database(process.env.DB_PATH || "./ladder.db");
  const r = syncDb.prepare("SELECT * FROM hall_settings WHERE hall_id=?").get(hallId);
  syncDb.close();
  return r || null;
}

// Waitlist functions
function addToWaitlist({ tournamentId, userId }) {
  const db = require('sqlite3');
  const syncDb = new db.Database(process.env.DB_PATH || "./ladder.db");
  const existing = syncDb.prepare(`
    SELECT * FROM tournament_waitlist
    WHERE tournament_id=? AND user_id=? AND status IN ('waiting','offered')
  `).get(tournamentId, userId);
  if (existing) {
    syncDb.close();
    return existing;
  }
  const info = syncDb.prepare(`
    INSERT INTO tournament_waitlist (tournament_id, user_id)
    VALUES (?, ?)
  `).run(tournamentId, userId);
  const result = syncDb.prepare("SELECT * FROM tournament_waitlist WHERE id=?").get(info.lastInsertRowid);
  syncDb.close();
  return result;
}

function listWaitlist(tournamentId) {
  const db = require('sqlite3');
  const syncDb = new db.Database(process.env.DB_PATH || "./ladder.db");
  const result = syncDb.prepare(`
    SELECT * FROM tournament_waitlist
    WHERE tournament_id=?
    ORDER BY created_at ASC
  `).all(tournamentId);
  syncDb.close();
  return result;
}

function nextWaitlistRow(tournamentId) {
  const db = require('sqlite3');
  const syncDb = new db.Database(process.env.DB_PATH || "./ladder.db");
  const result = syncDb.prepare(`
    SELECT * FROM tournament_waitlist
    WHERE tournament_id=? AND status='waiting'
    ORDER BY created_at ASC LIMIT 1
  `).get(tournamentId);
  syncDb.close();
  return result;
}

function markWaitlistOffered(id, { url, expiresAt }) {
  const db = require('sqlite3');
  const syncDb = new db.Database(process.env.DB_PATH || "./ladder.db");
  syncDb.prepare("UPDATE tournament_waitlist SET status='offered', offer_url=?, offer_expires_at=? WHERE id=?")
    .run(url || null, expiresAt || null, id);
  syncDb.close();
}

function markWaitlistConverted(id) {
  const db = require('sqlite3');
  const syncDb = new db.Database(process.env.DB_PATH || "./ladder.db");
  syncDb.prepare("UPDATE tournament_waitlist SET status='converted' WHERE id=?").run(id);
  syncDb.close();
}

function cancelWaitlist(id) {
  const db = require('sqlite3');
  const syncDb = new db.Database(process.env.DB_PATH || "./ladder.db");
  syncDb.prepare("UPDATE tournament_waitlist SET status='canceled' WHERE id=?").run(id);
  syncDb.close();
}

// Contact functions
function saveContact({ fromEmail, subject, body }) {
  const db = require('sqlite3');
  const syncDb = new db.Database(process.env.DB_PATH || "./ladder.db");
  const info = syncDb.prepare("INSERT INTO contact_messages (from_email, subject, body) VALUES (?, ?, ?)")
    .run(fromEmail || null, subject || null, body || null);
  const result = syncDb.prepare("SELECT * FROM contact_messages WHERE id=?").get(info.lastInsertRowid);
  syncDb.close();
  return result;
}

function listContacts() {
  const db = require('sqlite3');
  const syncDb = new db.Database(process.env.DB_PATH || "./ladder.db");
  const result = syncDb.prepare("SELECT * FROM contact_messages ORDER BY created_at DESC").all();
  syncDb.close();
  return result;
}

// Revenue reporting
function revenueSummaryByHall({ fromEpoch, toEpoch }) {
  const db = require('sqlite3');
  const syncDb = new db.Database(process.env.DB_PATH || "./ladder.db");
  const result = syncDb.prepare(`
    SELECT t.hall_id AS hall_id,
           COUNT(e.id) AS paid_count,
           SUM(e.amount_cents) AS gross_cents
    FROM tournament_entries e
    JOIN tournaments t ON t.id = e.tournament_id
    WHERE e.status = 'paid'
      AND e.created_at BETWEEN ? AND ?
    GROUP BY t.hall_id
    ORDER BY t.hall_id
  `).all(fromEpoch, toEpoch);
  syncDb.close();
  return result;
}

function revenueDetail({ hallId, fromEpoch, toEpoch }) {
  const db = require('sqlite3');
  const syncDb = new db.Database(process.env.DB_PATH || "./ladder.db");
  const result = syncDb.prepare(`
    SELECT e.tournament_id, e.user_id, e.amount_cents, e.status, e.stripe_payment_intent_id, e.created_at
    FROM tournament_entries e
    JOIN tournaments t ON t.id = e.tournament_id
    WHERE e.status='paid'
      AND e.created_at BETWEEN ? AND ?
      AND (? IS NULL OR t.hall_id = ?)
    ORDER BY e.created_at ASC
  `).all(fromEpoch, toEpoch, hallId || null, hallId || null);
  syncDb.close();
  return result;
}

async function listTournaments({ is_open } = {}) {
  const db = await dbPromise;
  let sql = "SELECT * FROM tournaments WHERE 1=1";
  const args = [];
  if (typeof is_open !== "undefined") { sql += " AND is_open = ?"; args.push(is_open ? 1 : 0); }
  sql += " ORDER BY created_at DESC";
  return db.all(sql, ...args);
}

async function listOperatorLicenses({ status } = {}) {
  const db = await dbPromise;
  let sql = "SELECT * FROM operator_licenses WHERE 1=1";
  const args = [];
  if (status) { sql += " AND status = ?"; args.push(status); }
  sql += " ORDER BY current_period_end DESC";
  return db.all(sql, ...args);
}

module.exports = {
  upsertUser,
  getUserById,
  getStripeCustomerIdForUser,
  setStripeIds,
  setMembership,
  getMembershipStatus,
  getEntry,
  recordTournamentEntry,
  listMembers,
  membersToCSV,
  addPoolHall,
  getPoolHalls,
  updatePoolHallStats,
  getMaxPlayersForRole,
  getPriceForRole,
  upsertTournament,
  getTournament,
  setTournamentOpen,
  countConfirmedEntries,
  listEntries,
  setOperatorLicense,
  getOperatorLicense,
  setHallPrice,
  getHallPrice,
  setHallSetting,
  getHallSetting,
  addToWaitlist,
  listWaitlist,
  nextWaitlistRow,
  markWaitlistOffered,
  markWaitlistConverted,
  cancelWaitlist,
  saveContact,
  listContacts,
  revenueSummaryByHall,
  revenueDetail,
  listTournaments,
  listOperatorLicenses
};