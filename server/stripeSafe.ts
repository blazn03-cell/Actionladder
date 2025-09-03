import Stripe from "stripe";
import { sanitizeFields } from "@shared/safeLanguage";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

export async function createSafeProduct(payload: Stripe.ProductCreateParams) {
  const clean = sanitizeFields(payload as any, ["name", "description", "statement_descriptor"]);
  return stripe.products.create(clean);
}

export async function createSafePrice(payload: Stripe.PriceCreateParams) {
  // If you stuff descriptions in metadata, sanitize them
  const clean = sanitizeFields(payload as any, ["nickname"]);
  if (clean.metadata) {
    clean.metadata = sanitizeFields(clean.metadata, Object.keys(clean.metadata));
  }
  return stripe.prices.create(clean);
}

export async function updateSafeProduct(id: string, payload: Stripe.ProductUpdateParams) {
  const clean = sanitizeFields(payload as any, ["name", "description", "statement_descriptor"]);
  return stripe.products.update(id, clean);
}

export async function createSafeCheckoutSession(payload: Stripe.Checkout.SessionCreateParams) {
  const clean = sanitizeFields(payload as any, ["success_url", "cancel_url"]);
  if (clean.metadata) {
    clean.metadata = sanitizeFields(clean.metadata, Object.keys(clean.metadata));
  }
  return stripe.checkout.sessions.create(clean);
}

// Re-export regular stripe for non-text operations
export { stripe };