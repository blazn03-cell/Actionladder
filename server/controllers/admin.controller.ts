import { Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import type { User, InsertUser } from "../storage";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});

// Invite a trusted friend to receive payouts
export async function inviteStaff(req: Request, res: Response) {
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
}

// Update a friend's payout percentage
export async function updateStaffShare(req: Request, res: Response) {
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
}

// Get all staff members
export async function getAllStaff(req: Request, res: Response) {
  try {
    const staff = await storage.getStaffUsers();
    return res.json({ staff });
  } catch (error: any) {
    console.error("Get staff error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get payout history
export async function getPayouts(req: Request, res: Response) {
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
}

// Check Connect account status
export async function getConnectStatus(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const user = await storage.getUser(userId);
    
    if (!user?.stripeConnectId) {
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
}

// Update subscription seat quantity
export async function updateOrgSeats(req: Request, res: Response) {
  try {
    const { orgId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: "Valid quantity required (minimum 1)" });
    }

    const org = await storage.getOrganization(orgId);
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    if (!org.stripeSubscriptionId) {
      return res.status(400).json({ error: "Organization has no active subscription" });
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
    if (!subscription || subscription.items.data.length === 0) {
      return res.status(400).json({ error: "Invalid subscription" });
    }

    // Update the first subscription item with new quantity
    const subscriptionItem = subscription.items.data[0];
    await stripe.subscriptions.update(org.stripeSubscriptionId, {
      items: [{
        id: subscriptionItem.id,
        quantity: Number(quantity)
      }],
      proration_behavior: 'create_prorations'
    });

    // Update organization seat limit
    const updatedOrg = await storage.updateOrganization(orgId, {
      seatLimit: Number(quantity)
    });

    return res.json({
      success: true,
      organization: updatedOrg,
      newQuantity: Number(quantity),
      message: `Subscription updated to ${quantity} seats`
    });

  } catch (error: any) {
    console.error("Seat update error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get organization subscription details
export async function getOrgSubscription(req: Request, res: Response) {
  try {
    const { orgId } = req.params;
    const org = await storage.getOrganization(orgId);
    
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    if (!org.stripeSubscriptionId) {
      return res.json({ 
        status: "no_subscription",
        organization: org 
      });
    }

    const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId, {
      expand: ['latest_invoice', 'items.data.price']
    });

    return res.json({
      status: "active",
      organization: org,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: (subscription as any).current_period_end || 0,
        quantity: subscription.items.data[0]?.quantity || 1,
        priceId: subscription.items.data[0]?.price?.id,
        amount: subscription.items.data[0]?.price?.unit_amount,
        currency: subscription.items.data[0]?.price?.currency,
        interval: subscription.items.data[0]?.price?.recurring?.interval
      }
    });

  } catch (error: any) {
    console.error("Subscription details error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get all organizations
export async function getAllOrganizations(req: Request, res: Response) {
  try {
    const organizations = await storage.getAllOrganizations();
    return res.json({ organizations });
  } catch (error: any) {
    console.error("Get organizations error:", error);
    res.status(500).json({ error: error.message });
  }
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

// ===== OPERATOR ROUTES =====

// Get all operator settings (for trustee view)
export async function getAllOperators(req: Request, res: Response) {
  try {
    const operators = await storage.getAllOperatorSettings();
    // Get user details for each operator
    const operatorsWithDetails = await Promise.all(
      operators.map(async (settings) => {
        const user = await storage.getUser(settings.operatorUserId);
        return {
          ...settings,
          user: user ? { name: user.name, email: user.email } : null
        };
      })
    );
    res.json(operatorsWithDetails);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Toggle free months for an operator (trustee only)
export async function toggleFreeMonths(req: Request, res: Response) {
  try {
    const { operatorUserId } = req.params;
    const { hasFreeMonths, freeMonthsCount } = req.body;
    const trusteeId = req.user.id;

    let settings = await storage.getOperatorSettings(operatorUserId);
    
    if (!settings) {
      // Create default settings first
      settings = await storage.createOperatorSettings({
        operatorUserId,
        cityName: "Your City",
        areaName: "Your Area",
        hasFreeMonths: false,
        freeMonthsCount: 0,
      });
    }

    const updated = await storage.updateOperatorSettings(operatorUserId, {
      hasFreeMonths,
      freeMonthsCount: hasFreeMonths ? freeMonthsCount || 1 : 0,
      freeMonthsGrantedBy: hasFreeMonths ? trusteeId : null,
      freeMonthsGrantedAt: hasFreeMonths ? new Date() : null,
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Get operator's own settings
export async function getOperatorSettings(req: Request, res: Response) {
  try {
    // In a real app, this would get the current user from session
    // For demo, we'll use a query parameter
    const operatorUserId = req.query.userId as string;
    if (!operatorUserId) {
      return res.status(400).json({ error: "operatorUserId required" });
    }

    let settings = await storage.getOperatorSettings(operatorUserId);
    
    if (!settings) {
      // Create default settings for new operator
      settings = await storage.createOperatorSettings({
        operatorUserId,
        cityName: "Your City",
        areaName: "Your Area",
        hasFreeMonths: false,
        freeMonthsCount: 0,
      });
    }

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Update operator's customization settings
export async function updateOperatorSettings(req: Request, res: Response) {
  try {
    const operatorUserId = req.query.userId as string;
    if (!operatorUserId) {
      return res.status(400).json({ error: "operatorUserId required" });
    }

    const { cityName, areaName, customBranding } = req.body;

    let settings = await storage.getOperatorSettings(operatorUserId);
    
    if (!settings) {
      // Create if doesn't exist
      settings = await storage.createOperatorSettings({
        operatorUserId,
        cityName: cityName || "Your City",
        areaName: areaName || "Your Area",
        customBranding,
        hasFreeMonths: false,
        freeMonthsCount: 0,
      });
    } else {
      // Update existing
      settings = await storage.updateOperatorSettings(operatorUserId, {
        cityName,
        areaName,
        customBranding,
      });
    }

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Get organization seats
export async function getOrganizationSeats(req: Request, res: Response) {
  try {
    const user = req.user as any;
    const userId = user.claims?.sub || user.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get user's organization
    const dbUser = await storage.getUser(userId);
    if (!dbUser || !dbUser.organizationId) {
      return res.status(404).json({ error: "No organization found" });
    }

    const org = await storage.getOrganization(dbUser.organizationId);
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    res.json({
      seatLimit: org.seatLimit,
      seatsUsed: org.seatsUsed || 0,
      seatsAvailable: (org.seatLimit || 0) - (org.seatsUsed || 0)
    });
  } catch (error: any) {
    console.error("Get organization seats error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Aliases for route naming consistency
export const getPayoutHistory = getPayouts;
export const getConnectAccountStatus = getConnectStatus;
export const updateOrganizationSeats = updateOrgSeats;
export const getSubscriptionDetails = getOrgSubscription;
export const toggleFreeMonth = toggleFreeMonths;
export const updateOperatorCustomization = updateOperatorSettings;
