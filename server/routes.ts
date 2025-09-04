import express, { type Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { AIService } from "./ai-service";
import { registerAdminRoutes, registerOperatorRoutes, payStaffFromInvoice } from "./admin-routes";
import { registerHallRoutes } from "./hall-routes";
import { sanitizeBody, sanitizeResponse } from "./sanitizeMiddleware";
import { createSafeCheckoutSession, createSafeProduct, createSafePrice } from "./stripeSafe";
import { 
  insertPlayerSchema, insertMatchSchema, insertTournamentSchema,
  insertKellyPoolSchema, insertBountySchema, insertCharityEventSchema,
  insertSupportRequestSchema, insertLiveStreamSchema,
  insertWalletSchema, insertChallengePoolSchema, insertChallengeEntrySchema,
  insertLedgerSchema, insertResolutionSchema,
  insertOperatorSubscriptionSchema, insertTeamSchema, insertTeamPlayerSchema,
  insertTeamMatchSchema, insertTeamSetSchema,
  insertTeamChallengeSchema, insertTeamChallengeParticipantSchema,
  insertCheckinSchema, insertAttitudeVoteSchema, insertAttitudeBallotSchema, insertIncidentSchema,
  insertMatchDivisionSchema, insertOperatorTierSchema, insertTeamStripeAccountSchema,
  insertMatchEntrySchema, insertPayoutDistributionSchema, insertTeamRegistrationSchema,
  type GlobalRole
} from "@shared/schema";
import { OperatorSubscriptionCalculator } from "./operator-subscription-utils";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

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
  
  // Health check endpoint (required for production deployment)
  app.get("/healthz", (_, res) => res.send("ok"));
  
  // Auth success endpoint for role-based routing
  app.get("/api/auth/success", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const session = req.session as any;
      const intendedRole = session.intendedRole || "player";
      
      // Clear the intended role from session
      delete session.intendedRole;
      
      // Update user role in database if needed
      const user = req.user as any;
      if (user?.claims?.sub) {
        try {
          let dbUser = await storage.getUser(user.claims.sub);
          if (!dbUser) {
            // Create user if doesn't exist
            dbUser = await storage.upsertUser({
              id: user.claims.sub,
              email: user.claims.email,
              name: `${user.claims.first_name || ""} ${user.claims.last_name || ""}`.trim() || user.claims.email || "Unknown User",
            });
          }
          
          // Set role based on intended role
          let globalRole: GlobalRole = "PLAYER";
          if (intendedRole === "admin") {
            globalRole = "OWNER";
          } else if (intendedRole === "operator") {
            globalRole = "STAFF";
          }
          
          // Update user with role if different
          if (dbUser.globalRole !== globalRole) {
            await storage.updateUser(user.claims.sub, { globalRole });
          }
        } catch (error) {
          console.error("Error updating user role:", error);
        }
      }
      
      res.json({ 
        role: intendedRole,
        success: true 
      });
    } catch (error) {
      console.error("Auth success error:", error);
      res.status(500).json({ message: "Authentication error" });
    }
  });
  
  // Register admin routes for staff management and payouts
  registerAdminRoutes(app);
  
  // Register operator settings routes
  registerOperatorRoutes(app);
  
  // Register hall vs hall match routes
  registerHallRoutes(app);
  
  // Player routes
  app.get("/api/players", async (req, res) => {
    try {
      const players = await storage.getAllPlayers();
      res.json(players);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/players", sanitizeBody(["name", "username", "notes", "bio"]), async (req, res) => {
    try {
      const validatedData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(validatedData);
      res.status(201).json(player);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/players/:id", sanitizeBody(["name", "username", "notes", "bio"]), async (req, res) => {
    try {
      const { id } = req.params;
      const player = await storage.updatePlayer(id, req.body);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/players/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePlayer(id);
      if (!deleted) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Rookie graduation route
  app.post("/api/players/graduate", async (req, res) => {
    try {
      const { playerId } = req.body;
      const player = await storage.getPlayer(playerId);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      if (!player.isRookie) {
        return res.status(400).json({ message: "Player is already graduated" });
      }
      
      if (player.rating < 500 && (player.rookieWins || 0) < 10) {
        return res.status(400).json({ 
          message: "Player must have 500+ rating or 10+ rookie wins to graduate" 
        });
      }
      
      const graduatedPlayer = await storage.updatePlayer(playerId, {
        isRookie: false,
        graduatedAt: new Date(),
      });
      
      res.json({ 
        success: true, 
        name: graduatedPlayer?.name,
        message: "Player graduated to main ladder" 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Match routes
  app.get("/api/matches", async (req, res) => {
    try {
      const matches = await storage.getAllMatches();
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/matches", sanitizeBody(["notes", "description", "title"]), async (req, res) => {
    try {
      const validatedData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(validatedData);
      res.status(201).json(match);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/matches/:id", sanitizeBody(["notes", "description", "title"]), async (req, res) => {
    try {
      const { id } = req.params;
      const match = await storage.updateMatch(id, req.body);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      res.json(match);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Tournament routes
  app.get("/api/tournaments", async (req, res) => {
    try {
      const tournaments = await storage.getAllTournaments();
      res.json(tournaments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tournaments", sanitizeBody(["title", "description", "name", "rules"]), async (req, res) => {
    try {
      const validatedData = insertTournamentSchema.parse(req.body);
      const tournament = await storage.createTournament(validatedData);
      res.status(201).json(tournament);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/tournaments/:id", sanitizeBody(["title", "description", "name", "rules"]), async (req, res) => {
    try {
      const { id } = req.params;
      const tournament = await storage.updateTournament(id, req.body);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      res.json(tournament);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Kelly Pool routes
  app.get("/api/kelly-pools", async (req, res) => {
    try {
      const kellyPools = await storage.getAllKellyPools();
      res.json(kellyPools);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/kelly-pools", async (req, res) => {
    try {
      const validatedData = insertKellyPoolSchema.parse(req.body);
      const kellyPool = await storage.createKellyPool(validatedData);
      res.status(201).json(kellyPool);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/kelly-pools/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const kellyPool = await storage.updateKellyPool(id, req.body);
      if (!kellyPool) {
        return res.status(404).json({ message: "Kelly Pool not found" });
      }
      res.json(kellyPool);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Bounty routes
  app.get("/api/bounties", async (req, res) => {
    try {
      const bounties = await storage.getAllBounties();
      res.json(bounties);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/bounties", async (req, res) => {
    try {
      const validatedData = insertBountySchema.parse(req.body);
      const bounty = await storage.createBounty(validatedData);
      res.status(201).json(bounty);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/bounties/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const bounty = await storage.updateBounty(id, req.body);
      if (!bounty) {
        return res.status(404).json({ message: "Bounty not found" });
      }
      res.json(bounty);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Charity Event routes
  app.get("/api/charity-events", async (req, res) => {
    try {
      const events = await storage.getAllCharityEvents();
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/charity-events", async (req, res) => {
    try {
      const validatedData = insertCharityEventSchema.parse(req.body);
      const event = await storage.createCharityEvent(validatedData);
      res.status(201).json(event);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/charity-events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const event = await storage.updateCharityEvent(id, req.body);
      if (!event) {
        return res.status(404).json({ message: "Charity event not found" });
      }
      res.json(event);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Charity Donation Checkout
  app.post("/api/charity/donate", async (req, res) => {
    try {
      const { charityEventId, amount, donorEmail } = req.body;
      
      if (!charityEventId || !amount || amount < 5) {
        return res.status(400).json({ message: "Event ID and minimum $5 donation required" });
      }

      // Get charity event details
      const charityEvent = await storage.getCharityEvent(charityEventId);
      if (!charityEvent) {
        return res.status(404).json({ message: "Charity event not found" });
      }

      // Use predefined price if it matches, otherwise create custom price
      let priceId = (prices.charity_donations as any)[amount.toString()];
      
      if (!priceId) {
        // Create custom price for amounts not in our predefined list
        const customPrice = await stripe.prices.create({
          currency: "usd",
          unit_amount: amount * 100, // Convert to cents
          product: prices.charity_product,
          metadata: {
            type: "charity_donation",
            custom_amount: amount.toString(),
            charity_event_id: charityEventId
          }
        });
        priceId = customPrice.id;
      }

      // Create Stripe checkout session
      const session = await createSafeCheckoutSession({
        mode: "payment",
        customer_email: donorEmail || undefined,
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        success_url: `${process.env.APP_URL || 'http://localhost:5000'}/charity/success?session_id={CHECKOUT_SESSION_ID}&event_id=${charityEventId}`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:5000'}/charity`,
        metadata: {
          type: "charity_donation",
          charity_event_id: charityEventId,
          amount: amount.toString(),
          event_name: charityEvent.name
        },
        payment_intent_data: {
          metadata: {
            type: "charity_donation",
            charity_event_id: charityEventId,
            amount: amount.toString()
          }
        }
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Charity donation error:", error);
      res.status(500).json({ message: "Error creating donation checkout: " + error.message });
    }
  });

  // Support Request routes
  app.get("/api/support-requests", async (req, res) => {
    try {
      const requests = await storage.getAllSupportRequests();
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/support-requests", async (req, res) => {
    try {
      const validatedData = insertSupportRequestSchema.parse(req.body);
      const request = await storage.createSupportRequest(validatedData);
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/support-requests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const request = await storage.updateSupportRequest(id, req.body);
      if (!request) {
        return res.status(404).json({ message: "Support request not found" });
      }
      res.json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Live Stream routes
  app.get("/api/live-streams", async (req, res) => {
    try {
      const streams = await storage.getAllLiveStreams();
      res.json(streams);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/live-streams", async (req, res) => {
    try {
      const validatedData = insertLiveStreamSchema.parse(req.body);
      const stream = await storage.createLiveStream(validatedData);
      res.status(201).json(stream);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/live-streams/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const stream = await storage.updateLiveStream(id, req.body);
      if (!stream) {
        return res.status(404).json({ message: "Live stream not found" });
      }
      res.json(stream);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/live-streams/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteLiveStream(id);
      if (!success) {
        return res.status(404).json({ message: "Live stream not found" });
      }
      res.json({ message: "Live stream deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Enhanced live stream routes
  app.get("/api/live-streams/by-location", async (req, res) => {
    try {
      const { city, state } = req.query;
      const streams = await storage.getLiveStreamsByLocation(city as string, state as string);
      res.json(streams);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/live-streams/stats", async (req, res) => {
    try {
      const stats = await storage.getLiveStreamStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", sanitizeBody(["description", "statement_descriptor"]), async (req, res) => {
    try {
      const { amount, tournamentId, kellyPoolId } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          tournamentId: tournamentId || "",
          kellyPoolId: kellyPoolId || "",
        },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Enhanced Stripe Checkout Session for Subscriptions and One-time Payments
  app.post("/api/billing/checkout", sanitizeBody(["description", "name", "title"]), async (req, res) => {
    try {
      const { priceIds = [], mode = 'subscription', quantities = [], metadata = {}, userId } = req.body;
      
      const line_items = priceIds.map((priceId: string, i: number) => ({
        price: priceId,
        quantity: quantities[i] ?? 1,
      }));

      const session = await createSafeCheckoutSession({
        mode, // 'subscription' or 'payment'
        line_items,
        success_url: `${process.env.APP_BASE_URL || 'http://localhost:5000'}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_BASE_URL || 'http://localhost:5000'}/billing/cancel`,
        allow_promotion_codes: true,
        automatic_tax: { enabled: false },
        client_reference_id: userId,
        metadata: {
          userId: userId || "",
          ...metadata
        }
      });

      res.json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating checkout session: " + error.message });
    }
  });

  // Stripe Customer Portal for Subscription Management
  app.post("/api/billing/portal", async (req, res) => {
    try {
      const { customerId } = req.body;
      
      if (!customerId) {
        return res.status(400).json({ message: "Customer ID required" });
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.APP_BASE_URL || 'http://localhost:5000'}/dashboard`,
      });

      res.json({ url: portalSession.url });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating portal session: " + error.message });
    }
  });

  // Health check endpoint
  app.get("/healthz", (req, res) => {
    res.status(200).send("ok");
  });

  // QR Code generation endpoint
  app.get("/api/qr-code", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url) {
        return res.status(400).json({ message: "URL parameter required" });
      }
      
      // In a real implementation, you would use a QR code library here
      // For now, we'll return a placeholder response
      res.json({ 
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url as string)}` 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Poster generation endpoint
  app.post("/api/generate-poster", async (req, res) => {
    try {
      const { player1, player2, event } = req.body;
      
      // In a real implementation, you would use Canvas or another image generation library
      // For now, we'll return a placeholder response
      res.json({ 
        posterUrl: "/api/poster-placeholder",
        message: "Poster generated successfully" 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Jackpot management
  app.get("/api/jackpot", async (req, res) => {
    try {
      // Calculate jackpot from 2% of all match stakes
      const matches = await storage.getAllMatches();
      const totalStakes = matches
        .filter(m => m.status === "reported")
        .reduce((sum, match) => sum + match.stake, 0);
      
      const jackpot = Math.round(totalStakes * 0.02) + 200; // Base of $200
      
      res.json({ jackpot });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Birthday check endpoint
  app.get("/api/birthday-players", async (req, res) => {
    try {
      const currentDate = new Date();
      const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
      const currentDay = String(currentDate.getDate()).padStart(2, '0');
      const today = `${currentMonth}-${currentDay}`;
      
      const players = await storage.getAllPlayers();
      const birthdayPlayers = players.filter(player => 
        player.birthday && player.birthday === today
      );
      
      res.json(birthdayPlayers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // AI-powered endpoints
  app.post("/api/ai/match-commentary", async (req, res) => {
    try {
      const { matchData } = req.body;
      if (!matchData) {
        return res.status(400).json({ message: "Match data is required" });
      }
      
      const commentary = await AIService.generateMatchCommentary(matchData);
      res.json({ commentary });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/ai/opponent-suggestions/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      const suggestions = await AIService.suggestOpponents(playerId);
      res.json({ suggestions });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/ai/performance-analysis/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      const analysis = await AIService.analyzePlayerPerformance(playerId);
      res.json({ analysis });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/match-prediction", async (req, res) => {
    try {
      const { challengerId, opponentId, gameType } = req.body;
      if (!challengerId || !opponentId || !gameType) {
        return res.status(400).json({ message: "Challenger ID, opponent ID, and game type are required" });
      }
      
      const prediction = await AIService.predictMatchOutcome(challengerId, opponentId, gameType);
      res.json({ prediction });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/coaching", async (req, res) => {
    try {
      const { playerId, topic } = req.body;
      if (!playerId) {
        return res.status(400).json({ message: "Player ID is required" });
      }
      
      const advice = await AIService.getCoachingAdvice(playerId, topic);
      res.json({ advice });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/community-chat", async (req, res) => {
    try {
      const { question } = req.body;
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }
      
      const answer = await AIService.answerCommunityQuestion(question);
      res.json({ answer });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Webhook idempotency functions
  async function alreadyProcessed(eventId: string): Promise<boolean> {
    const existingEvent = await storage.getWebhookEvent(eventId);
    return !!existingEvent;
  }

  async function markProcessed(eventId: string, eventType: string, payload: any): Promise<void> {
    await storage.createWebhookEvent({
      stripeEventId: eventId,
      eventType,
      payloadJson: JSON.stringify(payload)
    });
  }

  // Webhook event handlers
  async function handleCheckoutCompleted(session: any): Promise<void> {
    const userId = session.client_reference_id || session.metadata?.userId;
    
    if (session.mode === 'payment') {
      // Handle one-time payments (tournament entries, kelly pool, etc.)
      if (session.metadata?.tournamentId) {
        const tournamentId = session.metadata.tournamentId;
        const tournament = await storage.getTournament(tournamentId);
        if (tournament) {
          await storage.updateTournament(tournamentId, {
            currentPlayers: (tournament.currentPlayers || 0) + 1
          });
        }
      }
      
      if (session.metadata?.kellyPoolId) {
        const kellyPoolId = session.metadata.kellyPoolId;
        const kellyPool = await storage.getKellyPool(kellyPoolId);
        if (kellyPool) {
          await storage.updateKellyPool(kellyPoolId, {
            currentPlayers: (kellyPool.currentPlayers || 0) + 1
          });
        }
      }
    } else if (session.mode === 'subscription') {
      // Handle subscriptions
      const subscriptionType = session.metadata?.subscriptionType;
      const playerId = session.metadata?.playerId;
      
      if (subscriptionType === 'rookie_pass' && playerId) {
        // Handle Rookie Pass subscription
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now
        
        await storage.createRookieSubscription({
          playerId,
          stripeSubscriptionId: session.subscription as string,
          expiresAt,
        });
        
        // Update player's rookie pass status
        await storage.updatePlayer(playerId, {
          rookiePassActive: true,
          rookiePassExpiresAt: expiresAt,
        });
      } else if (userId) {
        // Handle regular membership subscriptions
        await storage.updatePlayer(userId, {
          member: true,
          stripeCustomerId: session.customer as string
        });
      }
    }
  }

  async function handleSubscription(subscription: any): Promise<void> {
    const userId = subscription.metadata?.userId;
    const playerId = subscription.metadata?.playerId;
    const subscriptionType = subscription.metadata?.subscriptionType;
    
    if (subscriptionType === 'rookie_pass' && playerId) {
      // Handle Rookie Pass subscription status changes
      const isActive = subscription.status === 'active';
      const expiresAt = isActive ? new Date((subscription as any).current_period_end * 1000) : null;
      
      await storage.updatePlayer(playerId, {
        rookiePassActive: isActive,
        rookiePassExpiresAt: expiresAt,
      });
      
      // Update rookie subscription status
      const existingSubscription = await storage.getRookieSubscription(playerId);
      if (existingSubscription) {
        await storage.updateRookieSubscription(playerId, {
          status: subscription.status,
          expiresAt: expiresAt,
        });
      }
    } else if (userId) {
      // Handle regular membership subscriptions
      const isActive = subscription.status === 'active';
      await storage.updatePlayer(userId, {
        member: isActive
      });
    }
  }

  async function handleInvoicePaid(invoice: any): Promise<void> {
    // Handle subscription membership updates
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const userId = subscription.metadata?.userId;
      const playerId = subscription.metadata?.playerId;
      const subscriptionType = subscription.metadata?.subscriptionType;
      
      if (subscriptionType === 'rookie_pass' && playerId) {
        // Handle Rookie Pass renewal
        const expiresAt = new Date((subscription as any).current_period_end * 1000);
        
        await storage.updatePlayer(playerId, {
          rookiePassActive: true,
          rookiePassExpiresAt: expiresAt,
        });
        
        // Update rookie subscription
        const existingSubscription = await storage.getRookieSubscription(playerId);
        if (existingSubscription) {
          await storage.updateRookieSubscription(playerId, {
            expiresAt: expiresAt,
          });
        }
      } else if (userId) {
        // Handle regular membership renewal
        await storage.updatePlayer(userId, {
          member: true
        });
      }
    }
    
    // Automatic payout splitting - 40% owner, 30% friend 1, 30% friend 2
    try {
      await payStaffFromInvoice(invoice);
      console.log(`✅ Revenue split processed for invoice ${invoice.id}`);
    } catch (error: any) {
      console.error(`❌ Revenue split failed for invoice ${invoice.id}:`, error.message);
      // Continue processing - don't fail webhook for payout errors
    }
  }

  async function handleInvoiceFailed(invoice: any): Promise<void> {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      if (subscription.metadata?.userId) {
        console.log(`Payment failed for user: ${subscription.metadata.userId}`);
        // Could implement email notification or account flagging here
      }
    }
  }

  async function handleOneTime(paymentIntent: any): Promise<void> {
    // Handle one-time payments not through Checkout
    console.log(`One-time payment succeeded: ${paymentIntent.id}`);
  }

  async function handleCharityDonation(paymentIntent: any): Promise<void> {
    const { charity_event_id, amount } = paymentIntent.metadata;
    
    if (charity_event_id && amount) {
      try {
        const charityEvent = await storage.getCharityEvent(charity_event_id);
        if (charityEvent) {
          const donationAmount = parseInt(amount);
          await storage.updateCharityEvent(charity_event_id, {
            raised: charityEvent.raised + donationAmount
          });
          console.log(`✅ Charity donation processed: $${donationAmount} for event ${charity_event_id}`);
        }
      } catch (error: any) {
        console.error(`❌ Failed to process charity donation:`, error.message);
      }
    }
  }

  async function handleRefund(charge: any): Promise<void> {
    // Handle refunds
    console.log(`Charge refunded: ${charge.id}`);
  }

  // Stripe Webhook Handler
  app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ message: "Missing webhook secret" });
    }

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (e: any) {
      return res.status(400).send(`Webhook Error: ${e.message}`);
    }

    if (await alreadyProcessed(event.id)) return res.sendStatus(200);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await handleSubscription(event.data.object);
          break;
        case 'invoice.paid':
          await handleInvoicePaid(event.data.object);
          break;
        case 'invoice.payment_failed':
          await handleInvoiceFailed(event.data.object);
          break;
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          if (paymentIntent.metadata?.type === 'charity_donation') {
            await handleCharityDonation(paymentIntent);
          } else {
            await handleOneTime(paymentIntent);
          }
          break;
        case 'charge.refunded':
          await handleRefund(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      await markProcessed(event.id, event.type, event.data.object);
      res.sendStatus(200);
    } catch (error: any) {
      console.error('Webhook handler error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== ESCROW CHALLENGE ENDPOINTS ====================
  app.get("/api/escrow-challenges", async (req, res) => {
    try {
      // Mock data for escrow challenges
      const challenges = [
        {
          id: "challenge-001",
          challengerId: "player-001",
          opponentId: "player-002",
          amount: 500,
          gameType: "8-ball",
          gameFormat: "race-to-7",
          status: "pending",
          escrowId: "escrow-001",
          challenger: { id: "player-001", name: "Tommy 'The Knife' Rodriguez", rating: 650 },
          opponent: { id: "player-002", name: "Sarah 'Pool Shark' Chen", rating: 680 },
          createdAt: new Date(),
        }
      ];
      res.json(challenges);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/escrow-challenges", async (req, res) => {
    try {
      const { amount, opponentId, gameType, gameFormat, terms } = req.body;
      
      // Create Stripe payment intent for escrow
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: "usd",
        metadata: {
          type: "escrow_challenge",
          opponentId,
          gameType,
          gameFormat,
        },
      });

      const challenge = {
        id: `challenge-${Date.now()}`,
        challengerId: "current-user",
        opponentId,
        amount,
        gameType,
        gameFormat,
        status: "pending",
        escrowId: paymentIntent.id,
        terms,
        createdAt: new Date(),
      };

      res.json(challenge);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/escrow-challenges/:id/accept", async (req, res) => {
    try {
      const { id } = req.params;
      // Accept challenge and create escrow for opponent
      res.json({ message: "Challenge accepted", challengeId: id });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/escrow-challenges/stats", async (req, res) => {
    try {
      const stats = {
        totalVolume: 125000,
        activeChallenges: 8,
        completedChallenges: 42,
        totalEscrow: 15000,
      };
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== QR REGISTRATION ENDPOINTS ====================
  app.post("/api/qr-registration/generate", async (req, res) => {
    try {
      const sessionId = `qr-${Date.now()}`;
      const registrationUrl = `${req.protocol}://${req.get('host')}/register/${sessionId}`;
      
      const session = {
        id: sessionId,
        qrCode: "", // Will be generated client-side
        registrationUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        registrations: [],
        active: true,
      };

      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/qr-registration/:sessionId/register", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { name, city, rating, theme, phone, membershipTier } = req.body;
      
      const player = {
        id: `player-${Date.now()}`,
        name,
        city,
        rating: rating || 500,
        theme,
        phone,
        membershipTier: membershipTier || "none",
        registeredVia: "qr",
        createdAt: new Date(),
      };

      res.json(player);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/qr-registration/stats", async (req, res) => {
    try {
      const stats = {
        totalQRRegistrations: 67,
        todayRegistrations: 5,
        activeSession: true,
        recentRegistrations: [],
      };
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/qr-registration/recent", async (req, res) => {
    try {
      const recentRegistrations = [
        {
          id: "player-001",
          name: "Mike 'Chalk Dust' Johnson",
          city: "San Marcos",
          rating: 520,
          theme: "Precision over power",
          createdAt: new Date(),
        }
      ];
      res.json(recentRegistrations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== LEAGUE STANDINGS ENDPOINTS ====================
  app.get("/api/league/standings", async (req, res) => {
    try {
      const standings = [
        {
          id: "hall-001",
          name: "Rack & Roll Billiards",
          city: "San Marcos",
          wins: 12,
          losses: 3,
          points: 850,
          description: "Home of the hustlers",
          roster: [
            {
              id: "roster-001",
              playerId: "player-001",
              hallId: "hall-001",
              position: "Captain",
              isActive: true,
              player: {
                id: "player-001",
                name: "Tommy Rodriguez",
                rating: 650,
                theme: "The Knife"
              }
            }
          ],
          recentMatches: [],
          averageRating: 625,
          totalRacks: 456,
          winPercentage: 80.0,
        }
      ];
      res.json(standings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/league/seasons", async (req, res) => {
    try {
      const seasons = [
        {
          id: "season-001",
          name: "Spring 2024 Championship",
          startDate: new Date("2024-03-01"),
          endDate: new Date("2024-06-01"),
          status: "active",
          totalMatches: 45,
          completedMatches: 32,
          prizePool: 25000,
        }
      ];
      res.json(seasons);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/league/stats", async (req, res) => {
    try {
      const stats = {
        totalHalls: 6,
        totalPlayers: 78,
        totalMatches: 156,
        totalPrizePool: 25000,
        avgMatchStake: 750,
        topHall: "Rack & Roll Billiards",
      };
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/league/upcoming-matches", async (req, res) => {
    try {
      const matches = [
        {
          id: "match-001",
          homeHallId: "hall-001",
          awayHallId: "hall-002",
          format: "Best of 9",
          totalRacks: 9,
          homeScore: 0,
          awayScore: 0,
          status: "scheduled",
          scheduledDate: "2024-03-15",
          stake: 150000, // In cents
          homeHall: { name: "Rack & Roll Billiards" },
          awayHall: { name: "Corner Pocket Palace" },
        }
      ];
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ==================== POSTER GENERATION ENDPOINTS ====================
  app.post("/api/posters", async (req, res) => {
    try {
      const { title, subtitle, playerAId, playerBId, theme, imageData } = req.body;
      
      const poster = {
        id: `poster-${Date.now()}`,
        title,
        subtitle,
        playerAId,
        playerBId,
        theme,
        url: imageData, // In production, save to file storage
        createdAt: new Date(),
      };

      res.json(poster);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/posters", async (req, res) => {
    try {
      const posters = [
        {
          id: "poster-001",
          title: "FIGHT NIGHT",
          subtitle: "Championship Match",
          url: "/placeholder-poster.png",
          theme: "fight-night",
          playerA: { name: "Tommy Rodriguez" },
          playerB: { name: "Sarah Chen" },
          createdAt: new Date(),
        }
      ];
      res.json(posters);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Rookie System API Routes
  
  // Rookie Matches
  app.get("/api/rookie/matches", async (req, res) => {
    try {
      const matches = await storage.getAllRookieMatches();
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/rookie/matches/player/:playerId", async (req, res) => {
    try {
      const matches = await storage.getRookieMatchesByPlayer(req.params.playerId);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/rookie/matches", async (req, res) => {
    try {
      const match = await storage.createRookieMatch(req.body);
      res.json(match);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/rookie/matches/:id/complete", async (req, res) => {
    try {
      const { id } = req.params;
      const { winner } = req.body;
      
      const match = await storage.updateRookieMatch(id, {
        status: "completed",
        winner,
        reportedAt: new Date(),
      });

      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      // Update player stats and points
      const pointsForWin = 10;
      const pointsForLoss = 5;
      
      const winnerPlayer = await storage.getPlayer(winner);
      const loserPlayerId = match.challenger === winner ? match.opponent : match.challenger;
      const loserPlayer = await storage.getPlayer(loserPlayerId);

      if (winnerPlayer && winnerPlayer.isRookie) {
        await storage.updatePlayer(winner, {
          rookieWins: (winnerPlayer.rookieWins || 0) + 1,
          rookiePoints: (winnerPlayer.rookiePoints || 0) + pointsForWin,
          rookieStreak: (winnerPlayer.rookieStreak || 0) + 1,
        });

        // Check for graduation (100 points)
        const newRookiePoints = (winnerPlayer.rookiePoints || 0) + pointsForWin;
        if (newRookiePoints >= 100) {
          await storage.promoteRookieToMainLadder(winner);
        }

        // Check for achievements
        if ((winnerPlayer.rookieWins || 0) === 0) {
          await storage.createRookieAchievement({
            playerId: winner,
            type: "first_win",
            title: "First Rookie Win",
            description: "Won your first rookie match",
            badge: "🥇",
          });
        }

        if ((winnerPlayer.rookieStreak || 0) + 1 === 3) {
          await storage.createRookieAchievement({
            playerId: winner,
            type: "streak_3",
            title: "3-Win Streak",
            description: "Won 3 rookie matches in a row",
            badge: "🔥",
          });
        }
      }

      if (loserPlayer && loserPlayer.isRookie) {
        await storage.updatePlayer(loserPlayerId, {
          rookieLosses: (loserPlayer.rookieLosses || 0) + 1,
          rookiePoints: (loserPlayer.rookiePoints || 0) + pointsForLoss,
          rookieStreak: 0, // Reset streak
        });
      }

      res.json(match);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Rookie Events
  app.get("/api/rookie/events", async (req, res) => {
    try {
      const events = await storage.getAllRookieEvents();
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/rookie/events", async (req, res) => {
    try {
      const event = await storage.createRookieEvent(req.body);
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Rookie Leaderboard
  app.get("/api/rookie/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getRookieLeaderboard();
      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Rookie Achievements
  app.get("/api/rookie/achievements/:playerId", async (req, res) => {
    try {
      const achievements = await storage.getRookieAchievementsByPlayer(req.params.playerId);
      res.json(achievements);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Rookie Subscriptions
  app.get("/api/rookie/subscription/:playerId", async (req, res) => {
    try {
      const subscription = await storage.getRookieSubscription(req.params.playerId);
      res.json(subscription || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/rookie/subscription", async (req, res) => {
    try {
      const { playerId } = req.body;
      
      if (!playerId) {
        return res.status(400).json({ message: "Player ID is required" });
      }

      // Create Stripe checkout session for Rookie Pass subscription
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{
          price: prices.rookie_monthly,
          quantity: 1,
        }],
        success_url: `${process.env.APP_BASE_URL || 'http://localhost:5000'}/?rookie_subscription=success`,
        cancel_url: `${process.env.APP_BASE_URL || 'http://localhost:5000'}/?rookie_subscription=cancelled`,
        metadata: {
          playerId,
          subscriptionType: 'rookie_pass'
        },
        allow_promotion_codes: true,
        automatic_tax: { enabled: false },
      });

      res.json({ 
        checkoutUrl: session.url,
        sessionId: session.id 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Side Betting System Routes
  
  // Wallet management
  app.get("/api/wallet/:userId", async (req, res) => {
    try {
      let wallet = await storage.getWallet(req.params.userId);
      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = await storage.createWallet({
          userId: req.params.userId,
          balanceCredits: 0,
          balanceLockedCredits: 0,
        });
      }
      res.json(wallet);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Credit wallet via Stripe
  app.post("/api/wallet/:userId/topup", async (req, res) => {
    try {
      const { amount } = req.body; // Amount in USD dollars
      const userId = req.params.userId;
      
      if (!amount || amount < 5) {
        return res.status(400).json({ message: "Minimum top-up is $5" });
      }

      // Create Stripe payment intent for wallet top-up
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId,
          type: "wallet_topup",
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: amount
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Complete wallet top-up after payment
  app.post("/api/wallet/:userId/topup/complete", async (req, res) => {
    try {
      const { paymentIntentId, amount } = req.body;
      const userId = req.params.userId;
      
      // Verify payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      // Credit the wallet
      const wallet = await storage.creditWallet(userId, amount * 100); // Convert to cents
      
      // Create ledger entry
      await storage.createLedgerEntry({
        userId,
        type: "credit_topup",
        amount: amount * 100,
        refId: paymentIntentId,
        metaJson: JSON.stringify({ paymentMethod: "stripe" }),
      });

      res.json(wallet);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get user's ledger/transaction history
  app.get("/api/wallet/:userId/ledger", async (req, res) => {
    try {
      const entries = await storage.getLedgerByUser(req.params.userId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Side Pot management
  app.get("/api/side-pots", async (req, res) => {
    try {
      const { matchId, status } = req.query;
      let pots;
      
      if (matchId) {
        pots = await storage.getSidePotsByMatch(matchId as string);
      } else if (status) {
        pots = await storage.getSidePotsByStatus(status as string);
      } else {
        pots = await storage.getAllSidePots();
      }
      
      res.json(pots);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/side-pots", async (req, res) => {
    try {
      const validatedData = insertChallengePoolSchema.parse(req.body);
      
      // Validate pot size limits
      const stakePerSideDollars = validatedData.stakePerSide / 100;
      if (stakePerSideDollars < 5) {
        return res.status(400).json({ message: "Minimum stake per side is $5" });
      }
      if (stakePerSideDollars > 100000) {
        return res.status(400).json({ message: "Maximum stake per side is $100,000" });
      }
      
      // Calculate tiered service fee
      const totalPotDollars = (validatedData.stakePerSide * 2) / 100;
      const serviceFeesBps = totalPotDollars > 500 ? 500 : 850; // 5% vs 8.5%
      
      const potData = {
        ...validatedData,
        feeBps: serviceFeesBps,
        customCreatedBy: validatedData.creatorId, // Track who created this custom bet
      };
      
      const pool = await storage.createSidePot(potData);
      res.status(201).json(pool);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/side-pots/:id", async (req, res) => {
    try {
      const pool = await storage.updateSidePot(req.params.id, req.body);
      if (!pool) {
        return res.status(404).json({ message: "Side pot not found" });
      }
      res.json(pool);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get side pot with all bets
  app.get("/api/side-pots/:id/details", async (req, res) => {
    try {
      const pot = await storage.getSidePot(req.params.id);
      if (!pot) {
        return res.status(404).json({ message: "Side pot not found" });
      }
      
      const bets = await storage.getSideBetsByPot(req.params.id);
      const resolution = await storage.getResolutionByPot(req.params.id);
      
      res.json({ pot, bets, resolution });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Side Bet management
  app.post("/api/side-bets", async (req, res) => {
    try {
      const { sidePotId, userId, side, amount } = req.body;
      
      // Check if pot is still open
      const pool = await storage.getChallengePool(sidePotId);
      if (!pool || pool.status !== 'open') {
        return res.status(400).json({ message: "Side pot is not accepting bets" });
      }
      
      // Check if user has enough credits and lock them
      const locked = await storage.lockCredits(userId, amount);
      if (!locked) {
        return res.status(400).json({ message: "Insufficient credits" });
      }
      
      const entry = await storage.createChallengeEntry({
        challengePoolId: sidePotId,
        userId,
        side,
        amount,
        status: "funded",
        fundedAt: new Date(),
      });
      
      // Create ledger entry
      await storage.createLedgerEntry({
        userId,
        type: "pot_lock",
        amount: -amount,
        refId: entry.id,
        metaJson: JSON.stringify({ sidePotId, side }),
      });
      
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/side-bets/user/:userId", async (req, res) => {
    try {
      const bets = await storage.getSideBetsByUser(req.params.userId);
      res.json(bets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Resolution management (operator only)
  app.post("/api/side-pots/:id/resolve", async (req, res) => {
    try {
      const { winnerSide, decidedBy, notes, evidence } = req.body;
      const challengePoolId = req.params.id;
      
      // Check if already resolved
      const existingResolution = await storage.getResolutionByPot(challengePoolId);
      if (existingResolution) {
        return res.status(400).json({ message: "Side pot already resolved" });
      }
      
      const pool = await storage.getChallengePool(challengePoolId);
      if (!pool) {
        return res.status(404).json({ message: "Side pot not found" });
      }
      
      // Check if pot is in lockable status
      if (!["locked", "on_hold"].includes(pool.status)) {
        return res.status(400).json({ message: "Side pot cannot be resolved in current status" });
      }
      
      // Create resolution with evidence tracking
      const resolution = await storage.createResolution({
        challengePoolId,
        winnerSide,
        decidedBy,
        notes,
      });
      
      // Set resolution timestamp and 12-hour dispute deadline
      const now = new Date();
      const disputeDeadline = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now
      
      // Update pot status with dispute tracking and evidence
      await storage.updateSidePot(challengePoolId, { 
        status: "resolved",
        winningSide: winnerSide,
        resolvedAt: now,
        disputeDeadline: disputeDeadline,
        disputeStatus: "none",
        evidenceJson: evidence ? JSON.stringify(evidence) : null,
      });
      
      // Process payouts immediately for operator resolutions
      const bets = await storage.getSideBetsByPot(challengePoolId);
      const winners = bets.filter(bet => bet.side === winnerSide);
      const losers = bets.filter(bet => bet.side !== winnerSide);
      
      const totalPool = bets.reduce((sum, bet) => sum + bet.amount, 0);
      const serviceFee = Math.floor(totalPool * (pool.feeBps / 10000));
      const winnerPool = totalPool - serviceFee;
      const totalWinnerAmount = winners.reduce((sum, bet) => sum + bet.amount, 0);
      
      // Distribute winnings
      for (const bet of winners) {
        const proportion = bet.amount / totalWinnerAmount;
        const winnings = Math.floor(winnerPool * proportion);
        
        // Credit the user
        await storage.unlockCredits(bet.userId!, bet.amount); // Unlock locked funds
        await storage.addCredits(bet.userId!, winnings); // Add winnings
        
        // Create ledger entries
        await storage.createLedgerEntry({
          userId: bet.userId!,
          type: "pot_win",
          amount: winnings,
          refId: bet.id,
          metaJson: JSON.stringify({ sidePotId: challengePoolId, originalBet: bet.amount }),
        });
        
        await storage.createLedgerEntry({
          userId: bet.userId!,
          type: "pot_unlock",
          amount: bet.amount,
          refId: bet.id,
          metaJson: JSON.stringify({ sidePotId: challengePoolId }),
        });
      }
      
      // Unlock losing bets (they lose their credits)
      for (const bet of losers) {
        await storage.unlockCredits(bet.userId!, bet.amount);
        
        await storage.createLedgerEntry({
          userId: bet.userId!,
          type: "pot_loss",
          amount: -bet.amount,
          refId: bet.id,
          metaJson: JSON.stringify({ sidePotId: challengePoolId }),
        });
      }
      
      console.log(`Side pot ${challengePoolId} resolved with immediate payout. ${winners.length} winners, ${losers.length} losers.`);
      
      res.json({ 
        resolution, 
        winners: winners.length,
        losers: losers.length,
        totalPot: totalPool,
        serviceFee,
        disputeDeadline: disputeDeadline.toISOString(),
        message: "Side pot resolved and payouts distributed immediately."
      });
    } catch (error: any) {
      console.error("Error resolving side pot:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Check for auto-resolution of expired dispute periods
  app.post("/api/side-pots/check-auto-resolve", async (req, res) => {
    try {
      const now = new Date();
      
      // Find resolved pots where dispute deadline has passed and no dispute filed
      const expiredPots = await storage.getExpiredDisputePots(now);
      const autoResolvedPots = [];
      
      for (const pot of expiredPots) {
        // Process the final payouts
        const payoutResult = await storage.processDelayedPayouts(pot.id, pot.winningSide || "A");
        
        // Mark as auto-resolved
        await storage.updateSidePot(pot.id, { 
          autoResolvedAt: now,
          disputeStatus: "resolved" 
        });
        
        autoResolvedPots.push({ potId: pot.id, payoutResult });
        console.log(`Auto-resolved side pot ${pot.id} after dispute period expired`);
      }
      
      res.json({ 
        autoResolvedCount: autoResolvedPots.length,
        resolvedPots: autoResolvedPots 
      });
    } catch (error) {
      console.error("Error auto-resolving disputes:", error);
      res.status(500).json({ message: "Failed to auto-resolve disputes" });
    }
  });

  // Put side pot on hold for evidence review
  app.post("/api/side-pots/:id/hold", async (req, res) => {
    try {
      const { reason, evidence } = req.body;
      const challengePoolId = req.params.id;
      
      const pool = await storage.getChallengePool(challengePoolId);
      if (!pool) {
        return res.status(404).json({ message: "Side pot not found" });
      }
      
      if (pool.status !== "locked") {
        return res.status(400).json({ message: "Only locked pots can be put on hold" });
      }
      
      // Update pot status to on_hold with evidence request
      const now = new Date();
      const holdDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      await storage.updateSidePot(challengePoolId, { 
        status: "on_hold",
        holdDeadline,
        evidenceJson: evidence ? JSON.stringify(evidence) : null,
      });
      
      console.log(`Side pot ${challengePoolId} put on hold for evidence review. Deadline: ${holdDeadline.toISOString()}`);
      
      res.json({ 
        message: "Side pot put on hold for evidence review",
        holdDeadline: holdDeadline.toISOString(),
        reason
      });
    } catch (error: any) {
      console.error("Error putting pot on hold:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Void side pot and refund all participants
  app.post("/api/side-pots/:id/void", async (req, res) => {
    try {
      const { reason } = req.body;
      const challengePoolId = req.params.id;
      
      const pool = await storage.getChallengePool(challengePoolId);
      if (!pool) {
        return res.status(404).json({ message: "Side pot not found" });
      }
      
      if (!["locked", "on_hold"].includes(pool.status)) {
        return res.status(400).json({ message: "Only locked or on-hold pots can be voided" });
      }
      
      // Get all bets for this pot
      const bets = await storage.getSideBetsByPot(challengePoolId);
      let refundCount = 0;
      let totalRefunded = 0;
      
      // Refund all participants
      for (const bet of bets) {
        // Unlock and refund the credits
        await storage.unlockCredits(bet.userId!, bet.amount);
        
        // Create refund ledger entry
        await storage.createLedgerEntry({
          userId: bet.userId!,
          type: "pot_void_refund",
          amount: bet.amount,
          refId: bet.id,
          metaJson: JSON.stringify({ sidePotId: challengePoolId, voidReason: reason }),
        });
        
        refundCount++;
        totalRefunded += bet.amount;
      }
      
      // Update pot status to voided
      const now = new Date();
      await storage.updateSidePot(challengePoolId, { 
        status: "voided",
        voidedAt: now,
      });
      
      console.log(`Side pot ${sidePotId} voided. Refunded ${refundCount} participants, total: ${totalRefunded} credits`);
      
      res.json({ 
        message: "Side pot voided and all participants refunded",
        refundCount,
        totalRefunded,
        reason
      });
    } catch (error: any) {
      console.error("Error voiding side pot:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // File a dispute (within 12 hours of resolution)
  app.post("/api/side-pots/:id/dispute", async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const sidePot = await storage.getSidePot(id);
      if (!sidePot) {
        return res.status(404).json({ message: "Side pot not found" });
      }

      if (sidePot.status !== "resolved") {
        return res.status(400).json({ message: "Side pot is not resolved" });
      }

      if (!sidePot.disputeDeadline || new Date() > sidePot.disputeDeadline) {
        return res.status(400).json({ message: "Dispute period has expired (12 hours max)" });
      }

      if (sidePot.disputeStatus === "pending") {
        return res.status(400).json({ message: "Dispute already filed for this pot" });
      }

      // Mark dispute as pending
      await storage.updateSidePot(id, { disputeStatus: "pending" });
      
      // In a real system, you might create a separate disputes table
      // For now, we'll just update the pot status
      
      res.json({ 
        message: "Dispute filed successfully. Payouts are now on hold pending review.",
        disputeDeadline: sidePot.disputeDeadline
      });
    } catch (error) {
      console.error("Error filing dispute:", error);
      res.status(500).json({ message: "Failed to file dispute" });
    }
  });

  // Operator Subscription Routes
  app.get("/api/operator-subscriptions", async (req, res) => {
    try {
      const subscriptions = await storage.getAllOperatorSubscriptions();
      res.json(subscriptions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/operator-subscriptions/:operatorId", async (req, res) => {
    try {
      const { operatorId } = req.params;
      const subscription = await storage.getOperatorSubscription(operatorId);
      if (!subscription) {
        return res.status(404).json({ message: "Operator subscription not found" });
      }
      res.json(subscription);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/operator-subscriptions", async (req, res) => {
    try {
      const validatedData = insertOperatorSubscriptionSchema.parse(req.body);
      const subscription = await storage.createOperatorSubscription(validatedData);
      res.status(201).json(subscription);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/operator-subscriptions/:operatorId", async (req, res) => {
    try {
      const { operatorId } = req.params;
      const subscription = await storage.updateOperatorSubscription(operatorId, req.body);
      if (!subscription) {
        return res.status(404).json({ message: "Operator subscription not found" });
      }
      res.json(subscription);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get subscription pricing calculator
  app.post("/api/operator-subscriptions/calculate", async (req, res) => {
    try {
      const { playerCount, extraLadders = 0, rookieModuleActive = false, rookiePassesActive = 0 } = req.body;
      
      if (!playerCount || playerCount < 1) {
        return res.status(400).json({ message: "Player count is required and must be at least 1" });
      }
      
      const pricing = OperatorSubscriptionCalculator.calculateTotalCost({
        playerCount,
        extraLadders,
        rookieModuleActive,
        rookiePassesActive
      });
      
      res.json(pricing);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Team Management Routes
  app.get("/api/teams", async (req, res) => {
    try {
      const { operatorId, hallId } = req.query;
      let teams;
      
      if (operatorId) {
        teams = await storage.getTeamsByOperator(operatorId as string);
      } else if (hallId) {
        teams = await storage.getTeamsByHall(hallId as string);
      } else {
        return res.status(400).json({ message: "operatorId or hallId parameter required" });
      }
      
      res.json(teams);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const validatedData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/teams/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const team = await storage.updateTeam(id, req.body);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/teams/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTeam(id);
      if (!deleted) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Team Player Routes
  app.get("/api/team-players", async (req, res) => {
    try {
      const { teamId, playerId } = req.query;
      let teamPlayers;
      
      if (teamId) {
        teamPlayers = await storage.getTeamPlayersByTeam(teamId as string);
      } else if (playerId) {
        teamPlayers = await storage.getTeamPlayersByPlayer(playerId as string);
      } else {
        return res.status(400).json({ message: "teamId or playerId parameter required" });
      }
      
      res.json(teamPlayers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/team-players", async (req, res) => {
    try {
      const validatedData = insertTeamPlayerSchema.parse(req.body);
      
      // Check if team has space
      const team = await storage.getTeam(validatedData.teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const existingPlayers = await storage.getTeamPlayersByTeam(validatedData.teamId);
      const currentPlayerCount = existingPlayers.filter(p => p.role !== "substitute").length;
      const currentSubCount = existingPlayers.filter(p => p.role === "substitute").length;
      
      if (validatedData.role === "substitute") {
        if (currentSubCount >= team.maxSubs) {
          return res.status(400).json({ message: `Team already has maximum substitutes (${team.maxSubs})` });
        }
      } else {
        if (currentPlayerCount >= team.maxPlayers) {
          return res.status(400).json({ message: `Team already has maximum players (${team.maxPlayers})` });
        }
      }
      
      const teamPlayer = await storage.createTeamPlayer(validatedData);
      
      // Update team player counts
      if (validatedData.role === "substitute") {
        await storage.updateTeam(validatedData.teamId, { currentSubs: currentSubCount + 1 });
      } else {
        await storage.updateTeam(validatedData.teamId, { currentPlayers: currentPlayerCount + 1 });
      }
      
      res.status(201).json(teamPlayer);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/team-players/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const teamPlayer = await storage.getTeamPlayer(id);
      if (!teamPlayer) {
        return res.status(404).json({ message: "Team player not found" });
      }
      
      const deleted = await storage.removeTeamPlayer(id);
      if (!deleted) {
        return res.status(404).json({ message: "Team player not found" });
      }
      
      // Update team player counts
      const team = await storage.getTeam(teamPlayer.teamId);
      if (team) {
        if (teamPlayer.role === "substitute") {
          await storage.updateTeam(teamPlayer.teamId, { 
            currentSubs: Math.max(0, team.currentSubs - 1) 
          });
        } else {
          await storage.updateTeam(teamPlayer.teamId, { 
            currentPlayers: Math.max(0, team.currentPlayers - 1) 
          });
        }
      }
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Team Match Routes
  app.get("/api/team-matches", async (req, res) => {
    try {
      const { teamId, operatorId } = req.query;
      let matches;
      
      if (teamId) {
        matches = await storage.getTeamMatchesByTeam(teamId as string);
      } else if (operatorId) {
        matches = await storage.getTeamMatchesByOperator(operatorId as string);
      } else {
        return res.status(400).json({ message: "teamId or operatorId parameter required" });
      }
      
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/team-matches/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const teamMatch = await storage.getTeamMatch(id);
      if (!teamMatch) {
        return res.status(404).json({ message: "Team match not found" });
      }
      res.json(teamMatch);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/team-matches", async (req, res) => {
    try {
      const validatedData = insertTeamMatchSchema.parse(req.body);
      const teamMatch = await storage.createTeamMatch(validatedData);
      res.status(201).json(teamMatch);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/team-matches/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const teamMatch = await storage.updateTeamMatch(id, req.body);
      if (!teamMatch) {
        return res.status(404).json({ message: "Team match not found" });
      }
      res.json(teamMatch);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Team Set Routes
  app.get("/api/team-sets", async (req, res) => {
    try {
      const { teamMatchId } = req.query;
      if (!teamMatchId) {
        return res.status(400).json({ message: "teamMatchId parameter required" });
      }
      
      const teamSets = await storage.getTeamSetsByMatch(teamMatchId as string);
      res.json(teamSets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/team-sets", async (req, res) => {
    try {
      const validatedData = insertTeamSetSchema.parse(req.body);
      const teamSet = await storage.createTeamSet(validatedData);
      res.status(201).json(teamSet);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/team-sets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const teamSet = await storage.updateTeamSet(id, req.body);
      if (!teamSet) {
        return res.status(404).json({ message: "Team set not found" });
      }
      res.json(teamSet);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Special team match operations
  app.post("/api/team-matches/:id/reveal-lineup", async (req, res) => {
    try {
      const { id } = req.params;
      const { side } = req.body; // "home" or "away"
      
      const teamMatch = await storage.getTeamMatch(id);
      if (!teamMatch) {
        return res.status(404).json({ message: "Team match not found" });
      }
      
      const updates: any = {};
      if (side === "home") {
        updates.homeLineupRevealed = true;
      } else if (side === "away") {
        updates.awayLineupRevealed = true;
      } else {
        return res.status(400).json({ message: "Invalid side. Must be 'home' or 'away'" });
      }
      
      const updatedMatch = await storage.updateTeamMatch(id, updates);
      res.json(updatedMatch);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/team-matches/:id/trigger-captain-burden", async (req, res) => {
    try {
      const { id } = req.params;
      const { teamId } = req.body;
      
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Captain's burden rule: after 2 consecutive losses, captain must play first
      if (team.consecutiveLosses >= 2) {
        await storage.updateTeam(teamId, { captainForcedNext: true });
        res.json({ message: "Captain's burden activated - captain must play first next match" });
      } else {
        res.json({ message: "Captain's burden not triggered (need 2+ consecutive losses)" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Team Challenge Routes - 2-Man Army, 3-Man Crew, 5-Man Squad
  app.get("/api/team-challenges", async (req, res) => {
    try {
      const { operatorId, challengeType, status } = req.query;
      let challenges;
      
      if (operatorId) {
        challenges = await storage.getTeamChallengesByOperator(operatorId as string);
      } else if (challengeType) {
        challenges = await storage.getTeamChallengesByType(challengeType as string);
      } else if (status) {
        challenges = await storage.getTeamChallengesByStatus(status as string);
      } else {
        challenges = await storage.getAllTeamChallenges();
      }
      
      res.json(challenges);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/team-challenges", sanitizeBody(["title", "description"]), async (req, res) => {
    try {
      const { teamPlayers, ...challengeData } = req.body;
      const validatedData = insertTeamChallengeSchema.parse(challengeData);
      
      // Validate challenge type and fee range
      const validTypes = ["2man_army", "3man_crew", "5man_squad"];
      if (!validTypes.includes(validatedData.challengeType)) {
        return res.status(400).json({ 
          message: "Invalid challenge type. Must be: 2man_army, 3man_crew, or 5man_squad" 
        });
      }
      
      // Validate fee range ($10 - $10,000)
      if (validatedData.individualFee < 1000 || validatedData.individualFee > 1000000) {
        return res.status(400).json({ 
          message: "Individual fee must be between $10 and $10,000" 
        });
      }
      
      // Create challenge with participants
      const result = await storage.createTeamChallengeWithParticipants(
        validatedData, 
        teamPlayers || []
      );
      
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message.includes("Pro membership")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/team-challenges/:id/accept", async (req, res) => {
    try {
      const { id } = req.params;
      const { acceptingTeamId, teamPlayers } = req.body;
      
      if (!acceptingTeamId) {
        return res.status(400).json({ message: "acceptingTeamId is required" });
      }
      
      // Validate Pro membership for accepting team players
      if (teamPlayers && Array.isArray(teamPlayers)) {
        for (const playerId of teamPlayers) {
          const isProMember = await storage.validateProMembership(playerId);
          if (!isProMember) {
            return res.status(400).json({ 
              message: `Player ${playerId} does not have Pro membership required for team challenges` 
            });
          }
        }
      }
      
      const challenge = await storage.acceptTeamChallenge(id, acceptingTeamId);
      if (!challenge) {
        return res.status(404).json({ message: "Team challenge not found or cannot be accepted" });
      }
      
      res.json(challenge);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === SPORTSMANSHIP VOTE-OUT SYSTEM API ===

  // Check-in endpoints
  app.post("/api/checkins", sanitizeBody(["details"]), async (req, res) => {
    try {
      const validatedData = insertCheckinSchema.parse(req.body);
      const checkin = await storage.checkinUser(validatedData);
      res.status(201).json(checkin);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/checkins/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const checkins = await storage.getCheckinsBySession(sessionId);
      res.json(checkins);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/checkins/venue/:venueId", async (req, res) => {
    try {
      const { venueId } = req.params;
      const checkins = await storage.getCheckinsByVenue(venueId);
      res.json(checkins);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Vote management endpoints
  app.post("/api/attitude-votes", sanitizeBody(["details"]), async (req, res) => {
    try {
      const { targetUserId, sessionId, venueId, endsInSec = 90 } = req.body;
      
      // Check if user can be voted on (cooldowns, already ejected, etc.)
      const canVote = await storage.canUserBeVotedOn(targetUserId, sessionId);
      if (!canVote) {
        return res.status(400).json({ 
          message: "User cannot be voted on at this time (cooldown or already ejected)" 
        });
      }

      // Check if user is immune (currently shooting)
      const isImmune = await storage.isUserImmune(targetUserId, sessionId);
      if (isImmune) {
        return res.status(400).json({ 
          message: "User is immune while shooting. Wait until their turn ends." 
        });
      }

      // Get eligible voters to calculate quorum
      const activeCheckins = await storage.getActiveCheckins(sessionId, venueId);
      const totalEligibleWeight = activeCheckins.reduce((sum, checkin) => {
        let weight = 0.5; // attendee
        if (checkin.role === "player") weight = 1.0;
        if (checkin.role === "operator") weight = 2.0;
        return sum + weight;
      }, 0);

      const minQuorum = Math.max(12.0, totalEligibleWeight * 0.3); // 12 or 30% of eligible voters
      const endsAt = new Date(Date.now() + endsInSec * 1000);

      const voteData = {
        targetUserId,
        sessionId,
        venueId,
        endsAt,
        quorumRequired: minQuorum,
        thresholdRequired: 0.65, // 65% threshold
        createdBy: req.body.createdBy || "system", // Should come from authenticated operator
      };

      const vote = await storage.createAttitudeVote(voteData);
      res.status(201).json(vote);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/attitude-votes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const vote = await storage.getAttitudeVote(id);
      if (!vote) {
        return res.status(404).json({ message: "Vote not found" });
      }

      // Calculate remaining time and vote status
      const now = new Date();
      const remainingMs = vote.endsAt.getTime() - now.getTime();
      const hasEnded = remainingMs <= 0;

      // Auto-close expired votes
      if (hasEnded && vote.status === "open") {
        const weights = await storage.calculateVoteWeights(id);
        const quorumMet = await storage.checkVoteQuorum(id);
        
        let result = "fail_quorum";
        if (quorumMet) {
          const passThreshold = weights.outWeight / weights.totalWeight >= vote.thresholdRequired;
          result = passThreshold ? "pass" : "fail_threshold";
        }
        
        const updatedVote = await storage.closeAttitudeVote(id, result);
        
        // If vote passed, create incident and apply consequences
        if (result === "pass" && updatedVote) {
          await storage.createIncident({
            userId: vote.targetUserId,
            sessionId: vote.sessionId,
            venueId: vote.venueId,
            type: "ejection",
            details: "Ejected by community vote",
            consequence: "ejected_night",
            pointsPenalty: 10, // -10 ladder points
            creditsFine: 0,
            createdBy: "system",
            voteId: id,
          });
        }
        
        return res.json(updatedVote);
      }

      // Check if current user has voted
      const userId = req.query.userId as string;
      let youVoted = false;
      if (userId) {
        youVoted = await storage.hasUserVoted(id, userId);
      }

      res.json({
        ...vote,
        remainingSeconds: Math.max(0, Math.floor(remainingMs / 1000)),
        youVoted,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/attitude-votes/:id/vote", sanitizeBody(["note"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { choice, tags, note, voterUserId, voterRole } = req.body;

      // Validate choice
      if (!["out", "keep"].includes(choice)) {
        return res.status(400).json({ message: "Choice must be 'out' or 'keep'" });
      }

      // Check if vote is still open
      const vote = await storage.getAttitudeVote(id);
      if (!vote || vote.status !== "open") {
        return res.status(400).json({ message: "Vote is not open" });
      }

      // Check if vote has expired
      if (new Date() > vote.endsAt) {
        return res.status(400).json({ message: "Vote has expired" });
      }

      // Check if user already voted
      const hasVoted = await storage.hasUserVoted(id, voterUserId);
      if (hasVoted) {
        return res.status(400).json({ message: "You have already voted" });
      }

      // Calculate weight based on role
      let weight = 0.5; // attendee default
      if (voterRole === "player") weight = 1.0;
      if (voterRole === "operator") weight = 2.0;

      // Validate note length
      if (note && note.length > 140) {
        return res.status(400).json({ message: "Note must be 140 characters or less" });
      }

      const ballotData = {
        voteId: id,
        voterUserId,
        weight,
        choice,
        tags: tags || [],
        note: note || undefined,
      };

      const ballot = await storage.createAttitudeBallot(ballotData);
      res.status(201).json(ballot);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/attitude-votes/:id/close", async (req, res) => {
    try {
      const { id } = req.params;
      
      const vote = await storage.getAttitudeVote(id);
      if (!vote) {
        return res.status(404).json({ message: "Vote not found" });
      }

      // Calculate final result
      const weights = await storage.calculateVoteWeights(id);
      const quorumMet = await storage.checkVoteQuorum(id);
      
      let result = "fail_quorum";
      if (quorumMet) {
        const passThreshold = weights.outWeight / weights.totalWeight >= vote.thresholdRequired;
        result = passThreshold ? "pass" : "fail_threshold";
      }

      const closedVote = await storage.closeAttitudeVote(id, result);
      
      // Apply consequences if vote passed
      if (result === "pass" && closedVote) {
        await storage.createIncident({
          userId: vote.targetUserId,
          sessionId: vote.sessionId,
          venueId: vote.venueId,
          type: "ejection",
          details: "Ejected by community vote",
          consequence: "ejected_night",
          pointsPenalty: 10,
          creditsFine: 0,
          createdBy: req.body.operatorId || "system",
          voteId: id,
        });
      }

      res.json(closedVote);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get active votes for a session/venue
  app.get("/api/attitude-votes/active/:sessionId/:venueId", async (req, res) => {
    try {
      const { sessionId, venueId } = req.params;
      const activeVotes = await storage.getActiveVotes(sessionId, venueId);
      res.json(activeVotes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Incident management
  app.get("/api/incidents/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const incidents = await storage.getIncidentsByUser(userId);
      res.json(incidents);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/incidents/recent/:venueId", async (req, res) => {
    try {
      const { venueId } = req.params;
      const { hours = "24" } = req.query;
      const incidents = await storage.getRecentIncidents(venueId, parseInt(hours as string));
      res.json(incidents);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === MATCH DIVISION SYSTEM API ===

  // Match Divisions endpoints
  app.get("/api/match-divisions", async (req, res) => {
    try {
      const divisions = await storage.getMatchDivisions();
      res.json(divisions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/match-divisions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const division = await storage.getMatchDivision(id);
      if (!division) {
        return res.status(404).json({ message: "Match division not found" });
      }
      res.json(division);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Operator Tiers endpoints
  app.get("/api/operator-tiers", async (req, res) => {
    try {
      const tiers = await storage.getOperatorTiers();
      res.json(tiers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/operator-tiers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const tier = await storage.getOperatorTier(id);
      if (!tier) {
        return res.status(404).json({ message: "Operator tier not found" });
      }
      res.json(tier);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === STRIPE CONNECT EXPRESS ONBOARDING ===

  // Create Stripe Connect Express account for team
  app.post("/api/teams/:teamId/stripe-onboarding", async (req, res) => {
    try {
      const { teamId } = req.params;
      const { email, businessType = "individual", country = "US" } = req.body;

      // Check if team already has a Stripe account
      const existingAccount = await storage.getTeamStripeAccount(teamId);
      if (existingAccount) {
        return res.status(400).json({ 
          message: "Team already has a Stripe account",
          accountId: existingAccount.stripeAccountId 
        });
      }

      // Create Stripe Express account
      const account = await stripe.accounts.create({
        type: 'express',
        country,
        email,
        business_type: businessType,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      // Save to database
      const teamStripeAccount = await storage.createTeamStripeAccount({
        teamId,
        stripeAccountId: account.id,
        accountStatus: "pending",
        onboardingCompleted: false,
        detailsSubmitted: false,
        payoutsEnabled: false,
        chargesEnabled: false,
        businessType,
        country,
        email,
      });

      // Create onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${req.protocol}://${req.get('host')}/api/teams/${teamId}/stripe-onboarding/refresh`,
        return_url: `${req.protocol}://${req.get('host')}/api/teams/${teamId}/stripe-onboarding/complete`,
        type: 'account_onboarding',
      });

      res.json({
        account: teamStripeAccount,
        onboardingUrl: accountLink.url,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Refresh onboarding link
  app.get("/api/teams/:teamId/stripe-onboarding/refresh", async (req, res) => {
    try {
      const { teamId } = req.params;
      
      const teamAccount = await storage.getTeamStripeAccount(teamId);
      if (!teamAccount) {
        return res.status(404).json({ message: "Team Stripe account not found" });
      }

      const accountLink = await stripe.accountLinks.create({
        account: teamAccount.stripeAccountId,
        refresh_url: `${req.protocol}://${req.get('host')}/api/teams/${teamId}/stripe-onboarding/refresh`,
        return_url: `${req.protocol}://${req.get('host')}/api/teams/${teamId}/stripe-onboarding/complete`,
        type: 'account_onboarding',
      });

      // Update last refresh time
      await storage.updateTeamStripeAccount(teamId, {
        lastOnboardingRefresh: new Date(),
      });

      res.redirect(accountLink.url);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Complete onboarding
  app.get("/api/teams/:teamId/stripe-onboarding/complete", async (req, res) => {
    try {
      const { teamId } = req.params;
      
      const teamAccount = await storage.getTeamStripeAccount(teamId);
      if (!teamAccount) {
        return res.status(404).json({ message: "Team Stripe account not found" });
      }

      // Fetch updated account details from Stripe
      const account = await stripe.accounts.retrieve(teamAccount.stripeAccountId);

      // Update account status
      await storage.updateTeamStripeAccount(teamId, {
        onboardingCompleted: true,
        detailsSubmitted: account.details_submitted || false,
        payoutsEnabled: account.payouts_enabled || false,
        chargesEnabled: account.charges_enabled || false,
        accountStatus: account.payouts_enabled ? "active" : "restricted",
      });

      res.redirect(`${req.protocol}://${req.get('host')}/app?tab=team-management&success=onboarding-complete`);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get team Stripe account status
  app.get("/api/teams/:teamId/stripe-account", async (req, res) => {
    try {
      const { teamId } = req.params;
      const teamAccount = await storage.getTeamStripeAccount(teamId);
      
      if (!teamAccount) {
        return res.status(404).json({ message: "Team Stripe account not found" });
      }

      // Optionally fetch fresh data from Stripe
      if (req.query.refresh === "true") {
        try {
          const account = await stripe.accounts.retrieve(teamAccount.stripeAccountId);
          await storage.updateTeamStripeAccount(teamId, {
            detailsSubmitted: account.details_submitted || false,
            payoutsEnabled: account.payouts_enabled || false,
            chargesEnabled: account.charges_enabled || false,
            accountStatus: account.payouts_enabled ? "active" : "restricted",
          });
        } catch (stripeError) {
          console.error("Error refreshing Stripe account:", stripeError);
        }
      }

      const updatedAccount = await storage.getTeamStripeAccount(teamId);
      res.json(updatedAccount);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === TEAM REGISTRATION WITH ENTRY FEES ===

  // Create team registration
  app.post("/api/team-registrations", sanitizeBody(["teamName", "description"]), async (req, res) => {
    try {
      const validatedData = insertTeamRegistrationSchema.parse(req.body);
      const registration = await storage.createTeamRegistration(validatedData);
      res.status(201).json(registration);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get team registration
  app.get("/api/team-registrations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const registration = await storage.getTeamRegistration(id);
      if (!registration) {
        return res.status(404).json({ message: "Team registration not found" });
      }
      res.json(registration);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get registrations by division
  app.get("/api/team-registrations/division/:divisionId", async (req, res) => {
    try {
      const { divisionId } = req.params;
      const registrations = await storage.getTeamRegistrationsByDivision(divisionId);
      res.json(registrations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === MATCH ENTRY WITH STRIPE CHECKOUT ===

  // Create match entry with Stripe Checkout
  app.post("/api/match-entries", sanitizeBody(["description"]), async (req, res) => {
    try {
      const { 
        divisionId, 
        homeTeamId, 
        awayTeamId, 
        entryFeePerPlayer, 
        teamSize,
        operatorId,
        venueId,
        scheduledAt 
      } = req.body;

      // Validate division exists
      const division = await storage.getMatchDivision(divisionId);
      if (!division) {
        return res.status(400).json({ message: "Invalid division" });
      }

      // Validate entry fee is within division limits
      if (entryFeePerPlayer < division.entryFeeMin || entryFeePerPlayer > division.entryFeeMax) {
        return res.status(400).json({ 
          message: `Entry fee must be between $${(division.entryFeeMin/100).toFixed(2)} and $${(division.entryFeeMax/100).toFixed(2)} per player` 
        });
      }

      // Validate team size
      if (teamSize < division.minTeamSize || teamSize > division.maxTeamSize) {
        return res.status(400).json({ 
          message: `Team size must be between ${division.minTeamSize} and ${division.maxTeamSize} players` 
        });
      }

      const totalStake = entryFeePerPlayer * teamSize * 2; // Both teams pay
      const matchId = `${division.name}_${Date.now()}_${homeTeamId}`;

      // Get operator tier for revenue split calculation
      const operatorTiers = await storage.getOperatorTiers();
      const defaultTier = operatorTiers.find(t => t.name === "basic_hall") || operatorTiers[0];
      const revenueSplitPercent = defaultTier?.revenueSplitPercent || 10;

      // Create Stripe Checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${division.displayName} Entry Fee`,
                description: `Entry fee for ${teamSize} players at $${(entryFeePerPlayer/100).toFixed(2)} each`,
              },
              unit_amount: totalStake,
            },
            quantity: 1,
          },
        ],
        metadata: {
          match_id: matchId,
          division_id: divisionId,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId || "",
          entry_fee_per_player: entryFeePerPlayer.toString(),
          team_size: teamSize.toString(),
          operator_id: operatorId,
          venue_id: venueId || "",
          revenue_split_percent: revenueSplitPercent.toString(),
        },
        success_url: `${req.protocol}://${req.get('host')}/app?tab=matches&success=payment-complete&match_id=${matchId}`,
        cancel_url: `${req.protocol}://${req.get('host')}/app?tab=matches&cancelled=true`,
      });

      // Create match entry record
      const matchEntry = await storage.createMatchEntry({
        matchId,
        divisionId,
        homeTeamId,
        awayTeamId,
        entryFeePerPlayer,
        totalStake,
        stripeCheckoutSessionId: session.id,
        paymentStatus: "pending",
        matchStatus: awayTeamId ? "accepted" : "open",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        venueId,
        operatorId,
        metadata: {
          teamSize,
          revenueSplitPercent,
          divisionName: division.name,
        },
      });

      res.status(201).json({
        matchEntry,
        checkoutUrl: session.url,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get match entry
  app.get("/api/match-entries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const matchEntry = await storage.getMatchEntry(id);
      if (!matchEntry) {
        return res.status(404).json({ message: "Match entry not found" });
      }
      res.json(matchEntry);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update match entry (for results, etc.)
  app.patch("/api/match-entries/:id", sanitizeBody(["description"]), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedEntry = await storage.updateMatchEntry(id, updates);
      if (!updatedEntry) {
        return res.status(404).json({ message: "Match entry not found" });
      }
      
      res.json(updatedEntry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Complete match and trigger payout
  app.post("/api/match-entries/:id/complete", async (req, res) => {
    try {
      const { id } = req.params;
      const { winnerId, homeScore, awayScore } = req.body;

      const matchEntry = await storage.getMatchEntry(id);
      if (!matchEntry) {
        return res.status(404).json({ message: "Match entry not found" });
      }

      if (matchEntry.matchStatus === "completed") {
        return res.status(400).json({ message: "Match already completed" });
      }

      if (matchEntry.paymentStatus !== "paid") {
        return res.status(400).json({ message: "Match entry fees not paid" });
      }

      // Update match entry
      const completedMatch = await storage.updateMatchEntry(id, {
        matchStatus: "completed",
        winnerId,
        homeScore,
        awayScore,
        completedAt: new Date(),
      });

      // Check if winning team has Stripe account for payout
      const teamStripeAccount = await storage.getTeamStripeAccount(winnerId);
      if (!teamStripeAccount || !teamStripeAccount.payoutsEnabled) {
        return res.json({
          match: completedMatch,
          payout: null,
          message: "Match completed but winning team needs to complete Stripe onboarding for payout",
        });
      }

      // Calculate payout amounts
      const totalStake = matchEntry.totalStake;
      const metadata = matchEntry.metadata as any;
      const revenueSplitPercent = metadata?.revenueSplitPercent || 10;
      
      const platformFee = Math.floor(totalStake * (revenueSplitPercent / 100));
      const operatorFee = 0; // Operator gets revenue share, not per-match fee
      const teamPayout = totalStake - platformFee - operatorFee;

      // Create Stripe transfer to winning team
      const transfer = await stripe.transfers.create({
        amount: teamPayout,
        currency: 'usd',
        destination: teamStripeAccount.stripeAccountId,
        transfer_group: `match_${matchEntry.matchId}`,
        metadata: {
          match_id: matchEntry.matchId,
          winning_team_id: winnerId,
          total_stake: totalStake.toString(),
          platform_fee: platformFee.toString(),
        },
      });

      // Record payout distribution
      const payout = await storage.createPayoutDistribution({
        matchEntryId: matchEntry.id,
        winningTeamId: winnerId,
        totalPayout: teamPayout,
        platformFee,
        operatorFee,
        teamPayout,
        stripeTransferId: transfer.id,
        transferStatus: "pending",
        operatorTierAtPayout: "basic_hall", // Should get from actual operator
        revenueSplitAtPayout: revenueSplitPercent,
        payoutMethod: "stripe_transfer",
      });

      res.json({
        match: completedMatch,
        payout,
        transfer: {
          id: transfer.id,
          amount: teamPayout,
          status: transfer.reversals ? "reversed" : "pending",
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === STRIPE WEBHOOKS ===

  // Handle Stripe Checkout completion
  app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
      } catch (err: any) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const matchId = session.metadata?.match_id;
        
        if (matchId) {
          // Update match entry payment status
          const matchEntry = await storage.getMatchEntryByMatchId(matchId);
          if (matchEntry) {
            await storage.updateMatchEntry(matchEntry.id, {
              paymentStatus: "paid",
              stripePaymentIntentId: session.payment_intent,
            });
          }
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
