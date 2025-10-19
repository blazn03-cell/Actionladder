import { type Express } from "express";
import { type IStorage } from "../storage";
import { requireAnyAuth } from "../middleware/auth";
import express from "express";
import * as paymentOnboardingController from "../controllers/paymentOnboarding.controller";

export function setupPaymentOnboardingRoutes(app: Express, storage: IStorage) {

  // Create SetupIntent for collecting default payment method
  app.post("/api/payments/setup-intent", requireAnyAuth, paymentOnboardingController.createSetupIntent(storage));

  // Attach confirmed payment method as default
  app.post("/api/payments/attach", requireAnyAuth, paymentOnboardingController.attachPaymentMethod(storage));

  // Get user's payment methods
  app.get("/api/payments/methods", requireAnyAuth, paymentOnboardingController.getPaymentMethods(storage));

  // Set default payment method
  app.post("/api/payments/set-default", requireAnyAuth, paymentOnboardingController.setDefaultPaymentMethod(storage));

  // Deactivate payment method
  app.post("/api/payments/deactivate", requireAnyAuth, paymentOnboardingController.deactivatePaymentMethod(storage));

  // === WEBHOOK HANDLERS ===
  
  // CRITICAL: Add raw body middleware for webhook signature verification
  // Must be applied BEFORE the webhook route to prevent JSON parsing
  app.use('/api/webhooks/payment-onboarding', express.raw({type: 'application/json'}));
  
  // Handle Stripe webhooks for payment method events
  app.post("/api/webhooks/payment-onboarding", paymentOnboardingController.handlePaymentWebhook(storage));
}
