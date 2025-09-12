import { Express } from "express";
import Stripe from "stripe";
import { storage } from "./storage";
import { requireAnyAuth } from "./auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

// Player subscription tiers - designed to compete with traditional leagues
export function getPlayerSubscriptionTier(tier: string) {
  switch (tier) {
    case "rookie":
      return {
        tier: "rookie",
        name: "Rookie",
        monthlyPrice: 3900, // $39/month
        yearlyPrice: 39900, // $399/year (save $69)
        priceId: process.env.PLAYER_ROOKIE_PRICE_ID || "price_rookie_monthly",
        yearlyPriceId: process.env.PLAYER_ROOKIE_YEARLY_PRICE_ID || "price_rookie_yearly",
        traditionalLeagueCost: 8000, // $80/month typical league cost
        monthlySavings: 4100, // $41/month savings
        yearlySavings: 56100, // $561/year savings
        perks: [
          "Access to all ladder divisions",
          "Challenge match system",
          "Basic tournament entries",
          "Match history tracking",
          "10% commission rate on side bets",
          "Weekly streak bonuses",
          "Community features"
        ],
        commissionRate: 1000, // 10% in basis points
        description: "Perfect for new players entering the competitive billiards world"
      };
    case "standard":
      return {
        tier: "standard", 
        name: "Standard",
        monthlyPrice: 5900, // $59/month
        yearlyPrice: 59900, // $599/year (save $109)
        priceId: process.env.PLAYER_STANDARD_PRICE_ID || "price_standard_monthly",
        yearlyPriceId: process.env.PLAYER_STANDARD_YEARLY_PRICE_ID || "price_standard_yearly",
        traditionalLeagueCost: 8000, // $80/month typical league cost
        monthlySavings: 2100, // $21/month savings
        yearlySavings: 36100, // $361/year savings
        perks: [
          "Everything in Rookie",
          "Premium tournament access",
          "Advanced analytics & insights",
          "Live stream priority placement",
          "8% commission rate on side bets",
          "Monthly bonus challenges",
          "Priority customer support",
          "AI coaching tips"
        ],
        commissionRate: 800, // 8% in basis points
        description: "For serious players who want competitive advantages and insights"
      };
    case "premium":
      return {
        tier: "premium",
        name: "Premium", 
        monthlyPrice: 7900, // $79/month
        yearlyPrice: 79900, // $799/year (save $149)
        priceId: process.env.PLAYER_PREMIUM_PRICE_ID || "price_premium_monthly",
        yearlyPriceId: process.env.PLAYER_PREMIUM_YEARLY_PRICE_ID || "price_premium_yearly",
        traditionalLeagueCost: 8000, // $80/month typical league cost
        monthlySavings: 100, // $1/month savings (same price but better value)
        yearlySavings: 12100, // $121/year savings with yearly plan
        perks: [
          "Everything in Standard",
          "VIP tournament seeding",
          "Personal performance coaching",
          "Fan tip collection system",
          "5% commission rate on side bets",
          "Exclusive premium events",
          "Direct line to pros for mentoring",
          "Revenue sharing on content creation",
          "White-glove support"
        ],
        commissionRate: 500, // 5% in basis points
        description: "Elite tier for top competitors and content creators"
      };
    default:
      return null;
  }
}

export function registerPlayerBillingRoutes(app: Express) {
  
  // Get player subscription tiers and pricing
  app.get("/api/player-billing/tiers", (req, res) => {
    const tiers = ["rookie", "standard", "premium"].map(tier => getPlayerSubscriptionTier(tier));
    res.json({ tiers });
  });

  // Create player subscription checkout session
  app.post("/api/player-billing/checkout", requireAnyAuth, async (req, res) => {
    try {
      const { tier, billingPeriod = "monthly", userId } = req.body;
      
      if (!tier || !userId) {
        return res.status(400).json({ error: "tier and userId required" });
      }

      const subscription = getPlayerSubscriptionTier(tier);
      if (!subscription) {
        return res.status(400).json({ error: "Invalid subscription tier" });
      }

      // Get or create Stripe customer for this user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: user.id,
            userRole: user.globalRole
          }
        });
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.updateUser(userId, { stripeCustomerId: customerId });
      }

      // Select price based on billing period
      const priceId = billingPeriod === "yearly" ? subscription.yearlyPriceId : subscription.priceId;
      const amount = billingPeriod === "yearly" ? subscription.yearlyPrice : subscription.monthlyPrice;

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        line_items: [{
          price: priceId,
          quantity: 1
        }],
        success_url: `${process.env.APP_BASE_URL || 'http://localhost:5000'}/app?tab=dashboard&subscription=success`,
        cancel_url: `${process.env.APP_BASE_URL || 'http://localhost:5000'}/app?tab=dashboard&subscription=cancelled`,
        client_reference_id: userId,
        subscription_data: {
          metadata: {
            userId,
            tier: subscription.tier,
            billingPeriod,
            userRole: user.globalRole
          }
        },
        metadata: {
          userId,
          tier: subscription.tier,
          billingPeriod,
          type: "player_subscription"
        }
      });

      res.json({ 
        url: session.url, 
        sessionId: session.id,
        subscription: {
          tier: subscription.name,
          price: amount,
          billingPeriod,
          savings: billingPeriod === "yearly" ? subscription.yearlySavings : subscription.monthlySavings
        }
      });

    } catch (error: any) {
      console.error("Player checkout error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get current player subscription status
  app.get("/api/player-billing/status/:userId", requireAnyAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Check if user has active subscription in our database
      const subscription = await storage.getMembershipSubscriptionByPlayerId(userId);
      
      if (!subscription) {
        return res.json({ 
          hasSubscription: false,
          tier: null,
          status: "none"
        });
      }

      const tierInfo = getPlayerSubscriptionTier(subscription.tier);
      
      res.json({
        hasSubscription: true,
        tier: subscription.tier,
        tierInfo,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        stripeCustomerId: subscription.stripeCustomerId,
        monthlyPrice: subscription.monthlyPrice,
        perks: subscription.perks || [],
        commissionRate: subscription.commissionRate
      });

    } catch (error: any) {
      console.error("Get subscription status error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Cancel player subscription
  app.post("/api/player-billing/cancel", requireAnyAuth, async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }

      const subscription = await storage.getMembershipSubscriptionByPlayerId(userId);
      if (!subscription || !subscription.stripeSubscriptionId) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      // Cancel at period end in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Update our database
      await storage.updateMembershipSubscription(subscription.id, {
        cancelAtPeriodEnd: true
      });

      res.json({ success: true, message: "Subscription will cancel at the end of the current period" });

    } catch (error: any) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Reactivate cancelled subscription
  app.post("/api/player-billing/reactivate", requireAnyAuth, async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }

      const subscription = await storage.getMembershipSubscriptionByPlayerId(userId);
      if (!subscription || !subscription.stripeSubscriptionId) {
        return res.status(404).json({ error: "No subscription found" });
      }

      // Reactivate in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false
      });

      // Update our database
      await storage.updateMembershipSubscription(subscription.id, {
        cancelAtPeriodEnd: false
      });

      res.json({ success: true, message: "Subscription reactivated successfully" });

    } catch (error: any) {
      console.error("Reactivate subscription error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Player billing portal (manage subscription, payment methods, etc.)
  app.post("/api/player-billing/portal", requireAnyAuth, async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ error: "No customer account found" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.APP_BASE_URL || 'http://localhost:5000'}/app?tab=dashboard`
      });

      res.json({ url: session.url });

    } catch (error: any) {
      console.error("Billing portal error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}