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
  // Enhanced authentication fields
  passwordHash: text("password_hash"), // For Creator/Owner email+password auth
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"), // TOTP secret
  phoneNumber: text("phone_number"), // For SMS 2FA
  lastLoginAt: timestamp("last_login_at"),
  loginAttempts: integer("login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  
  // Role and permissions
  globalRole: text("global_role").notNull().default("PLAYER"),
  role: text("role").default("player"), // player, operator, admin for side betting
  
  // Profile and status
  profileComplete: boolean("profile_complete").default(false),
  onboardingComplete: boolean("onboarding_complete").default(false),
  accountStatus: text("account_status").default("active"), // "active", "suspended", "pending"
  
  // Payment integration
  stripeCustomerId: text("stripe_customer_id"),
  stripeConnectId: text("stripe_connect_id").unique(),
  payoutShareBps: integer("payout_share_bps"), // basis points (100 bps = 1%)
  
  // Operator-specific fields
  hallName: text("hall_name"), // For operators
  city: text("city"),
  state: text("state"),
  subscriptionTier: text("subscription_tier"), // "small", "medium", "large", "mega"
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  
  // Commission and earnings tracking
  platformCommissionBps: integer("platform_commission_bps").default(1000), // 10% default in basis points
  operatorCommissionBps: integer("operator_commission_bps").default(500), // 5% default in basis points
  platformEarnings: integer("platform_earnings").default(0), // Platform cut in cents
  operatorEarnings: integer("operator_earnings").default(0), // Operator cut in cents
  prizePoolAmount: integer("prize_pool_amount").default(0), // Remaining for winner in cents
  
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

// Enhanced authentication schemas
export const createOwnerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
  phoneNumber: z.string().optional(),
  twoFactorEnabled: z.boolean().default(false),
});

export const createOperatorSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  hallName: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  subscriptionTier: z.enum(["small", "medium", "large", "mega"]),
  stripePaymentMethodId: z.string(),
});

export const createPlayerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  username: z.string().min(3),
  hallId: z.string(),
  tier: z.enum(["rookie", "barbox", "eight_foot", "nine_foot"]),
  membershipTier: z.enum(["none", "basic", "pro"]).default("none"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorCode: z.string().optional(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: true, // Don't allow direct password hash insertion
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

// === PRICING TIER SYSTEM ===

// Player membership subscriptions with exact pricing from monetization plan
export const membershipSubscriptions = pgTable("membership_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull().unique(),
  tier: text("tier").notNull(), // "rookie", "basic", "pro"
  monthlyPrice: integer("monthly_price").notNull(), // $20/$25/$60 in cents
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  status: text("status").default("active"), // "active", "cancelled", "past_due"
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  perks: text("perks").array(), // Available perks for this tier
  commissionRate: integer("commission_rate").default(1000), // Commission rate in basis points
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Challenge fee commission tracking with round-up profit
export const challengeCommissions = pgTable("challenge_commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: text("challenge_id").notNull(), // Links to match or challenge
  originalAmount: integer("original_amount").notNull(), // Original fee in cents
  commissionRate: integer("commission_rate").notNull(), // Rate in basis points (500-1000)
  calculatedCommission: integer("calculated_commission").notNull(), // Math.ceil(amount * rate)
  roundedCommission: integer("rounded_commission").notNull(), // Rounded up to nearest $1
  actionLadderShare: integer("action_ladder_share").notNull(), // Platform cut in cents
  operatorShare: integer("operator_share").notNull(), // Operator cut in cents  
  bonusFundShare: integer("bonus_fund_share").notNull(), // League bonus pot in cents
  operatorId: text("operator_id").notNull(),
  playerId: text("player_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === ANTI-SANDBAGGING DETECTION ===

// Suspicion scoring system for fair play enforcement
export const suspicionScores = pgTable("suspicion_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  currentScore: real("current_score").notNull().default(0), // 0-10 scale
  winStreakVsHigher: integer("win_streak_vs_higher").default(0), // Wins against higher tier
  breakRunPercent: real("break_run_percent").default(0), // Break and run percentage
  rackDifferentialAvg: real("rack_differential_avg").default(0), // Average rack differential
  suddenRatingDrops: integer("sudden_rating_drops").default(0), // Suspicious rating drops
  operatorFlags: integer("operator_flags").default(0), // Operator suspicious activity reports
  peerReports: integer("peer_reports").default(0), // Peer reports of sandbagging
  outlierPerformance: real("outlier_performance").default(0), // Performance vs expected
  lastCalculated: timestamp("last_calculated").defaultNow(),
  triggerThreshold: real("trigger_threshold").default(7.0), // Auto-review at 7+
  lockThreshold: real("lock_threshold").default(9.0), // Auto-lock at 9+
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dynamic tier adjustments based on performance
export const tierAdjustments = pgTable("tier_adjustments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  fromTier: text("from_tier").notNull(),
  toTier: text("to_tier").notNull(),
  reason: text("reason").notNull(), // "auto_promotion", "sandbagging_detected", "manual_adjustment"
  triggerMetric: text("trigger_metric"), // What triggered the adjustment
  triggerValue: real("trigger_value"), // Value that triggered adjustment
  adminId: text("admin_id"), // Admin who made manual adjustment
  suspicionScore: real("suspicion_score"), // Score at time of adjustment
  effectiveDate: timestamp("effective_date").defaultNow(),
  pastResultsAdjusted: boolean("past_results_adjusted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// === NO-SHOW PREVENTION ===

// Challenge holds and deposits for no-show prevention
export const challengeHolds = pgTable("challenge_holds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: text("challenge_id").notNull(),
  playerId: text("player_id").notNull(),
  holdAmount: integer("hold_amount").notNull(), // Pre-auth amount in cents
  holdType: text("hold_type").notNull(), // "deposit", "challenge_fee", "penalty"
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: text("status").default("active"), // "active", "released", "captured", "forfeited"
  expiresAt: timestamp("expires_at").notNull(),
  releasedAt: timestamp("released_at"),
  forfeitReason: text("forfeit_reason"), // "no_show", "late_cancel", "other"
  createdAt: timestamp("created_at").defaultNow(),
});

// No-show tracking and penalty system
export const noShows = pgTable("no_shows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  challengeId: text("challenge_id").notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  gracePeriod: integer("grace_period").default(10), // Minutes of grace period
  checkInDeadline: timestamp("check_in_deadline").notNull(),
  actualCheckIn: timestamp("actual_check_in"),
  noShowConfirmed: boolean("no_show_confirmed").default(false),
  penaltyApplied: boolean("penalty_applied").default(false),
  penaltyAmount: integer("penalty_amount").default(0), // Penalty in cents
  operatorId: text("operator_id").notNull(),
  opponentId: text("opponent_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Player penalty tracking
export const playerPenalties = pgTable("player_penalties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  penaltyType: text("penalty_type").notNull(), // "no_show", "late_cancel", "sandbagging", "misconduct"
  severity: text("severity").notNull(), // "warning", "minor", "major", "severe"
  description: text("description"),
  relatedChallengeId: text("related_challenge_id"),
  penaltyCount: integer("penalty_count").default(1), // Cumulative count for this type
  suspensionDays: integer("suspension_days").default(0),
  suspensionStart: timestamp("suspension_start"),
  suspensionEnd: timestamp("suspension_end"),
  isActive: boolean("is_active").default(true),
  appliedBy: text("applied_by").notNull(), // Admin or system who applied penalty
  createdAt: timestamp("created_at").defaultNow(),
});

// === REVENUE SHARING AUTOMATION ===

// Operator revenue sharing configuration
export const operatorRevenue = pgTable("operator_revenue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorId: text("operator_id").notNull().unique(),
  hallName: text("hall_name").notNull(),
  baseCommissionRate: integer("base_commission_rate").default(500), // 5% in basis points
  memberCommissionRate: integer("member_commission_rate").default(300), // 3% for members
  monthlyMinimum: integer("monthly_minimum").default(0), // Minimum monthly guarantee
  payoutFrequency: text("payout_frequency").default("weekly"), // "daily", "weekly", "monthly"
  stripeConnectId: text("stripe_connect_id"),
  autoPayoutEnabled: boolean("auto_payout_enabled").default(true),
  lastPayoutAt: timestamp("last_payout_at"),
  totalEarningsToDate: integer("total_earnings_to_date").default(0),
  currentPeriodEarnings: integer("current_period_earnings").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Revenue split calculations for each transaction
export const revenueSplits = pgTable("revenue_splits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: text("transaction_id").notNull(), // Links to match, challenge, etc.
  transactionType: text("transaction_type").notNull(), // "challenge_fee", "membership", "tournament"
  totalAmount: integer("total_amount").notNull(), // Total transaction in cents
  actionLadderShare: integer("action_ladder_share").notNull(), // Platform cut
  operatorShare: integer("operator_share").notNull(), // Operator cut
  bonusFundShare: integer("bonus_fund_share").notNull(), // League bonus fund
  prizePoolShare: integer("prize_pool_share").notNull(), // Remaining for winner
  operatorId: text("operator_id").notNull(),
  playerId: text("player_id"),
  processed: boolean("processed").default(false),
  processedAt: timestamp("processed_at"),
  stripeTransferId: text("stripe_transfer_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === FAIR PLAY ENFORCEMENT ===

// Fair play violations and enforcement actions
export const fairPlayViolations = pgTable("fair_play_violations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  violationType: text("violation_type").notNull(), // "sandbagging", "cheating", "misconduct", "rating_manipulation"
  severity: text("severity").notNull(), // "minor", "major", "severe"
  description: text("description").notNull(),
  evidence: jsonb("evidence"), // Links to footage, reports, etc.
  reportedBy: text("reported_by"), // User ID who reported
  reportedByType: text("reported_by_type"), // "player", "operator", "system", "admin"
  investigatedBy: text("investigated_by"),
  investigationNotes: text("investigation_notes"),
  status: text("status").default("pending"), // "pending", "investigating", "confirmed", "dismissed"
  relatedMatches: text("related_matches").array(), // Array of match IDs
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Penalty ladder system (1st, 2nd, 3rd offense escalation)
export const penaltyLadder = pgTable("penalty_ladder", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  violationId: text("violation_id").notNull(), // Links to fairPlayViolations
  offenseNumber: integer("offense_number").notNull(), // 1st, 2nd, 3rd offense
  penaltyType: text("penalty_type").notNull(), // "warning", "tier_correction", "suspension", "pro_only"
  penaltyDescription: text("penalty_description").notNull(),
  creditLoss: integer("credit_loss").default(0), // Credits forfeited
  suspensionDays: integer("suspension_days").default(0),
  tierRestriction: text("tier_restriction"), // "pro_only", "basic_only", etc.
  publicNotice: boolean("public_notice").default(false), // Fair Play Notice published
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  appliedBy: text("applied_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Play-up incentives and positive reinforcement
export const playUpIncentives = pgTable("play_up_incentives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  incentiveType: text("incentive_type").notNull(), // "play_up_bonus", "upset_king", "savage_spotlight", "fast_track"
  title: text("title").notNull(),
  description: text("description"),
  bonusAmount: integer("bonus_amount").default(0), // Credits or cash bonus
  badgeEarned: text("badge_earned"), // Badge/achievement name
  publicRecognition: boolean("public_recognition").default(false),
  triggerMatch: text("trigger_match"), // Match that triggered incentive
  opponentTier: text("opponent_tier"), // Tier of opponent beaten
  awarded: boolean("awarded").default(false),
  awardedAt: timestamp("awarded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Operator Subscription Management
export const operatorSubscriptions = pgTable("operator_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorId: text("operator_id").notNull().unique(), // Links to users table with globalRole "OPERATOR"
  hallName: text("hall_name").notNull(),
  playerCount: integer("player_count").notNull().default(0),
  tier: text("tier").notNull(), // "small", "medium", "large", "mega"
  basePriceMonthly: integer("base_price_monthly").notNull(), // Base price in cents
  extraPlayersCharge: integer("extra_players_charge").default(0), // Extra player charges in cents
  extraLadders: integer("extra_ladders").default(0), // Number of extra ladders/divisions
  extraLadderCharge: integer("extra_ladder_charge").default(0), // Extra ladder charges in cents
  rookieModuleActive: boolean("rookie_module_active").default(false),
  rookieModuleCharge: integer("rookie_module_charge").default(0), // $50/mo in cents
  rookiePassesActive: integer("rookie_passes_active").default(0), // Number of active rookie passes
  rookiePassCharge: integer("rookie_pass_charge").default(0), // $15/pass/month in cents
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  status: text("status").default("active"), // "active", "cancelled", "past_due"
  billingCycleStart: timestamp("billing_cycle_start").defaultNow(),
  nextBillingDate: timestamp("next_billing_date"),
  totalMonthlyCharge: integer("total_monthly_charge").notNull(), // Calculated total in cents
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team Division System for 3-man and 5-man teams
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  operatorId: text("operator_id").notNull(), // Links to operator
  hallId: text("hall_id"), // Links to pool halls
  captainId: text("captain_id").notNull(), // Team captain player ID
  teamType: text("team_type").notNull(), // "2man", "3man", "5man"
  maxPlayers: integer("max_players").notNull(), // 2, 3, or 5
  maxSubs: integer("max_subs").notNull(), // 2 or 3
  currentPlayers: integer("current_players").default(1), // Start with captain
  currentSubs: integer("current_subs").default(0),
  rosterLocked: boolean("roster_locked").default(false), // Locked for season
  status: text("status").default("active"), // "active", "inactive", "disbanded"
  seasonWins: integer("season_wins").default(0),
  seasonLosses: integer("season_losses").default(0),
  ladderPoints: integer("ladder_points").default(800), // Team ladder points
  consecutiveLosses: integer("consecutive_losses").default(0), // For captain's burden rule
  captainForcedNext: boolean("captain_forced_next").default(false), // Captain must play first after 2 losses
  createdAt: timestamp("created_at").defaultNow(),
});

// Team rosters and player assignments
export const teamPlayers = pgTable("team_players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: text("team_id").notNull(),
  playerId: text("player_id").notNull(),
  role: text("role").notNull(), // "captain", "player", "substitute"
  position: integer("position"), // Lineup order (1-2 for 2man, 1-3 for 3man, 1-5 for 5man)
  isActive: boolean("is_active").default(true),
  seasonWins: integer("season_wins").default(0),
  seasonLosses: integer("season_losses").default(0),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Team matches with special put-up rules
export const teamMatches = pgTable("team_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeTeamId: text("home_team_id").notNull(),
  awayTeamId: text("away_team_id").notNull(),
  operatorId: text("operator_id").notNull(),
  homeScore: integer("home_score").default(0),
  awayScore: integer("away_score").default(0),
  maxSets: integer("max_sets").notNull(), // 2 for 2man, 3 for 3man, 5 for 5man
  currentSet: integer("current_set").default(1),
  status: text("status").default("scheduled"), // "scheduled", "in_progress", "completed"
  winnerTeamId: text("winner_team_id"),
  isHillHill: boolean("is_hill_hill").default(false), // If score tied and at final sets
  putUpRound: text("put_up_round"), // "best_vs_best", "worst_vs_worst"
  homeLineupOrder: text("home_lineup_order").array(), // Secret lineup order
  awayLineupOrder: text("away_lineup_order").array(), // Secret lineup order
  homeLineupRevealed: boolean("home_lineup_revealed").default(false),
  awayLineupRevealed: boolean("away_lineup_revealed").default(false),
  moneyBallActive: boolean("money_ball_active").default(false), // $20 bonus pot active
  moneyBallAmount: integer("money_ball_amount").default(2000), // $20 in cents
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual sets within team matches
export const teamSets = pgTable("team_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamMatchId: text("team_match_id").notNull(),
  setNumber: integer("set_number").notNull(),
  homePlayerId: text("home_player_id").notNull(),
  awayPlayerId: text("away_player_id").notNull(),
  winnerId: text("winner_id"),
  loserId: text("loser_id"),
  isPutUpSet: boolean("is_put_up_set").default(false), // Special best vs best / worst vs worst
  putUpType: text("put_up_type"), // "best_vs_best", "worst_vs_worst"
  isMoneyBallSet: boolean("is_money_ball_set").default(false), // Final deciding set with bonus
  status: text("status").default("scheduled"), // "scheduled", "in_progress", "completed"
  completedAt: timestamp("completed_at"),
  clipUrl: text("clip_url"), // Auto-generated highlight clip for social media
  createdAt: timestamp("created_at").defaultNow(),
});

// Team Challenges: 2-Man Army, 3-Man Crew, 5-Man Squad with fee structures
export const teamChallenges = pgTable("team_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengingTeamId: text("challenging_team_id").notNull(), // Team creating the challenge
  challengeType: text("challenge_type").notNull(), // "2man_army", "3man_crew", "5man_squad"
  individualFee: integer("individual_fee").notNull(), // Fee per player in cents ($10-$10,000)
  totalStake: integer("total_stake").notNull(), // Total team stake (individualFee × team size)
  title: text("title").notNull(), // Challenge title/description
  description: text("description"),
  status: text("status").default("open"), // "open", "accepted", "in_progress", "completed", "cancelled"
  acceptingTeamId: text("accepting_team_id"), // Team that accepts the challenge
  challengePoolId: text("challenge_pool_id"), // Links to existing challenge pool system
  winnerId: text("winner_id"), // Winning team ID
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"), // Challenge expiry time
  requiresProMembership: boolean("requires_pro_membership").default(true), // All team challenges require Pro
  operatorId: text("operator_id").notNull(), // Operator managing this challenge
  createdAt: timestamp("created_at").defaultNow(),
});

// Team Challenge Participants: Links individual players to team challenges
export const teamChallengeParticipants = pgTable("team_challenge_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamChallengeId: text("team_challenge_id").notNull(),
  teamId: text("team_id").notNull(),
  playerId: text("player_id").notNull(),
  feeContribution: integer("fee_contribution").notNull(), // Individual player's fee in cents
  hasPaid: boolean("has_paid").default(false), // Payment status
  membershipTier: text("membership_tier").notNull(), // Must be "pro" for team challenges
  createdAt: timestamp("created_at").defaultNow(),
});

// === SPORTSMANSHIP VOTE-OUT SYSTEM ===

// Track who's checked in at a venue (determines voter eligibility)
export const checkins = pgTable("checkins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  venueId: text("venue_id").notNull(),
  sessionId: text("session_id").notNull(), // Current ladder session ID
  role: text("role").notNull(), // "player", "attendee", "operator"
  verified: boolean("verified").default(false), // QR check-in verification
  createdAt: timestamp("created_at").defaultNow(),
});

// Active sportsmanship votes
export const attitudeVotes = pgTable("attitude_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  targetUserId: text("target_user_id").notNull(), // User being voted on
  sessionId: text("session_id").notNull(), // Current ladder session
  venueId: text("venue_id").notNull(), // Venue where vote is happening
  status: text("status").default("open"), // "open", "closed", "cancelled"
  startedAt: timestamp("started_at").defaultNow(),
  endsAt: timestamp("ends_at").notNull(), // Auto-close time (90 seconds)
  quorumRequired: real("quorum_required").notNull(), // Minimum weighted votes needed
  thresholdRequired: real("threshold_required").notNull(), // % needed to pass (0.65 = 65%)
  result: text("result"), // "pass", "fail_quorum", "fail_threshold"
  createdBy: text("created_by").notNull(), // Operator who initiated
});

// Individual ballots in a vote
export const attitudeBallots = pgTable("attitude_ballots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  voteId: text("vote_id").notNull(), // References attitude_votes.id
  voterUserId: text("voter_user_id").notNull(),
  weight: real("weight").notNull(), // 0.5 (attendee), 1.0 (player), 2.0 (operator)
  choice: text("choice").notNull(), // "out" or "keep"
  tags: text("tags").array(), // ["A", "B", "C", "D"] - violation categories
  note: text("note"), // Optional note (max 140 chars)
  createdAt: timestamp("created_at").defaultNow(),
});

// Moderation incident log
export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(), // User involved in incident
  sessionId: text("session_id"), // Ladder session if applicable
  venueId: text("venue_id"), // Venue if applicable
  type: text("type").notNull(), // "warning", "ejection", "suspension"
  details: text("details").notNull(), // Description of incident
  consequence: text("consequence"), // "ejected_night", "suspended_7d", "suspended_30d"
  pointsPenalty: integer("points_penalty").default(0), // Ladder points deducted
  creditsFine: integer("credits_fine").default(0), // Credits fine in cents
  createdBy: text("created_by"), // Operator who logged incident
  voteId: text("vote_id"), // If this came from a vote-out
  createdAt: timestamp("created_at").defaultNow(),
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
export type OperatorSubscription = typeof operatorSubscriptions.$inferSelect;
export type InsertOperatorSubscription = z.infer<typeof insertOperatorSubscriptionSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type TeamPlayer = typeof teamPlayers.$inferSelect;
export type InsertTeamPlayer = z.infer<typeof insertTeamPlayerSchema>;
export type TeamMatch = typeof teamMatches.$inferSelect;
export type InsertTeamMatch = z.infer<typeof insertTeamMatchSchema>;
export type TeamSet = typeof teamSets.$inferSelect;
export type InsertTeamSet = z.infer<typeof insertTeamSetSchema>;
export type TeamChallenge = typeof teamChallenges.$inferSelect;
export type InsertTeamChallenge = z.infer<typeof insertTeamChallengeSchema>;
export type TeamChallengeParticipant = typeof teamChallengeParticipants.$inferSelect;
export type InsertTeamChallengeParticipant = z.infer<typeof insertTeamChallengeParticipantSchema>;

// Sportsmanship Vote-Out System Types
export type Checkin = typeof checkins.$inferSelect;
export type InsertCheckin = z.infer<typeof insertCheckinSchema>;
export type AttitudeVote = typeof attitudeVotes.$inferSelect;
export type InsertAttitudeVote = z.infer<typeof insertAttitudeVoteSchema>;
export type AttitudeBallot = typeof attitudeBallots.$inferSelect;
export type InsertAttitudeBallot = z.infer<typeof insertAttitudeBallotSchema>;
export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;

// Challenge Pool System - Wallet and credit-based competition entries
export const wallets = pgTable("wallets", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  balanceCredits: integer("balance_credits").default(0), // credits in cents
  balanceLockedCredits: integer("balance_locked_credits").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Challenge pools for competition entries
export const challengePools = pgTable("challenge_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").references(() => matches.id),
  creatorId: varchar("creator_id").references(() => users.id),
  sideALabel: varchar("side_a_label"),
  sideBLabel: varchar("side_b_label"),
  stakePerSide: integer("stake_per_side").notNull(), // in credits (cents)
  feeBps: integer("fee_bps").default(800), // 8% default
  status: varchar("status").default("open"), // open|locked|on_hold|resolved|voided
  lockCutoffAt: timestamp("lock_cutoff_at"),
  description: text("description"), // Custom challenge description (5-200 chars)
  challengeType: varchar("challenge_type").default("yes_no"), // yes_no|over_under|player_prop
  evidenceJson: text("evidence_json"), // Evidence links, timestamps, notes
  verificationSource: varchar("verification_source"), // Official Stream|Table Referee|Score App Screenshot
  customCreatedBy: varchar("custom_created_by").references(() => users.id), // Track who created custom challenge
  winningSide: varchar("winning_side"), // A or B - winner of the challenge
  resolvedAt: timestamp("resolved_at"), // When pool was resolved/winner declared
  disputeDeadline: timestamp("dispute_deadline"), // 12 hours after resolution
  disputeStatus: varchar("dispute_status").default("none"), // "none", "pending", "resolved"
  autoResolvedAt: timestamp("auto_resolved_at"), // When auto-resolution happened (12hrs after dispute deadline)
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual entries within challenge pools
export const challengeEntries = pgTable("challenge_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengePoolId: varchar("challenge_pool_id").references(() => challengePools.id),
  userId: varchar("user_id").references(() => users.id),
  side: varchar("side"), // A or B
  amount: integer("amount").notNull(), // entry credits locked
  status: varchar("status").notNull(), // pending_fund|funded|refunded|paid
  fundedAt: timestamp("funded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial ledger
export const ledger = pgTable("ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type"), // credit_topup, pool_lock, pool_release_win, fee
  amount: integer("amount"), // signed credits
  refId: varchar("ref_id"),
  metaJson: varchar("meta_json"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Challenge pool resolutions
export const resolutions = pgTable("resolutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengePoolId: varchar("challenge_pool_id").references(() => challengePools.id),
  winnerSide: varchar("winner_side"), // A or B
  decidedBy: varchar("decided_by").references(() => users.id),
  decidedAt: timestamp("decided_at").defaultNow(),
  notes: varchar("notes"),
});

// Insert schemas for challenge pools
export const insertWalletSchema = createInsertSchema(wallets).omit({
  createdAt: true,
});

export const insertChallengePoolSchema = createInsertSchema(challengePools).omit({
  id: true,
  createdAt: true,
});

export const insertChallengeEntrySchema = createInsertSchema(challengeEntries).omit({
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

// Insert schemas for operator subscription system
export const insertOperatorSubscriptionSchema = createInsertSchema(operatorSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertTeamPlayerSchema = createInsertSchema(teamPlayers).omit({
  id: true,
  joinedAt: true,
});

export const insertTeamMatchSchema = createInsertSchema(teamMatches).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTeamSetSchema = createInsertSchema(teamSets).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTeamChallengeSchema = createInsertSchema(teamChallenges).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTeamChallengeParticipantSchema = createInsertSchema(teamChallengeParticipants).omit({
  id: true,
  createdAt: true,
});

// Sportsmanship Vote-Out Insert Schemas
export const insertCheckinSchema = createInsertSchema(checkins).omit({
  id: true,
  createdAt: true,
});
export const insertAttitudeVoteSchema = createInsertSchema(attitudeVotes).omit({
  id: true,
  startedAt: true,
});
export const insertAttitudeBallotSchema = createInsertSchema(attitudeBallots).omit({
  id: true,
  createdAt: true,
});
export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  createdAt: true,
});

// Tutoring System for Pro members
export const tutoringSession = pgTable("tutoring_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tutorId: text("tutor_id").notNull(), // Pro member (580+ Fargo)
  rookieId: text("rookie_id").notNull(), // Rookie being tutored
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull().default(30), // Minutes
  status: text("status").notNull().default("scheduled"), // "scheduled", "completed", "cancelled"
  rookieConfirmed: boolean("rookie_confirmed").default(false),
  creditAmount: integer("credit_amount").default(1000), // $10 in cents
  creditApplied: boolean("credit_applied").default(false),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tutoringCredits = pgTable("tutoring_credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tutorId: text("tutor_id").notNull(),
  sessionId: varchar("session_id").references(() => tutoringSession.id),
  amount: integer("amount").notNull(), // Credits in cents
  applied: boolean("applied").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Commission and earnings tracking tables
export const commissionRates = pgTable("commission_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorId: text("operator_id").notNull(), // References users table
  membershipTier: text("membership_tier").notNull(), // "none", "basic", "pro"
  platformCommissionBps: integer("platform_commission_bps").notNull(), // Basis points (1000 = 10%)
  operatorCommissionBps: integer("operator_commission_bps").notNull(), // Basis points
  escrowCommissionBps: integer("escrow_commission_bps").default(250), // 2.5% default for sidepots
  effectiveDate: timestamp("effective_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const platformEarnings = pgTable("platform_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorId: text("operator_id").notNull(),
  sourceType: text("source_type").notNull(), // "match_commission", "membership_fee", "escrow_fee", "tournament_fee"
  sourceId: text("source_id"), // Reference to match, subscription, etc.
  grossAmount: integer("gross_amount").notNull(), // Total amount in cents
  platformAmount: integer("platform_amount").notNull(), // Platform cut in cents
  operatorAmount: integer("operator_amount").notNull(), // Operator cut in cents
  platformCommissionBps: integer("platform_commission_bps").notNull(),
  operatorCommissionBps: integer("operator_commission_bps").notNull(),
  settlementStatus: text("settlement_status").default("pending"), // "pending", "settled", "disputed"
  settledAt: timestamp("settled_at"),
  stripeTransferId: text("stripe_transfer_id"), // For operator payouts
  createdAt: timestamp("created_at").defaultNow(),
});

export const membershipEarnings = pgTable("membership_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: text("subscription_id").notNull(), // Stripe subscription ID
  operatorId: text("operator_id").notNull(),
  playerId: text("player_id").notNull(),
  membershipTier: text("membership_tier").notNull(), // "rookie", "basic", "pro"
  grossAmount: integer("gross_amount").notNull(), // Total membership fee
  platformAmount: integer("platform_amount").notNull(), // Platform share
  operatorAmount: integer("operator_amount").notNull(), // Operator commission
  billingPeriodStart: timestamp("billing_period_start").notNull(),
  billingPeriodEnd: timestamp("billing_period_end").notNull(),
  processedAt: timestamp("processed_at").defaultNow(),
});

export const operatorPayouts = pgTable("operator_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorId: text("operator_id").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalEarnings: integer("total_earnings").notNull(), // Total operator earnings in cents
  matchCommissions: integer("match_commissions").default(0),
  membershipCommissions: integer("membership_commissions").default(0),
  escrowCommissions: integer("escrow_commissions").default(0),
  otherEarnings: integer("other_earnings").default(0),
  stripeTransferId: text("stripe_transfer_id"),
  payoutStatus: text("payout_status").default("pending"), // "pending", "processing", "completed", "failed"
  payoutMethod: text("payout_method").default("stripe_transfer"), // "stripe_transfer", "manual", "held"
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === MATCH DIVISION SYSTEM ===

// Match Divisions: Poolhall vs Poolhall, City vs City, State vs State
export const matchDivisions = pgTable("match_divisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "poolhall", "city", "state"
  displayName: text("display_name").notNull(), // "Poolhall vs Poolhall", "City vs City", "State vs State"
  minTeamSize: integer("min_team_size").notNull(), // 2, 5, 10
  maxTeamSize: integer("max_team_size").notNull(), // 5, 10, 12
  entryFeeMin: integer("entry_fee_min").notNull(), // Minimum entry fee in cents
  entryFeeMax: integer("entry_fee_max").notNull(), // Maximum entry fee in cents
  requiresStreaming: boolean("requires_streaming").default(false), // City and State require streaming
  requiresCaptain: boolean("requires_captain").default(false), // City and State require captain
  allowsSideBets: boolean("allows_side_bets").default(false), // City and State allow side bets
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Operator Tiers with revenue splits
export const operatorTiers = pgTable("operator_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "rookie_hall", "basic_hall", "elite_operator", "franchise"
  displayName: text("display_name").notNull(), // "Rookie Hall", "Basic Hall", etc.
  monthlyFee: integer("monthly_fee").notNull(), // Fee in cents
  revenueSplitPercent: integer("revenue_split_percent").notNull(), // Percentage to Action Ladder (5 or 10)
  maxTeams: integer("max_teams"), // null = unlimited for franchise
  hasPromoTools: boolean("has_promo_tools").default(false),
  hasLiveStreamBonus: boolean("has_live_stream_bonus").default(false),
  hasResellRights: boolean("has_resell_rights").default(false),
  description: text("description"),
  features: text("features").array(), // Array of feature descriptions
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Team Stripe Connect Accounts for payouts
export const teamStripeAccounts = pgTable("team_stripe_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: text("team_id").notNull().unique(), // References teams table
  stripeAccountId: text("stripe_account_id").notNull().unique(), // Stripe Connect Express account ID
  accountStatus: text("account_status").default("pending"), // "pending", "active", "restricted", "inactive"
  onboardingCompleted: boolean("onboarding_completed").default(false),
  detailsSubmitted: boolean("details_submitted").default(false),
  payoutsEnabled: boolean("payouts_enabled").default(false),
  chargesEnabled: boolean("charges_enabled").default(false),
  businessType: text("business_type"), // "individual", "company"
  country: text("country").default("US"),
  email: text("email"),
  lastOnboardingRefresh: timestamp("last_onboarding_refresh"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Match Entries with Stripe metadata and division tracking
export const matchEntries = pgTable("match_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: text("match_id").notNull().unique(), // Unique match identifier
  divisionId: text("division_id").notNull(), // References match_divisions
  homeTeamId: text("home_team_id").notNull(),
  awayTeamId: text("away_team_id"), // null if open challenge
  entryFeePerPlayer: integer("entry_fee_per_player").notNull(), // Fee per player in cents
  totalStake: integer("total_stake").notNull(), // Total match stake
  stripeCheckoutSessionId: text("stripe_checkout_session_id"), // Stripe Checkout session
  stripePaymentIntentId: text("stripe_payment_intent_id"), // Stripe Payment Intent
  paymentStatus: text("payment_status").default("pending"), // "pending", "paid", "failed", "refunded"
  matchStatus: text("match_status").default("open"), // "open", "accepted", "in_progress", "completed", "cancelled"
  winnerId: text("winner_id"), // Winning team ID
  homeScore: integer("home_score").default(0),
  awayScore: integer("away_score").default(0),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  venueId: text("venue_id"), // Where match is played
  streamUrl: text("stream_url"), // Live stream link if applicable
  captainHomeId: text("captain_home_id"), // Team captain for home team
  captainAwayId: text("captain_away_id"), // Team captain for away team
  operatorId: text("operator_id").notNull(), // Managing operator
  metadata: jsonb("metadata"), // Additional match metadata from Stripe
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payout Distribution tracking
export const payoutDistributions = pgTable("payout_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchEntryId: text("match_entry_id").notNull().unique(), // References match_entries
  winningTeamId: text("winning_team_id").notNull(),
  totalPayout: integer("total_payout").notNull(), // Amount paid out in cents
  platformFee: integer("platform_fee").notNull(), // Action Ladder's cut
  operatorFee: integer("operator_fee").notNull(), // Operator's commission
  teamPayout: integer("team_payout").notNull(), // Amount sent to team
  stripeTransferId: text("stripe_transfer_id"), // Stripe Transfer ID
  transferStatus: text("transfer_status").default("pending"), // "pending", "in_transit", "paid", "failed"
  transferredAt: timestamp("transferred_at"),
  operatorTierAtPayout: text("operator_tier_at_payout"), // Tier when payout was made
  revenueSplitAtPayout: integer("revenue_split_at_payout"), // Revenue split % at time of payout
  payoutMethod: text("payout_method").default("stripe_transfer"), // "stripe_transfer", "manual"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Team Registration with entry fees
export const teamRegistrations = pgTable("team_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: text("team_id").notNull(),
  divisionId: text("division_id").notNull(),
  captainId: text("captain_id").notNull(),
  teamName: text("team_name").notNull(),
  logoUrl: text("logo_url"),
  playerRoster: text("player_roster").array(), // Array of player IDs
  entryFeePaid: boolean("entry_fee_paid").default(false),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  registrationStatus: text("registration_status").default("pending"), // "pending", "confirmed", "cancelled"
  confirmedAt: timestamp("confirmed_at"),
  bracketPosition: integer("bracket_position"), // Position in tournament bracket
  seedRank: integer("seed_rank"), // Seeding rank
  operatorId: text("operator_id").notNull(),
  venueId: text("venue_id"),
  seasonId: text("season_id"), // Tournament/season identifier
  metadata: jsonb("metadata"), // Additional registration data
  createdAt: timestamp("created_at").defaultNow(),
});

// Challenge pool types
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type ChallengePool = typeof challengePools.$inferSelect;
export type InsertChallengePool = z.infer<typeof insertChallengePoolSchema>;
export type ChallengeEntry = typeof challengeEntries.$inferSelect;
export type InsertChallengeEntry = z.infer<typeof insertChallengeEntrySchema>;
export type LedgerEntry = typeof ledger.$inferSelect;
export type InsertLedgerEntry = z.infer<typeof insertLedgerSchema>;
export type Resolution = typeof resolutions.$inferSelect;
export type InsertResolution = z.infer<typeof insertResolutionSchema>;
export type WeightRule = typeof weightRules.$inferSelect;
export type InsertWeightRule = z.infer<typeof insertWeightRuleSchema>;

export const insertTutoringSessionSchema = createInsertSchema(tutoringSession).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTutoringCreditsSchema = createInsertSchema(tutoringCredits).omit({
  id: true,
  createdAt: true,
});

export type TutoringSession = typeof tutoringSession.$inferSelect;
export type InsertTutoringSession = z.infer<typeof insertTutoringSessionSchema>;
export type TutoringCredits = typeof tutoringCredits.$inferSelect;
export type InsertTutoringCredits = z.infer<typeof insertTutoringCreditsSchema>;

// Insert schemas for commission and earnings tables
export const insertCommissionRateSchema = createInsertSchema(commissionRates).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformEarningsSchema = createInsertSchema(platformEarnings).omit({
  id: true,
  createdAt: true,
});

export const insertMembershipEarningsSchema = createInsertSchema(membershipEarnings).omit({
  id: true,
  processedAt: true,
});

export const insertOperatorPayoutSchema = createInsertSchema(operatorPayouts).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

// Commission and earnings types
export type CommissionRate = typeof commissionRates.$inferSelect;
export type InsertCommissionRate = z.infer<typeof insertCommissionRateSchema>;
export type PlatformEarnings = typeof platformEarnings.$inferSelect;
export type InsertPlatformEarnings = z.infer<typeof insertPlatformEarningsSchema>;
export type MembershipEarnings = typeof membershipEarnings.$inferSelect;
export type InsertMembershipEarnings = z.infer<typeof insertMembershipEarningsSchema>;
export type OperatorPayout = typeof operatorPayouts.$inferSelect;
export type InsertOperatorPayout = z.infer<typeof insertOperatorPayoutSchema>;

// Insert schemas for new match division system
export const insertMatchDivisionSchema = createInsertSchema(matchDivisions).omit({
  id: true,
  createdAt: true,
});

export const insertOperatorTierSchema = createInsertSchema(operatorTiers).omit({
  id: true,
  createdAt: true,
});

export const insertTeamStripeAccountSchema = createInsertSchema(teamStripeAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMatchEntrySchema = createInsertSchema(matchEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPayoutDistributionSchema = createInsertSchema(payoutDistributions).omit({
  id: true,
  createdAt: true,
});

export const insertTeamRegistrationSchema = createInsertSchema(teamRegistrations).omit({
  id: true,
  createdAt: true,
});

// === FILE UPLOAD TRACKING ===

// Track uploaded files with metadata and access control
export const uploadedFiles = pgTable("uploaded_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(), // Owner of the file
  fileName: text("file_name").notNull(), // Original file name
  fileSize: integer("file_size").notNull(), // File size in bytes
  mimeType: text("mime_type").notNull(), // File MIME type
  category: text("category").notNull().default("general_upload"), // FileCategory from objectStorage
  objectPath: text("object_path").notNull().unique(), // Object storage path (/objects/...)
  visibility: text("visibility").notNull().default("private"), // "public" or "private"
  description: text("description"), // Optional file description
  tags: text("tags").array(), // Searchable tags
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at"),
  downloadCount: integer("download_count").default(0),
  isActive: boolean("is_active").default(true), // Soft delete flag
});

// Track file sharing permissions (extends ACL system)
export const fileShares = pgTable("file_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileId: text("file_id").notNull(), // Links to uploaded_files
  sharedWithUserId: text("shared_with_user_id"), // Specific user (optional)
  sharedWithRole: text("shared_with_role"), // Role-based sharing (optional)
  sharedWithHallId: text("shared_with_hall_id"), // Hall-based sharing (optional)
  permission: text("permission").notNull().default("read"), // "read" or "write"
  expiresAt: timestamp("expires_at"), // Optional expiration
  sharedBy: text("shared_by").notNull(), // User who created the share
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Insert schemas for file tracking
export const insertUploadedFileSchema = createInsertSchema(uploadedFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertFileShareSchema = createInsertSchema(fileShares).omit({
  id: true,
  createdAt: true,
});

// File tracking types
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;
export type FileShare = typeof fileShares.$inferSelect;
export type InsertFileShare = z.infer<typeof insertFileShareSchema>;

// Match division system types
export type MatchDivision = typeof matchDivisions.$inferSelect;
export type InsertMatchDivision = z.infer<typeof insertMatchDivisionSchema>;
export type OperatorTier = typeof operatorTiers.$inferSelect;
export type InsertOperatorTier = z.infer<typeof insertOperatorTierSchema>;
export type TeamStripeAccount = typeof teamStripeAccounts.$inferSelect;
export type InsertTeamStripeAccount = z.infer<typeof insertTeamStripeAccountSchema>;
export type MatchEntry = typeof matchEntries.$inferSelect;
export type InsertMatchEntry = z.infer<typeof insertMatchEntrySchema>;
export type PayoutDistribution = typeof payoutDistributions.$inferSelect;
export type InsertPayoutDistribution = z.infer<typeof insertPayoutDistributionSchema>;
export type TeamRegistration = typeof teamRegistrations.$inferSelect;
export type InsertTeamRegistration = z.infer<typeof insertTeamRegistrationSchema>;
