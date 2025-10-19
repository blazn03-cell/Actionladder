import { Request, Response } from "express";
import Stripe from "stripe";
import { z } from "zod";
import { type IStorage } from "../storage";
import { insertPaymentMethodSchema } from "@shared/schema";

// === ZOD VALIDATION SCHEMAS ===
const attachPaymentMethodSchema = z.object({
  setupIntentId: z.string().min(1, "Setup Intent ID is required")
});

const setDefaultPaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1, "Payment Method ID is required")
});

const deactivatePaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1, "Payment Method ID is required")
});

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Create SetupIntent for collecting default payment method
export function createSetupIntent(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      // Get userId from authenticated session, never from request body
      const user = req.user as any;
      const userId = user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get or create Stripe customer
      const dbUser = await storage.getUser(userId);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      let customerId = dbUser.stripeCustomerId;
      
      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: dbUser.email,
          name: dbUser.name || undefined,
          metadata: {
            userId: userId,
            platform: "ActionLadder"
          }
        });
        
        customerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId: customerId });
      }

      // Create SetupIntent for collecting payment method
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        usage: "off_session",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: userId,
          purpose: "default_payment_method"
        }
      });

      res.json({ 
        clientSecret: setupIntent.client_secret,
        customerId: customerId
      });

    } catch (error: any) {
      console.error('Error creating setup intent:', error);
      res.status(500).json({ 
        error: "Failed to create setup intent",
        message: error.message 
      });
    }
  };
}

// Attach confirmed payment method as default
export function attachPaymentMethod(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      // Get userId from authenticated session, never from request body
      const user = req.user as any;
      const userId = user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Zod validation for request body
      const validation = attachPaymentMethodSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: validation.error.errors 
        });
      }
      const { setupIntentId } = validation.data;

      // Retrieve setup intent to get payment method
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      
      if (setupIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "Setup intent not succeeded" });
      }

      if (!setupIntent.payment_method) {
        return res.status(400).json({ error: "No payment method found" });
      }

      // Get payment method details
      const paymentMethod = await stripe.paymentMethods.retrieve(
        setupIntent.payment_method as string
      );

      // Verify ownership
      if (setupIntent.metadata?.userId !== userId) {
        return res.status(403).json({ error: "Payment method ownership mismatch" });
      }

      // Deactivate previous default payment methods
      const existingMethods = await storage.getPaymentMethodsByUser(userId);
      for (const method of existingMethods.filter(m => m.isDefault)) {
        await storage.updatePaymentMethod(method.id, { isDefault: false });
      }

      // Store payment method in database
      const newPaymentMethod = await storage.createPaymentMethod({
        userId: userId,
        stripePaymentMethodId: paymentMethod.id,
        stripeSetupIntentId: setupIntent.id,
        type: paymentMethod.type,
        brand: paymentMethod.card?.brand || null,
        last4: paymentMethod.card?.last4 || null,
        expiryMonth: paymentMethod.card?.exp_month || null,
        expiryYear: paymentMethod.card?.exp_year || null,
        isDefault: true,
        isActive: true,
        metadata: {
          country: paymentMethod.card?.country,
          funding: paymentMethod.card?.funding,
          wallet: paymentMethod.card?.wallet?.type
        }
      });

      // CRITICAL: Sync Customer default payment method for off-session charges
      await stripe.customers.update(setupIntent.customer as string, {
        invoice_settings: {
          default_payment_method: paymentMethod.id
        }
      });

      res.json({ 
        success: true,
        paymentMethod: newPaymentMethod
      });

    } catch (error: any) {
      console.error('Error attaching payment method:', error);
      res.status(500).json({ 
        error: "Failed to attach payment method",
        message: error.message 
      });
    }
  };
}

// Get user's payment methods
export function getPaymentMethods(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      // Get userId from authenticated session, never from URL params
      const user = req.user as any;
      const userId = user.claims?.sub || user.id;
      
      const paymentMethods = await storage.getPaymentMethodsByUser(userId);
      const defaultMethod = await storage.getDefaultPaymentMethod(userId);
      
      res.json({
        paymentMethods: paymentMethods,
        defaultMethod: defaultMethod
      });

    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({ 
        error: "Failed to fetch payment methods",
        message: error.message 
      });
    }
  };
}

// Set default payment method
export function setDefaultPaymentMethod(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      // Get userId from authenticated session, never from request body
      const user = req.user as any;
      const userId = user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Zod validation for request body
      const validation = setDefaultPaymentMethodSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: validation.error.errors 
        });
      }
      const { paymentMethodId } = validation.data;

      // Verify ownership
      const paymentMethod = await storage.getPaymentMethod(paymentMethodId);
      if (!paymentMethod || paymentMethod.userId !== userId) {
        return res.status(403).json({ error: "Payment method not found or access denied" });
      }

      const updatedMethod = await storage.setDefaultPaymentMethod(userId, paymentMethodId);
      
      // CRITICAL: Sync Customer default payment method for off-session charges
      const dbUser = await storage.getUser(userId);
      if (dbUser?.stripeCustomerId) {
        await stripe.customers.update(dbUser.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethod.stripePaymentMethodId
          }
        });
      }
      
      res.json({ 
        success: true,
        defaultPaymentMethod: updatedMethod
      });

    } catch (error: any) {
      console.error('Error setting default payment method:', error);
      res.status(500).json({ 
        error: "Failed to set default payment method",
        message: error.message 
      });
    }
  };
}

// Deactivate payment method
export function deactivatePaymentMethod(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      // Get userId from authenticated session, never from request body
      const user = req.user as any;
      const userId = user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Zod validation for request body
      const validation = deactivatePaymentMethodSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: validation.error.errors 
        });
      }
      const { paymentMethodId } = validation.data;

      // Verify ownership
      const paymentMethod = await storage.getPaymentMethod(paymentMethodId);
      if (!paymentMethod || paymentMethod.userId !== userId) {
        return res.status(403).json({ error: "Payment method not found or access denied" });
      }

      // Detach from Stripe
      await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId);

      // Deactivate in database
      const updatedMethod = await storage.deactivatePaymentMethod(paymentMethodId);
      
      res.json({ 
        success: true,
        paymentMethod: updatedMethod
      });

    } catch (error: any) {
      console.error('Error deactivating payment method:', error);
      res.status(500).json({ 
        error: "Failed to deactivate payment method",
        message: error.message 
      });
    }
  };
}

// Handle Stripe webhooks for payment method events
export function handlePaymentWebhook(storage: IStorage) {
  return async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    let event: Stripe.Event;

    try {
      // CRITICAL: Use raw body buffer for signature verification
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error(`Webhook signature verification failed:`, err.message);
      return res.status(400).json({ error: "Invalid signature" });
    }

    try {
      // === IDEMPOTENCY PROTECTION ===
      // Check if webhook event already processed to prevent duplicates
      const existingEvents = await storage.getSystemMetricsByType("webhook_processed");
      const alreadyProcessed = existingEvents.find(metric => 
        metric.metadata && 
        typeof metric.metadata === 'object' && 
        'eventId' in metric.metadata && 
        metric.metadata.eventId === event.id
      );
      
      if (alreadyProcessed) {
        console.log(`Webhook event ${event.id} already processed, skipping...`);
        return res.json({ received: true });
      }

      // Record that we're processing this event (idempotency tracking)
      await storage.createSystemMetric({
        metricName: "webhook_event_processed",
        metricType: "webhook_processed",
        timeWindow: "hour",
        windowStart: new Date(),
        windowEnd: new Date(),
        value: 1,
        count: 1,
        metadata: {
          eventId: event.id,
          eventType: event.type,
          processedAt: new Date().toISOString()
        }
      });

      switch (event.type) {
        case 'setup_intent.succeeded': {
          const setupIntent = event.data.object as Stripe.SetupIntent;
          console.log(`SetupIntent succeeded: ${setupIntent.id} for customer: ${setupIntent.customer}`);
          
          // Update any pending records
          if (setupIntent.metadata?.userId) {
            // Log successful setup for analytics
            await storage.createSystemMetric({
              metricName: "payment_onboarding_success",
              metricType: "payment_onboarding_success",
              timeWindow: "hour",
              windowStart: new Date(),
              windowEnd: new Date(),
              value: 1,
              count: 1,
              metadata: {
                setupIntentId: setupIntent.id,
                userId: setupIntent.metadata.userId,
                eventId: event.id
              }
            });
          }
          break;
        }

        case 'payment_method.attached': {
          const paymentMethod = event.data.object as Stripe.PaymentMethod;
          console.log(`Payment method attached: ${paymentMethod.id} to customer: ${paymentMethod.customer}`);
          
          // Log successful attachment for analytics
          await storage.createSystemMetric({
            metricName: "payment_method_attached",
            metricType: "payment_method_attached",
            timeWindow: "hour", 
            windowStart: new Date(),
            windowEnd: new Date(),
            value: 1,
            count: 1,
            metadata: {
              paymentMethodId: paymentMethod.id,
              type: paymentMethod.type,
              brand: paymentMethod.card?.brand,
              eventId: event.id
            }
          });
          break;
        }

        case 'customer.updated': {
          const customer = event.data.object as Stripe.Customer;
          console.log(`Customer updated: ${customer.id}`);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });

    } catch (error: any) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  };
}
