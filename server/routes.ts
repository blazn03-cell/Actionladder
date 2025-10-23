import express, { type Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage as storageInstance, type IStorage } from "./storage";
const storage = storageInstance as unknown as IStorage;
// import { AIService } from "./services/ai-service";
import { setupChallengeCalendarRoutes } from "./routes/challengeCalendar.routes";
import { setupForgotPasswordRoutes } from "./routes/forgotPassword.routes";
import { createICalRoutes } from "./routes/ical.routes";
import { createPosterRoutes } from "./routes/poster.routes";
import { setupPaymentOnboardingRoutes } from "./routes/paymentOnboarding.routes";
import { setupPlayerRoutes } from "./routes/player.routes";
import { setupTournamentRoutes } from "./routes/tournament.routes";
import { setupTeamRoutes } from "./routes/team.routes";
import { setupPoolRoutes } from "./routes/pool.routes";
import { setupFinancialRoutes } from "./routes/financial.routes";
import { setupPredictionRoutes } from "./routes/prediction.routes";
import { setupCharityRoutes } from "./routes/charity.routes";
import { setupTrainingRoutes } from "./routes/training.routes";
import { setupAIRoutes } from "./routes/ai.routes";
import { setupSupportRoutes } from "./routes/support.routes";
import { setupStreamRoutes } from "./routes/stream.routes";
import { setupFileRoutes } from "./routes/file.routes";
import { setupQRRoutes } from "./routes/qr.routes";
import { setupLeagueRoutes } from "./routes/league.routes";
import { setupRookieRoutes } from "./routes/rookie.routes";
import { setupCheckinRoutes } from "./routes/checkin.routes";
import { initializeFeeScheduler } from "./services/feeScheduler";
import { initializeSocketManager } from "./services/challengeSocketEvents";
import { registerAdminRoutes, registerOperatorRoutes } from "./routes/admin.routes";
import { registerAuthRoutes } from "./routes/auth.routes";
import { registerHallRoutes } from "./routes/hall.routes";
import { registerPlayerBillingRoutes } from "./services/playerBilling";
import { registerQuickChallengeRoutes } from "./routes/quickChallenge.routes";
import { registerRevenueAdminRoutes } from "./routes/revenueAdmin.routes";
import { sanitizeResponse } from "./middleware/sanitizeMiddleware";
// import { 
//   insertPlayerSchema, insertMatchSchema, insertTournamentSchema,
//   insertTournamentCalcuttaSchema, insertCalcuttaBidSchema,
//   insertSeasonPredictionSchema, insertPredictionEntrySchema,
//   insertAddedMoneyFundSchema,
//   insertKellyPoolSchema, insertMoneyGameSchema, insertBountySchema, insertCharityEventSchema,
//   insertSupportRequestSchema, insertLiveStreamSchema,
//   insertWalletSchema, insertChallengePoolSchema, insertChallengeEntrySchema,
//   insertLedgerSchema, insertResolutionSchema,
//   insertOperatorSubscriptionSchema,
//   insertCheckinSchema, insertAttitudeVoteSchema, insertAttitudeBallotSchema, insertIncidentSchema,
//   insertMatchDivisionSchema, insertOperatorTierSchema,
//   insertMatchEntrySchema, insertPayoutDistributionSchema,
//   insertUploadedFileSchema, insertFileShareSchema,
//   insertSessionAnalyticsSchema, insertShotSchema,
//   type GlobalRole
// } from "action-ladder-shared/schema";
// import { generateCoachInsights } from './services/coachService';
// import type { SessionData, CoachTip } from './services/coachService';
// import { ObjectStorageService, ObjectNotFoundError } from "./services/objectStorage";
// import { ObjectPermission, getObjectAclPolicy } from "./utils/objectAcl";
// import { emailService } from "./services/email-service";
// import { sanitizeBody, createStripeDescription, sanitizeForStorage } from "./utils/sanitize";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe Price IDs for ActionLadder Commission System
const prices = {
  rookie_monthly: "price_1S36UcDc2BliYufwVpgpOph9", // ActionLadder Rookie Pass ($20/month → $4 operator commission)
  basic_monthly: "price_1S36UcDc2BliYufwF8R8w5BY", // ActionLadder Basic Membership ($25/month → $7 operator commission)
  pro_monthly: "price_1S36UdDc2BliYufwGZmAEVPq", // ActionLadder Pro Membership ($60/month → $10 operator commission)
  small: process.env.SMALL_PRICE_ID, // Operator subscription tiers
  medium: process.env.MEDIUM_PRICE_ID,
  large: process.env.LARGE_PRICE_ID,
  mega: process.env.MEGA_PRICE_ID,
  // Charity Donation System
  charity_product: "prod_Sz4wWq0exnJOBv", // ActionLadder Charity Donations
  charity_donations: {
    "5": "price_1S36mVDc2BliYufwKkppBTdZ",
    "10": "price_1S36mWDc2BliYufw9SnYauG6",
    "25": "price_1S36mWDc2BliYufwdLec5IH6",
    "50": "price_1S36mWDc2BliYufwnyruktLt",
    "100": "price_1S36mWDc2BliYufwMMQxtrpd",
    "250": "price_1S36mXDc2BliYufw8KoRGk5g",
    "500": "price_1S36mXDc2BliYufwhW9OUZng"
  }
};

export async function registerRoutes(app: Express): Promise<Server> {

  // Global response sanitization (sanitizes all outgoing text)
  app.use(sanitizeResponse());

  // Setup Supabase authentication middleware FIRST
  const { setupAuth } = await import("./supabaseAuth");
  await setupAuth(app);

  // Health check endpoint (required for production deployment)
  app.get("/healthz", (_, res) => res.send("ok"));

  // Register authentication routes
  // registerAuthRoutes(app);

  // Register admin routes for staff management and payouts
  registerAdminRoutes(app);

  // Register operator settings routes
  registerOperatorRoutes(app);

  // Register player billing and subscription routes
  registerPlayerBillingRoutes(app);

  // Register hall vs hall match routes
  registerHallRoutes(app);

  // Register financial routes (pricing, billing, refunds, wallet, operator subscriptions, stripe webhook)
  setupFinancialRoutes(app, storage);

  // Register prediction routes (season predictions, prediction entries)
  setupPredictionRoutes(app, storage);

  // Register charity routes (charity events, bounties, added money funds, jackpot)
  setupCharityRoutes(app, storage);

  // Register training routes (training sessions, insights, rewards)
  setupTrainingRoutes(app, storage);

  // Register AI routes (coaching, commentary, predictions, analysis)
  setupAIRoutes(app);

  // Register support routes (support requests)
  setupSupportRoutes(app, storage);

  // Register stream routes (live streams)
  setupStreamRoutes(app, storage);

  // Register file management routes (object storage)
  setupFileRoutes(app, storage);

  // Register QR registration routes
  setupQRRoutes(app);

  // Register league routes (standings, seasons, stats, upcoming matches)
  setupLeagueRoutes(app, storage);

  // Register rookie routes (rookie matches, events, subscriptions, leaderboard, achievements)
  setupRookieRoutes(app, storage);

  // Register check-in routes (check-ins, attitude votes, incidents)
  setupCheckinRoutes(app, storage);

  // ================================
  // CHALLENGE CALENDAR INTEGRATION
  // ================================
  setupChallengeCalendarRoutes(app, storage, stripe);

  // ================================
  // COMPETITIVE DOMAIN ROUTES
  // ================================
  setupPlayerRoutes(app, storage);
  setupTournamentRoutes(app, storage, stripe);
  setupTeamRoutes(app, storage, stripe);
  setupPoolRoutes(app, storage, stripe);

  // Quick Challenge Routes
  registerQuickChallengeRoutes(app);

  // Revenue Configuration Admin Routes
  registerRevenueAdminRoutes(app);

  // iCal Calendar Feed Routes
  app.use('/api/ical', createICalRoutes(storage));

  // AI Poster Generation Routes
  app.use('/api/poster', createPosterRoutes(storage));

  // Payment Onboarding Routes (SetupIntent collection)
  setupPaymentOnboardingRoutes(app, storage);

  // Forgot Password Routes
  setupForgotPasswordRoutes(app);

  // Initialize auto fee evaluation scheduler
  initializeFeeScheduler(storage, stripe);

  // Initialize monthly training rewards scheduler
  const { initializeTrainingRewardsScheduler } = await import('./trainingRewardsScheduler');
  initializeTrainingRewardsScheduler(storage);

  const httpServer = createServer(app);

  // Initialize Socket.IO for real-time challenge updates
  initializeSocketManager(httpServer, storage);

  return httpServer;
}
