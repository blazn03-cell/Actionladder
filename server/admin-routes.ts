import type { Express } from "express";
import Stripe from "stripe";
import { storage } from "./storage";
import type { User, InsertUser } from "./storage";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Middleware to check if user is OWNER
function requireOwner(req: any, res: any, next: any) {
  // For demo purposes, we'll simulate an authenticated owner user
  // In production, this would check actual user session/JWT
  req.user = {
    id: "owner-demo-id",
    globalRole: "OWNER",
    email: "owner@actionladder.com"
  };
  
  if (req.user?.globalRole !== "OWNER") {
    return res.status(403).json({ error: "Owner access required" });
  }
  next();
}

export function registerAdminRoutes(app: Express) {
  
  // Invite a trusted friend to receive payouts
  // POST /api/admin/staff/invite { email, name, shareBps }
  app.post("/api/admin/staff/invite", requireOwner, async (req, res) => {
    try {
      const { email, name, shareBps } = req.body;

      if (!email || !shareBps) {
        return res.status(400).json({ error: "Email and shareBps are required" });
      }

      // 1) Create/find User
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.createUser({
          email,
          name,
          globalRole: "STAFF",
          payoutShareBps: Number(shareBps),
          onboardingComplete: false
        });
      } else if (user.globalRole === "PLAYER") {
        user = await storage.updateUser(user.id, { 
          globalRole: "STAFF",
          payoutShareBps: Number(shareBps)
        });
      }

      // 2) Create a Connect Express account if not exists
      if (!user.stripeConnectId) {
        const account = await stripe.accounts.create({
          type: "express",
          country: "US",
          email,
          business_type: "individual"
        });
        
        user = await storage.updateUser(user.id, {
          stripeConnectId: account.id,
          payoutShareBps: Number(shareBps)
        });
      } else {
        // Update share if provided
        if (shareBps != null) {
          await storage.updateUser(user.id, { payoutShareBps: Number(shareBps) });
        }
      }

      // 3) Generate onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: user.stripeConnectId,
        refresh_url: `${process.env.APP_BASE_URL || 'http://localhost:5000'}/admin/staff/onboarding-refresh`,
        return_url: `${process.env.APP_BASE_URL || 'http://localhost:5000'}/admin/staff/onboarding-done`,
        type: "account_onboarding"
      });

      return res.json({ 
        onboardingUrl: accountLink.url, 
        staffUserId: user.id,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          globalRole: user.globalRole,
          payoutShareBps: user.payoutShareBps,
          onboardingComplete: user.onboardingComplete
        }
      });
    } catch (error: any) {
      console.error("Staff invite error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update a friend's payout percentage
  // POST /api/admin/staff/share { userId, shareBps }
  app.post("/api/admin/staff/share", requireOwner, async (req, res) => {
    try {
      const { userId, shareBps } = req.body;
      
      if (!userId || shareBps == null) {
        return res.status(400).json({ error: "userId and shareBps are required" });
      }

      const user = await storage.updateUser(userId, { 
        payoutShareBps: Number(shareBps) 
      });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ ok: true, user });
    } catch (error: any) {
      console.error("Update staff share error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all staff members
  // GET /api/admin/staff
  app.get("/api/admin/staff", requireOwner, async (req, res) => {
    try {
      const staff = await storage.getStaffUsers();
      return res.json({ staff });
    } catch (error: any) {
      console.error("Get staff error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get payout history
  // GET /api/admin/payouts
  app.get("/api/admin/payouts", requireOwner, async (req, res) => {
    try {
      const transfers = await storage.getAllPayoutTransfers();
      
      // Enhance with user details
      const enhancedTransfers = await Promise.all(
        transfers.map(async (transfer) => {
          const user = await storage.getUser(transfer.recipientUserId);
          return {
            ...transfer,
            recipientName: user?.name || user?.email || "Unknown",
            recipientEmail: user?.email
          };
        })
      );

      return res.json({ transfers: enhancedTransfers });
    } catch (error: any) {
      console.error("Get payouts error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Check Connect account status
  // GET /api/admin/staff/:userId/connect-status
  app.get("/api/admin/staff/:userId/connect-status", requireOwner, async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeConnectId) {
        return res.json({ status: "not_connected" });
      }

      const account = await stripe.accounts.retrieve(user.stripeConnectId);
      
      return res.json({
        status: "connected",
        accountId: account.id,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirements: account.requirements
      });
    } catch (error: any) {
      console.error("Connect status error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}

// Auto-split money after each invoice (webhook handler)
export async function payStaffFromInvoice(invoice: any) {
  try {
    // 1) Total invoice amount in cents
    const grossAmount = invoice.total;
    
    console.log(`Processing payout split for invoice ${invoice.id}: $${grossAmount / 100}`);

    // 2) Get all staff with Connect IDs and payout shares
    const staff = await storage.getStaffUsers();
    const eligibleStaff = staff.filter(s => 
      s.stripeConnectId && 
      s.payoutShareBps && 
      s.payoutShareBps > 0 &&
      s.onboardingComplete
    );

    if (eligibleStaff.length === 0) {
      console.log("No eligible staff for payouts");
      return;
    }

    // 3) Calculate total basis points and validate 
    const totalBps = eligibleStaff.reduce((sum, s) => sum + (s.payoutShareBps || 0), 0);
    console.log(`Total payout allocation: ${totalBps / 100}% across ${eligibleStaff.length} recipients`);

    // 4) Create transfers for each staff member
    for (const staffMember of eligibleStaff) {
      const shareAmount = Math.floor((grossAmount * (staffMember.payoutShareBps || 0)) / 10000);
      
      if (shareAmount > 0) {
        try {
          const transfer = await stripe.transfers.create({
            amount: shareAmount,
            currency: "usd",
            destination: staffMember.stripeConnectId!,
            transfer_group: invoice.id,
            description: `Revenue share: ${(staffMember.payoutShareBps || 0) / 100}% of invoice ${invoice.id}`
          });

          // Record the transfer in our database
          await storage.createPayoutTransfer({
            invoiceId: invoice.id,
            stripeTransferId: transfer.id,
            recipientUserId: staffMember.id,
            amount: shareAmount,
            shareType: staffMember.globalRole
          });

          console.log(`✅ Paid ${staffMember.name || staffMember.email}: $${shareAmount / 100} (${(staffMember.payoutShareBps || 0) / 100}%)`);
        } catch (transferError: any) {
          console.error(`❌ Transfer failed for ${staffMember.email}:`, transferError.message);
        }
      }
    }

  } catch (error: any) {
    console.error("Payout processing error:", error);
    throw error;
  }
}