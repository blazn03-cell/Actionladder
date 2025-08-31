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
  insertSupportRequestSchema, insertLiveStreamSchema
} from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

// Stripe Price IDs
const prices = {
  rookie_monthly: "prod_Sy1Pr1q0qu3UoL", // $5/month Rookie Pass
  small: process.env.SMALL_PRICE_ID,
  medium: process.env.MEDIUM_PRICE_ID,
  large: process.env.LARGE_PRICE_ID,
  mega: process.env.MEGA_PRICE_ID,
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check endpoint (required for production deployment)
  app.get("/healthz", (_, res) => res.send("ok"));
  
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

  const httpServer = createServer(app);
  return httpServer;
}
