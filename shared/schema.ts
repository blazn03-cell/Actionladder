import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, real, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Global user roles for platform management
export const globalRoles = ["OWNER", "STAFF", "OPERATOR", "CREATOR", "PLAYER"] as const;
export type GlobalRole = typeof globalRoles[number];

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  globalRole: text("global_role").notNull().default("PLAYER"),
  role: text("role").default("player"), // player, operator, admin for side betting
  stripeCustomerId: text("stripe_customer_id"),
  stripeConnectId: text("stripe_connect_id").unique(),
  payoutShareBps: integer("payout_share_bps"), // basis points (100 bps = 1%)
  onboardingComplete: boolean("onboarding_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  seatLimit: integer("seat_limit").default(5),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payoutTransfers = pgTable("payout_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: text("invoice_id").notNull(),
  stripeTransferId: text("stripe_transfer_id").notNull(),
  recipientUserId: text("recipient_user_id").notNull(),
  amount: integer("amount").notNull(), // cents
  shareType: text("share_type").notNull(), // "OWNER" | "STAFF"
  createdAt: timestamp("created_at").defaultNow(),
});

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  rating: integer("rating").notNull().default(500),
  city: text("city"),
  member: boolean("member").default(false),
  theme: text("theme"),
  points: integer("points").notNull().default(800),
  streak: integer("streak").default(0),
  respectPoints: integer("respect_points").default(0),
  birthday: text("birthday"), // MM-DD format
  stripeCustomerId: text("stripe_customer_id"),
  userId: text("user_id"), // link to users table
  isRookie: boolean("is_rookie").default(true), // Starts as rookie, graduates at Fargo 500+
  rookieWins: integer("rookie_wins").default(0), // Track rookie division wins
  rookieLosses: integer("rookie_losses").default(0), // Track rookie division losses
  rookiePoints: integer("rookie_points").default(0), // Separate rookie points system
  rookieStreak: integer("rookie_streak").default(0), // Current rookie win streak
  rookiePassActive: boolean("rookie_pass_active").default(false), // $20/month subscription
  rookiePassExpiresAt: timestamp("rookie_pass_expires_at"), // When subscription expires
  graduatedAt: timestamp("graduated_at"), // When they left rookie division
  membershipTier: text("membership_tier").default("none"), // "none", "basic", "pro"
  createdAt: timestamp("created_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  division: text("division").notNull(), // "HI" or "LO"
  challenger: text("challenger").notNull(),
  opponent: text("opponent").notNull(),
  game: text("game").notNull(),
  table: text("table").notNull(),
  stake: integer("stake").notNull(),
  time: timestamp("time").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("scheduled"), // "scheduled", "reported"
  winner: text("winner"),
  commission: integer("commission"),
  bountyAward: integer("bounty_award").default(0),
  weightMultiplierBps: integer("weight_multiplier_bps").default(100), // Weight multiplier in basis points (100 = 1.00x)
  owedWeight: boolean("owed_weight").default(false), // Whether challenger owes weight
  reportedAt: timestamp("reported_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tournaments = pgTable("tournaments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  entry: integer("entry").notNull(),
  prizePool: integer("prize_pool").notNull(),
  format: text("format").notNull(),
  game: text("game").notNull(),
  maxPlayers: integer("max_players").notNull(),
  currentPlayers: integer("current_players").default(0),
  status: text("status").default("open"), // "open", "in_progress", "completed"
  stripeProductId: text("stripe_product_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const kellyPools = pgTable("kelly_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  entry: integer("entry").notNull(),
  pot: integer("pot").notNull(),
  maxPlayers: integer("max_players").notNull(),
  currentPlayers: integer("current_players").default(0),
  balls: text("balls").array(), // JSON array of assigned balls
  status: text("status").default("open"), // "open", "active", "completed"
  table: text("table"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bounties = pgTable("bounties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // "onRank", "onPlayer"
  rank: integer("rank"),
  targetId: text("target_id"),
  prize: integer("prize").notNull(),
  active: boolean("active").default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const charityEvents = pgTable("charity_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  goal: integer("goal").notNull(),
  raised: integer("raised").default(0),
  percentage: real("percentage").default(0.1), // 10% default
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const supportRequests = pgTable("support_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  type: text("type").notNull(), // "birthday", "family", "need"
  description: text("description"),
  amount: integer("amount"),
  status: text("status").default("pending"), // "pending", "approved", "denied"
  createdAt: timestamp("created_at").defaultNow(),
});

export const poolHalls = pgTable("pool_halls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  city: text("city").notNull(),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  points: integer("points").notNull().default(0),
  description: text("description"),
  address: text("address"),
  phone: text("phone"),
  active: boolean("active").default(true),
  battlesUnlocked: boolean("battles_unlocked").default(false),
  unlockedBy: text("unlocked_by"),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const hallMatches = pgTable("hall_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeHallId: text("home_hall_id").notNull(),
  awayHallId: text("away_hall_id").notNull(),
  format: text("format").notNull(), // "team_9ball", "team_8ball", "mixed_format"
  totalRacks: integer("total_racks").notNull().default(9), // First to X racks
  homeScore: integer("home_score").default(0),
  awayScore: integer("away_score").default(0),
  status: text("status").notNull().default("scheduled"), // "scheduled", "in_progress", "completed"
  winnerHallId: text("winner_hall_id"),
  scheduledDate: timestamp("scheduled_date"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  stake: integer("stake").default(0), // Venue entry or prize pool
  createdAt: timestamp("created_at").defaultNow(),
});

export const hallRosters = pgTable("hall_rosters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hallId: text("hall_id").notNull(),
  playerId: text("player_id").notNull(),
  position: text("position"), // "captain", "player", "substitute"
  isActive: boolean("is_active").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const liveStreams = pgTable("live_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull(), // "twitch", "youtube", "facebook", "tiktok", "kick", "other"
  url: text("url").notNull(),
  title: text("title"),
  poolHallName: text("pool_hall_name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  category: text("category").default("casual"), // "tournament", "casual", "practice", "event"
  quality: text("quality").default("hd"), // "hd", "fhd", "4k"
  isLive: boolean("is_live").default(false),
  viewerCount: integer("viewer_count").default(0),
  maxViewers: integer("max_viewers").default(0),
  matchId: text("match_id"),
  hallMatchId: text("hall_match_id"), // Link to inter-hall matches
  tournamentId: text("tournament_id"), // Link to tournaments
  streamerId: text("streamer_id"), // Link to player/user
  embedUrl: text("embed_url"), // Processed embed URL
  thumbnailUrl: text("thumbnail_url"), // Stream thumbnail
  tags: text("tags").array(), // Searchable tags
  language: text("language").default("en"), // Stream language
  createdAt: timestamp("created_at").defaultNow(),
  lastLiveAt: timestamp("last_live_at"),
});

export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at").defaultNow(),
  payloadJson: text("payload_json").notNull(),
});

// Operator settings for customization and free months
export const operatorSettings = pgTable("operator_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorUserId: text("operator_user_id").notNull().unique(), // Links to users table
  cityName: text("city_name").default("Your City"),
  areaName: text("area_name").default("Your Area"),
  customBranding: text("custom_branding"), // Optional custom branding text
  hasFreeMonths: boolean("has_free_months").default(false), // Trustee can toggle this
  freeMonthsCount: integer("free_months_count").default(0), // How many free months left
  freeMonthsGrantedBy: text("free_months_granted_by"), // Which trustee granted it
  freeMonthsGrantedAt: timestamp("free_months_granted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

export const insertPayoutTransferSchema = createInsertSchema(payoutTransfers).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  createdAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
  reportedAt: true,
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true,
  createdAt: true,
});

export const insertKellyPoolSchema = createInsertSchema(kellyPools).omit({
  id: true,
  createdAt: true,
});

export const insertBountySchema = createInsertSchema(bounties).omit({
  id: true,
  createdAt: true,
});

export const insertCharityEventSchema = createInsertSchema(charityEvents).omit({
  id: true,
  createdAt: true,
});

export const insertSupportRequestSchema = createInsertSchema(supportRequests).omit({
  id: true,
  createdAt: true,
});

export const insertPoolHallSchema = createInsertSchema(poolHalls).omit({
  id: true,
  createdAt: true,
});

export const insertHallMatchSchema = createInsertSchema(hallMatches).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertHallRosterSchema = createInsertSchema(hallRosters).omit({
  id: true,
  joinedAt: true,
});

export const insertLiveStreamSchema = createInsertSchema(liveStreams).omit({
  id: true,
  createdAt: true,
  lastLiveAt: true,
  maxViewers: true,
  embedUrl: true,
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  processedAt: true,
});

export const insertOperatorSettingsSchema = createInsertSchema(operatorSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


// Weight Rules tracking table for consecutive losses
export const weightRules = pgTable("weight_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  opponentId: text("opponent_id").notNull(), 
  consecutiveLosses: integer("consecutive_losses").default(0),
  totalLosses: integer("total_losses").default(0),
  weightOwed: boolean("weight_owed").default(false),
  lastLossAt: timestamp("last_loss_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Rookie-specific tables
export const rookieMatches = pgTable("rookie_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challenger: text("challenger").notNull(),
  opponent: text("opponent").notNull(),
  game: text("game").notNull(),
  table: text("table").notNull(),
  fee: integer("fee").notNull().default(6000), // $60 in cents
  commission: integer("commission").notNull().default(200), // $2 in cents
  time: timestamp("time").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("scheduled"), // "scheduled", "completed"
  winner: text("winner"),
  pointsAwarded: integer("points_awarded").default(10), // 10 points for win, 5 for loss
  reportedAt: timestamp("reported_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rookieEvents = pgTable("rookie_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // "tournament", "jackpot", "achievement"
  buyIn: integer("buy_in").default(6000), // $60 in cents
  prizePool: integer("prize_pool").default(0),
  maxPlayers: integer("max_players").default(8),
  currentPlayers: integer("current_players").default(0),
  status: text("status").default("open"), // "open", "active", "completed"
  prizeType: text("prize_type").default("credit"), // "credit", "voucher", "merch"
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rookieAchievements = pgTable("rookie_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  type: text("type").notNull(), // "first_win", "streak_3", "graduated"
  title: text("title").notNull(),
  description: text("description"),
  badge: text("badge"), // Badge icon/image reference
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const rookieSubscriptions = pgTable("rookie_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull().unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  status: text("status").notNull().default("active"), // "active", "cancelled", "expired"
  monthlyFee: integer("monthly_fee").default(2000), // $20 in cents
  startedAt: timestamp("started_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  cancelledAt: timestamp("cancelled_at"),
});

// Insert schemas for rookie tables
export const insertRookieMatchSchema = createInsertSchema(rookieMatches).omit({
  id: true,
  createdAt: true,
  reportedAt: true,
});

export const insertRookieEventSchema = createInsertSchema(rookieEvents).omit({
  id: true,
  createdAt: true,
});

export const insertRookieAchievementSchema = createInsertSchema(rookieAchievements).omit({
  id: true,
  earnedAt: true,
});

export const insertRookieSubscriptionSchema = createInsertSchema(rookieSubscriptions).omit({
  id: true,
  startedAt: true,
});

// Types
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type KellyPool = typeof kellyPools.$inferSelect;
export type InsertKellyPool = z.infer<typeof insertKellyPoolSchema>;
export type Bounty = typeof bounties.$inferSelect;
export type InsertBounty = z.infer<typeof insertBountySchema>;
export type CharityEvent = typeof charityEvents.$inferSelect;
export type InsertCharityEvent = z.infer<typeof insertCharityEventSchema>;
export type SupportRequest = typeof supportRequests.$inferSelect;
export type InsertSupportRequest = z.infer<typeof insertSupportRequestSchema>;
export type PoolHall = typeof poolHalls.$inferSelect;
export type InsertPoolHall = z.infer<typeof insertPoolHallSchema>;
export type HallMatch = typeof hallMatches.$inferSelect;
export type InsertHallMatch = z.infer<typeof insertHallMatchSchema>;
export type HallRoster = typeof hallRosters.$inferSelect;
export type InsertHallRoster = z.infer<typeof insertHallRosterSchema>;
export type LiveStream = typeof liveStreams.$inferSelect;
export type InsertLiveStream = z.infer<typeof insertLiveStreamSchema>;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type OperatorSettings = typeof operatorSettings.$inferSelect;
export type InsertOperatorSettings = z.infer<typeof insertOperatorSettingsSchema>;
export type RookieMatch = typeof rookieMatches.$inferSelect;
export type InsertRookieMatch = z.infer<typeof insertRookieMatchSchema>;
export type RookieEvent = typeof rookieEvents.$inferSelect;
export type InsertRookieEvent = z.infer<typeof insertRookieEventSchema>;
export type RookieAchievement = typeof rookieAchievements.$inferSelect;
export type InsertRookieAchievement = z.infer<typeof insertRookieAchievementSchema>;
export type RookieSubscription = typeof rookieSubscriptions.$inferSelect;
export type InsertRookieSubscription = z.infer<typeof insertRookieSubscriptionSchema>;

// Side Betting System - Wallet and credit-based wagering
export const wallets = pgTable("wallets", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  balanceCredits: integer("balance_credits").default(0), // credits in cents
  balanceLockedCredits: integer("balance_locked_credits").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Side pots for betting
export const sidePots = pgTable("side_pots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").references(() => matches.id),
  creatorId: varchar("creator_id").references(() => users.id),
  sideALabel: varchar("side_a_label"),
  sideBLabel: varchar("side_b_label"),
  stakePerSide: integer("stake_per_side").notNull(), // in credits (cents)
  feeBps: integer("fee_bps").default(800), // 8% default
  status: varchar("status").default("open"), // open|locked|on_hold|resolved|voided
  lockCutoffAt: timestamp("lock_cutoff_at"),
  description: text("description"), // Custom bet description (5-200 chars)
  betType: varchar("bet_type").default("yes_no"), // yes_no|over_under|player_prop
  evidenceJson: text("evidence_json"), // Evidence links, timestamps, notes
  verificationSource: varchar("verification_source"), // Official Stream|Table Referee|Score App Screenshot
  customCreatedBy: varchar("custom_created_by").references(() => users.id), // Track who created custom bet
  winningSide: varchar("winning_side"), // A or B - winner of the bet
  resolvedAt: timestamp("resolved_at"), // When pot was resolved/winner declared
  disputeDeadline: timestamp("dispute_deadline"), // 12 hours after resolution
  disputeStatus: varchar("dispute_status").default("none"), // "none", "pending", "resolved"
  autoResolvedAt: timestamp("auto_resolved_at"), // When auto-resolution happened (12hrs after dispute deadline)
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual bets within side pots
export const sideBets = pgTable("side_bets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sidePotId: varchar("side_pot_id").references(() => sidePots.id),
  userId: varchar("user_id").references(() => users.id),
  side: varchar("side"), // A or B
  amount: integer("amount").notNull(), // credits locked
  status: varchar("status").notNull(), // pending_fund|funded|refunded|paid
  fundedAt: timestamp("funded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial ledger
export const ledger = pgTable("ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type"), // credit_topup, pot_lock, pot_release_win, fee
  amount: integer("amount"), // signed credits
  refId: varchar("ref_id"),
  metaJson: varchar("meta_json"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Side pot resolutions
export const resolutions = pgTable("resolutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sidePotId: varchar("side_pot_id").references(() => sidePots.id),
  winnerSide: varchar("winner_side"), // A or B
  decidedBy: varchar("decided_by").references(() => users.id),
  decidedAt: timestamp("decided_at").defaultNow(),
  notes: varchar("notes"),
});

// Insert schemas for side betting
export const insertWalletSchema = createInsertSchema(wallets).omit({
  createdAt: true,
});

export const insertSidePotSchema = createInsertSchema(sidePots).omit({
  id: true,
  createdAt: true,
});

export const insertSideBetSchema = createInsertSchema(sideBets).omit({
  id: true,
  createdAt: true,
});

export const insertLedgerSchema = createInsertSchema(ledger).omit({
  id: true,
  createdAt: true,
});

export const insertResolutionSchema = createInsertSchema(resolutions).omit({
  id: true,
  decidedAt: true,
});

export const insertWeightRuleSchema = createInsertSchema(weightRules).omit({
  id: true,
  createdAt: true,
});

// Side betting types
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type SidePot = typeof sidePots.$inferSelect;
export type InsertSidePot = z.infer<typeof insertSidePotSchema>;
export type SideBet = typeof sideBets.$inferSelect;
export type InsertSideBet = z.infer<typeof insertSideBetSchema>;
export type LedgerEntry = typeof ledger.$inferSelect;
export type InsertLedgerEntry = z.infer<typeof insertLedgerSchema>;
export type Resolution = typeof resolutions.$inferSelect;
export type InsertResolution = z.infer<typeof insertResolutionSchema>;
export type WeightRule = typeof weightRules.$inferSelect;
export type InsertWeightRule = z.infer<typeof insertWeightRuleSchema>;
