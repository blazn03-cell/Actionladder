import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { 
  insertPlayerSchema, insertMatchSchema, insertTournamentSchema,
  insertKellyPoolSchema, insertBountySchema, insertCharityEventSchema,
  insertSupportRequestSchema, insertLiveStreamSchema
} from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  
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

  const httpServer = createServer(app);
  return httpServer;
}
