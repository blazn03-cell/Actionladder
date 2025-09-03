import express, { type Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { AIService } from "./ai-service";
import { registerAdminRoutes, registerOperatorRoutes, payStaffFromInvoice } from "./admin-routes";
import { registerHallRoutes } from "./hall-routes";
import { 
  insertPlayerSchema, insertMatchSchema, insertTournamentSchema,
  insertKellyPoolSchema, insertBountySchema, insertCharityEventSchema,
  insertSupportRequestSchema, insertLiveStreamSchema,
  insertWalletSchema, insertChallengePoolSchema, insertChallengeEntrySchema,
  insertLedgerSchema, insertResolutionSchema,
  insertOperatorSubscriptionSchema, insertTeamSchema, insertTeamPlayerSchema,
  insertTeamMatchSchema, insertTeamSetSchema
} from "@shared/schema";
import { OperatorSubscriptionCalculator } from "./operator-subscription-utils";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

// Stripe Price IDs
const prices = {
  rookie_monthly: "prod_Sy1Pr1q0qu3UoL", // $20/month Rookie Pass
  small: process.env.SMALL_PRICE_ID,
  medium: process.env.MEDIUM_PRICE_ID,
  large: process.env.LARGE_PRICE_ID,
  mega: process.env.MEGA_PRICE_ID,
};

export async function registerRoutes(app: Express): Promise<Server> {
  
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
          let globalRole = "PLAYER";
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

  app.post("/api/players", async (req, res) => {
    try {
      const validatedData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(validatedData);
      res.status(201).json(player);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/players/:id", async (req, res) => {
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

  app.post("/api/matches", async (req, res) => {
    try {
      const validatedData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(validatedData);
      res.status(201).json(match);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/matches/:id", async (req, res) => {
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

  app.post("/api/tournaments", async (req, res) => {
    try {
      const validatedData = insertTournamentSchema.parse(req.body);
      const tournament = await storage.createTournament(validatedData);
      res.status(201).json(tournament);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/tournaments/:id", async (req, res) => {
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
  app.post("/api/create-payment-intent", async (req, res) => {
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
  app.post("/api/billing/checkout", async (req, res) => {
    try {
      const { priceIds = [], mode = 'subscription', quantities = [], metadata = {}, userId } = req.body;
      
      const line_items = priceIds.map((priceId: string, i: number) => ({
        price: priceId,
        quantity: quantities[i] ?? 1,
      }));

      const session = await stripe.checkout.sessions.create({
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
          await handleOneTime(event.data.object);
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
        pots = await storage.getChallengePoolsByMatch(matchId as string);
      } else if (status) {
        pots = await storage.getChallengePoolsByStatus(status as string);
      } else {
        pots = await storage.getAllChallengePools();
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
      
      const pool = await storage.createChallengePool(potData);
      res.status(201).json(pot);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/side-pots/:id", async (req, res) => {
    try {
      const pool = await storage.updateChallengePool(req.params.id, req.body);
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
      await storage.updateSidePot(sidePotId, { 
        status: "resolved",
        winningSide: winnerSide,
        resolvedAt: now,
        disputeDeadline: disputeDeadline,
        disputeStatus: "none",
        evidenceJson: evidence ? JSON.stringify(evidence) : null,
      });
      
      // Process payouts immediately for operator resolutions
      const bets = await storage.getSideBetsByPot(sidePotId);
      const winners = bets.filter(bet => bet.side === winnerSide);
      const losers = bets.filter(bet => bet.side !== winnerSide);
      
      const totalPool = bets.reduce((sum, bet) => sum + bet.amount, 0);
      const serviceFee = Math.floor(totalPool * (pot.feeBps / 10000));
      const winnerPool = totalPool - serviceFee;
      const totalWinnerAmount = winners.reduce((sum, bet) => sum + bet.amount, 0);
      
      // Distribute winnings
      for (const bet of winners) {
        const proportion = bet.amount / totalWinnerAmount;
        const winnings = Math.floor(winnerPool * proportion);
        
        // Credit the user
        await storage.unlockCredits(bet.userId, bet.amount); // Unlock locked funds
        await storage.addCredits(bet.userId, winnings); // Add winnings
        
        // Create ledger entries
        await storage.createLedgerEntry({
          userId: bet.userId,
          type: "pot_win",
          amount: winnings,
          refId: bet.id,
          metaJson: JSON.stringify({ sidePotId, originalBet: bet.amount }),
        });
        
        await storage.createLedgerEntry({
          userId: bet.userId,
          type: "pot_unlock",
          amount: bet.amount,
          refId: bet.id,
          metaJson: JSON.stringify({ sidePotId }),
        });
      }
      
      // Unlock losing bets (they lose their credits)
      for (const bet of losers) {
        await storage.unlockCredits(bet.userId, bet.amount);
        
        await storage.createLedgerEntry({
          userId: bet.userId,
          type: "pot_loss",
          amount: -bet.amount,
          refId: bet.id,
          metaJson: JSON.stringify({ sidePotId }),
        });
      }
      
      console.log(`Side pot ${sidePotId} resolved with immediate payout. ${winners.length} winners, ${losers.length} losers.`);
      
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
      if (!pot) {
        return res.status(404).json({ message: "Side pot not found" });
      }
      
      if (pot.status !== "locked") {
        return res.status(400).json({ message: "Only locked pots can be put on hold" });
      }
      
      // Update pot status to on_hold with evidence request
      const now = new Date();
      const holdDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      await storage.updateSidePot(sidePotId, { 
        status: "on_hold",
        holdReason: reason,
        holdDeadline,
        evidenceJson: evidence ? JSON.stringify(evidence) : null,
      });
      
      console.log(`Side pot ${sidePotId} put on hold for evidence review. Deadline: ${holdDeadline.toISOString()}`);
      
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
      if (!pot) {
        return res.status(404).json({ message: "Side pot not found" });
      }
      
      if (!["locked", "on_hold"].includes(pot.status)) {
        return res.status(400).json({ message: "Only locked or on-hold pots can be voided" });
      }
      
      // Get all bets for this pot
      const bets = await storage.getSideBetsByPot(sidePotId);
      let refundCount = 0;
      let totalRefunded = 0;
      
      // Refund all participants
      for (const bet of bets) {
        // Unlock and refund the credits
        await storage.unlockCredits(bet.userId, bet.amount);
        
        // Create refund ledger entry
        await storage.createLedgerEntry({
          userId: bet.userId,
          type: "pot_void_refund",
          amount: bet.amount,
          refId: bet.id,
          metaJson: JSON.stringify({ sidePotId, voidReason: reason }),
        });
        
        refundCount++;
        totalRefunded += bet.amount;
      }
      
      // Update pot status to voided
      const now = new Date();
      await storage.updateSidePot(sidePotId, { 
        status: "voided",
        voidReason: reason,
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

  const httpServer = createServer(app);
  return httpServer;
}
