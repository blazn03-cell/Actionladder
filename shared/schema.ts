import { z } from "zod";

// Player schema
export const playerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  rating: z.number().min(200).max(800),
  city: z.string(),
  member: z.boolean(),
  theme: z.string().optional(),
  points: z.number().min(0),
  wins: z.number().min(0).default(0),
  losses: z.number().min(0).default(0),
  streak: z.number().min(0).default(0),
  achievements: z.array(z.string()).default([]),
  respectPoints: z.number().min(0).default(0),
  birthday: z.string().optional(), // MM-DD format
  specialStatus: z.enum(["none", "birthday", "family_support", "free_pass"]).default("none"),
  freePassesRemaining: z.number().min(0).default(0),
  stripeCustomerId: z.string().optional(),
  subscriptionStatus: z.enum(['none', 'active', 'canceled', 'past_due']).default('none'),
  createdAt: z.number(),
  lastActive: z.number(),
});

// Match schema
export const matchSchema = z.object({
  id: z.string(),
  division: z.enum(["HI", "LO"]),
  challenger: z.string(),
  opponent: z.string(),
  winnerId: z.string().optional(),
  p1Id: z.string(),
  p2Id: z.string(),
  game: z.enum(["Straight 8", "BCA", "Fast 8", "14.1", "Saratoga", "9-Ball", "10-Ball", "1-Pocket"]),
  table: z.enum(["Barbox", "9ft"]),
  stake: z.number().min(60).max(500000),
  time: z.string(),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "reported", "disputed"]),
  winner: z.string().optional(),
  commission: z.number().optional(),
  bountyAward: z.number().optional(),
  reportedAt: z.string().optional(),
  createdAt: z.number(),
});

// Mistake Lab schema
export const mistakeEntrySchema = z.object({
  id: z.string(),
  playerId: z.string(),
  videoId: z.string().optional(),
  time: z.number(), // timestamp in video
  category: z.enum([
    "Shot Selection",
    "Aiming", 
    "Stroke Mechanics",
    "Cue Ball Control",
    "Speed Control",
    "Position Play",
    "Safeties",
    "Kicking & Banking",
    "Break",
    "Pattern Play",
    "Mental Game",
    "Pre‑Shot Routine"
  ]),
  whatHappened: z.string(),
  rootCause: z.string(),
  fix: z.string(),
  drill: z.string(),
  severity: z.number().min(1).max(5),
  resolved: z.boolean().default(false),
  tags: z.string().optional(),
  createdAt: z.number(),
});

// Video schema
export const videoSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  title: z.string(),
  url: z.string(),
  type: z.enum(["file", "url"]),
  fileName: z.string().optional(),
  createdAt: z.number(),
});

// Bounty schema
export const bountySchema = z.object({
  id: z.string(),
  type: z.enum(["onRank", "onPlayer"]),
  playerId: z.string().optional(), // who created bounty
  targetId: z.string().optional(), // specific player target
  rank: z.number().optional(), // rank threshold
  prize: z.number(),
  active: z.boolean().default(true),
  createdAt: z.number(),
});

// Achievement schema
export const achievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  condition: z.string(), // e.g., "win_streak_5", "break_and_run", "king_hill_30_days"
  points: z.number().default(0),
  rarity: z.enum(["common", "rare", "epic", "legendary"]),
});

// Social Content schema
export const socialContentSchema = z.object({
  id: z.string(),
  type: z.enum(["top_10_sunday", "meme_monday", "savage_spotlight", "highlight_reel"]),
  title: z.string(),
  content: z.string(),
  playerId: z.string().optional(),
  mediaUrl: z.string().optional(),
  likes: z.number().default(0),
  week: z.string(), // YYYY-WW format
  featured: z.boolean().default(false),
  createdAt: z.number(),
});

// Special Event schema
export const specialEventSchema = z.object({
  id: z.string(),
  type: z.enum(["birthday", "charity", "support"]),
  playerId: z.string().optional(),
  title: z.string(),
  description: z.string(),
  beneficiary: z.string().optional(), // For charity events
  solidarityPot: z.number().default(0),
  active: z.boolean().default(true),
  month: z.string(), // YYYY-MM format
  createdAt: z.number(),
});

// Stream status schema
export const streamStatusSchema = z.object({
  isLive: z.boolean().default(false),
  platform: z.enum(["twitch", "youtube"]).optional(),
  streamUrl: z.string().optional(),
  embedUrl: z.string().optional(),
  title: z.string().optional(),
  viewers: z.number().default(0),
  lastUpdated: z.number(),
});

// Player queue schema
export const playerQueueSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  city: z.string(),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  preferredGames: z.array(z.string()).default([]),
  status: z.enum(["pending", "approved", "declined"]).default("pending"),
  joinedAt: z.number(),
  approvedAt: z.number().optional(),
});

// Settings schema
export const settingsSchema = z.object({
  commissionMember: z.number().default(0.05),
  commissionNonMember: z.number().default(0.15),
  streakBonus: z.number().default(25),
  jackpotCut: z.number().default(0.02),
  minBet: z.number().default(60),
  maxBet: z.number().default(500000),
  breakAndRunPot: z.number().default(200),
  hillHillFee: z.number().default(10),
  noShowFine: z.number().default(30),
  lateFine: z.number().default(10),
  badSportsmanshipFine: z.number().default(20),
  matchFeeNonMember: z.number().default(12),
  membershipBasic: z.number().default(25),
  membershipPro: z.number().default(40),
  birthdayBonus: z.number().default(25),
  charityPercentage: z.number().default(0.1),
  supportMaxAmount: z.number().default(100),
  googleSheetsUrl: z.string().optional(),
  supabaseEnabled: z.boolean().default(false),
  stripeTestMode: z.boolean().default(true),
});

// Insert schemas
export const insertPlayerSchema = playerSchema.omit({ id: true, createdAt: true });
export const insertMatchSchema = matchSchema.omit({ id: true, createdAt: true });
export const insertMistakeEntrySchema = mistakeEntrySchema.omit({ id: true, createdAt: true });
export const insertVideoSchema = videoSchema.omit({ id: true, createdAt: true });
export const insertBountySchema = bountySchema.omit({ id: true, createdAt: true });
export const insertSocialContentSchema = socialContentSchema.omit({ id: true, createdAt: true });
export const insertSpecialEventSchema = specialEventSchema.omit({ id: true, createdAt: true });
export const insertPlayerQueueSchema = playerQueueSchema.omit({ id: true, joinedAt: true });

// Types
export type Player = z.infer<typeof playerSchema>;
export type Match = z.infer<typeof matchSchema>;
export type MistakeEntry = z.infer<typeof mistakeEntrySchema>;
export type Video = z.infer<typeof videoSchema>;
export type Bounty = z.infer<typeof bountySchema>;
export type Achievement = z.infer<typeof achievementSchema>;
export type SocialContent = z.infer<typeof socialContentSchema>;
export type SpecialEvent = z.infer<typeof specialEventSchema>;
export type StreamStatus = z.infer<typeof streamStatusSchema>;
export type PlayerQueue = z.infer<typeof playerQueueSchema>;
export type Settings = z.infer<typeof settingsSchema>;

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type InsertMistakeEntry = z.infer<typeof insertMistakeEntrySchema>;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type InsertBounty = z.infer<typeof insertBountySchema>;
export type InsertSocialContent = z.infer<typeof insertSocialContentSchema>;
export type InsertSpecialEvent = z.infer<typeof insertSpecialEventSchema>;
export type InsertPlayerQueue = z.infer<typeof insertPlayerQueueSchema>;

// Pool Hall schema for venue management
export const poolHallSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  city: z.string().min(1),
  wins: z.number().min(0).default(0),
  losses: z.number().min(0).default(0),
  points: z.number().min(0).default(0),
  createdAt: z.number(),
});

export const insertPoolHallSchema = poolHallSchema.omit({ id: true, createdAt: true });
export type InsertPoolHall = z.infer<typeof insertPoolHallSchema>;
export type PoolHall = z.infer<typeof poolHallSchema>;