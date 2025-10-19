import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export interface RefundOptions {
  paymentIntentId: string;
  amountCents?: number; // Optional partial refund amount in cents
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}

export interface RefundResult {
  refundId: string;
  status: string;
  amount: number;
  paymentIntentId: string;
  reason?: string;
}

/**
 * Refund a deposit or payment
 * Used for: reservation deposits when attendance is verified, no-show penalties, etc.
 */
export async function refundDeposit(options: RefundOptions): Promise<RefundResult> {
  try {
    const refundData: Stripe.RefundCreateParams = {
      payment_intent: options.paymentIntentId,
      reason: options.reason || 'requested_by_customer',
      metadata: {
        refund_type: 'deposit_refund',
        refunded_at: new Date().toISOString(),
        ...options.metadata,
      },
    };

    // Add amount for partial refunds
    if (options.amountCents) {
      refundData.amount = options.amountCents;
    }

    const refund = await stripe.refunds.create(refundData);

    return {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount,
      paymentIntentId: refund.payment_intent as string,
      reason: refund.reason,
    };
  } catch (error: any) {
    console.error('Refund failed:', error);
    throw new Error(`Refund failed: ${error.message}`);
  }
}

/**
 * Refund a match entry fee (for cancellations, etc.)
 */
export async function refundMatchEntry(
  paymentIntentId: string,
  matchId: string,
  userId: string,
  amountCents?: number
): Promise<RefundResult> {
  return refundDeposit({
    paymentIntentId,
    amountCents,
    reason: 'requested_by_customer',
    metadata: {
      match_id: matchId,
      user_id: userId,
      refund_reason: 'match_cancellation',
    },
  });
}

/**
 * Process no-show penalty by refusing refund or charging additional fee
 */
export async function processNoShowPenalty(
  paymentIntentId: string,
  userId: string,
  venueId: string
): Promise<{ penaltyApplied: boolean; message: string }> {
  try {
    // For no-shows, we typically don't refund the deposit
    // This is just logging the no-show for future penalty tracking
    
    console.log(`No-show penalty applied: User ${userId}, Payment ${paymentIntentId}, Venue ${venueId}`);
    
    return {
      penaltyApplied: true,
      message: 'No-show penalty applied. Deposit forfeited.',
    };
  } catch (error: any) {
    console.error('No-show penalty processing failed:', error);
    return {
      penaltyApplied: false,
      message: 'Failed to process no-show penalty',
    };
  }
}

/**
 * Refund tournament entry when tournament is cancelled
 */
export async function refundTournamentEntry(
  paymentIntentId: string,
  tournamentId: string,
  userId: string,
  reason: string = 'tournament_cancelled'
): Promise<RefundResult> {
  return refundDeposit({
    paymentIntentId,
    reason: 'requested_by_customer',
    metadata: {
      tournament_id: tournamentId,
      user_id: userId,
      refund_reason: reason,
    },
  });
}

/**
 * Check if a payment can be refunded (within Stripe's refund window)
 */
export async function canRefundPayment(paymentIntentId: string): Promise<{
  canRefund: boolean;
  reason?: string;
  maxRefundAmount?: number;
}> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const charges = await stripe.charges.list({ payment_intent: paymentIntentId });
    
    if (charges.data.length === 0) {
      return { canRefund: false, reason: 'No charges found' };
    }
    
    const charge = charges.data[0];
    const chargeDate = new Date(charge.created * 1000);
    const now = new Date();
    const daysSinceCharge = (now.getTime() - chargeDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Stripe allows refunds within ~180 days for most payment methods
    if (daysSinceCharge > 180) {
      return { canRefund: false, reason: 'Refund window expired (>180 days)' };
    }
    
    const alreadyRefunded = charge.amount_refunded || 0;
    const maxRefundAmount = charge.amount - alreadyRefunded;
    
    if (maxRefundAmount <= 0) {
      return { canRefund: false, reason: 'Already fully refunded' };
    }
    
    return {
      canRefund: true,
      maxRefundAmount,
    };
  } catch (error: any) {
    console.error('Error checking refund eligibility:', error);
    return { canRefund: false, reason: 'Error checking payment status' };
  }
}