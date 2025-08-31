import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
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
  platform: text("platform").notNull(), // "twitch", "youtube", "facebook", "tiktok"
  url: text("url").notNull(),
  title: text("title"),
  isLive: boolean("is_live").default(false),
  viewerCount: integer("viewer_count").default(0),
  matchId: text("match_id"),
  hallMatchId: text("hall_match_id"), // Link to inter-hall matches
  createdAt: timestamp("created_at").defaultNow(),
});

export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at").defaultNow(),
  payloadJson: text("payload_json").notNull(),
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
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  processedAt: true,
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
