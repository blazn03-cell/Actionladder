import express from 'express';
import Stripe from 'stripe';
import { MemStorage } from './storage.js';
import { insertPlayerSchema, insertMatchSchema, insertPlayerQueueSchema, insertSpecialEventSchema } from '../shared/schema.js';

const router = express.Router();
const storage = new MemStorage();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...', {
  apiVersion: '2023-10-16',
});

// Players
router.get('/api/players', async (req, res) => {
  try {
    const players = await storage.getPlayers();
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

router.post('/api/players', async (req, res) => {
  try {
    const playerData = insertPlayerSchema.parse(req.body);
    const player = await storage.createPlayer(playerData);
    res.json(player);
  } catch (error) {
    res.status(400).json({ error: 'Invalid player data' });
  }
});

router.patch('/api/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const player = await storage.updatePlayer(id, updates);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// Matches
router.get('/api/matches', async (req, res) => {
  try {
    const matches = await storage.getMatches();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

router.post('/api/matches', async (req, res) => {
  try {
    const matchData = insertMatchSchema.parse(req.body);
    const match = await storage.createMatch(matchData);
    res.json(match);
  } catch (error) {
    res.status(400).json({ error: 'Invalid match data' });
  }
});

// Bounties
router.get('/api/bounties', async (req, res) => {
  try {
    const bounties = await storage.getBounties();
    res.json(bounties);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bounties' });
  }
});

// Social Content
router.get('/api/social-content', async (req, res) => {
  try {
    const content = await storage.getSocialContent();
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch social content' });
  }
});

// Special Events
router.get('/api/special-events', async (req, res) => {
  try {
    const events = await storage.getSpecialEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch special events' });
  }
});

router.post('/api/special-events', async (req, res) => {
  try {
    const eventData = insertSpecialEventSchema.parse(req.body);
    const event = await storage.createSpecialEvent(eventData);
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: 'Invalid event data' });
  }
});

// Stream Status
router.get('/api/stream-status', async (req, res) => {
  try {
    const status = await storage.getStreamStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stream status' });
  }
});

router.patch('/api/stream-status', async (req, res) => {
  try {
    const updates = req.body;
    const status = await storage.updateStreamStatus(updates);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stream status' });
  }
});

// Player Queue
router.get('/api/player-queue', async (req, res) => {
  try {
    const queue = await storage.getPlayerQueue();
    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch player queue' });
  }
});

router.post('/api/player-queue', async (req, res) => {
  try {
    const playerData = insertPlayerQueueSchema.parse(req.body);
    const player = await storage.addToQueue(playerData);
    res.json(player);
  } catch (error) {
    res.status(400).json({ error: 'Invalid queue player data' });
  }
});

router.patch('/api/player-queue/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const player = await storage.approveQueuedPlayer(id);
    if (!player) {
      return res.status(404).json({ error: 'Queued player not found' });
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve player' });
  }
});

// Settings
router.get('/api/settings', async (req, res) => {
  try {
    const settings = await storage.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.patch('/api/settings', async (req, res) => {
  try {
    const updates = req.body;
    const settings = await storage.updateSettings(updates);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Google Sheets CSV endpoint for easy mode
router.get('/api/sheets-data', async (req, res) => {
  try {
    const settings = await storage.getSettings();
    if (!settings.googleSheetsUrl) {
      return res.status(400).json({ error: 'Google Sheets URL not configured' });
    }
    
    // In a real implementation, you'd fetch from the Google Sheets CSV URL
    // For now, return current player data in CSV-compatible format
    const players = await storage.getPlayers();
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sheets data' });
  }
});

// Create Stripe Checkout Session
router.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId, mode = 'payment', userId, metadata = {} } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      mode: mode, // 'payment' for one-time, 'subscription' for memberships
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/payments?success=true`,
      cancel_url: `${req.headers.origin}/payments?canceled=true`,
      client_reference_id: userId,
      metadata: metadata,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook endpoint for payment processing
router.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      event = req.body;
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Payment successful for session:', session.id);
        // Update player membership, add credits, etc.
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

export default router;