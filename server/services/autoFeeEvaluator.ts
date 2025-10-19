import Stripe from "stripe";
import { IStorage } from "../storage";
// Helper function to sanitize text objects
function sanitizeTextObj(obj: any): any {
  if (typeof obj === 'string') {
    return obj.replace(/[<>"'&]/g, '');
  }
  return obj;
}

export interface FeeEvaluationConfig {
  // Time thresholds (in minutes)
  lateArrivalThreshold: number;
  noShowThreshold: number;
  cancellationThreshold: number;
  
  // Fee amounts (in cents)
  lateArrivalFee: number;
  noShowFee: number;
  lastMinuteCancellationFee: number;
  
  // Enforcement settings
  enabled: boolean;
  graceMinutes: number;
}

export interface FeeEvaluationResult {
  challengeId: string;
  playerId: string;
  feeType: 'late' | 'no_show' | 'cancellation';
  amount: number;
  reason: string;
  applied: boolean;
  stripeChargeId?: string;
  error?: string;
}

export class AutoFeeEvaluator {
  constructor(
    private storage: IStorage,
    private stripe: Stripe
  ) {}

  /**
   * Evaluate all active challenges for automatic fees
   */
  async evaluateAllChallenges(): Promise<FeeEvaluationResult[]> {
    const results: FeeEvaluationResult[] = [];
    const now = new Date();
    
    try {
      // Get challenges from the last 48 hours that might need fees
      const startDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const challenges = await this.storage.getChallengesByDateRange(startDate, now);
      
      for (const challenge of challenges) {
        // Skip if challenge is already completed
        if (challenge.status === 'completed') {
          continue;
        }
        
        // Get policy for this hall
        const policy = await this.storage.getChallengesPolicyByHall(challenge.hallId);
        if (!policy) continue;
        
        const config = this.buildFeeConfig(policy);
        if (!config.enabled) continue;
        
        // Evaluate fees for this challenge
        const challengeResults = await this.evaluateChallenge(challenge, config);
        results.push(...challengeResults);
      }
      
      return results;
    } catch (error) {
      console.error('Error evaluating challenges for fees:', error);
      return [];
    }
  }

  /**
   * Evaluate a single challenge for fees
   */
  private async evaluateChallenge(challenge: any, config: FeeEvaluationConfig): Promise<FeeEvaluationResult[]> {
    const results: FeeEvaluationResult[] = [];
    const now = new Date();
    const challengeTime = new Date(challenge.scheduledAt);
    
    // Check if challenge time has passed
    const minutesSinceScheduled = (now.getTime() - challengeTime.getTime()) / (1000 * 60);
    
    // Get existing check-ins for this challenge
    const checkIns = await this.storage.getChallengeCheckInsByChallenge(challenge.id);
    const existingFees = await this.storage.getChallengeFeesByChallenge(challenge.id);
    
    // Check each participant
    const participants = [challenge.aPlayerId, challenge.bPlayerId].filter(Boolean);
    
    for (const playerId of participants) {
      const playerCheckIn = checkIns.find(ci => ci.playerId === playerId);
      const playerFees = existingFees.filter(fee => fee.playerId === playerId);
      
      // Skip if player has successfully charged fees for this challenge
      const hasChargedFees = playerFees.some(fee => fee.status === 'charged');
      if (hasChargedFees) continue;
      
      // Evaluate no-show fee
      if (minutesSinceScheduled > config.noShowThreshold && !playerCheckIn) {
        const result = await this.applyFee(
          challenge.id,
          playerId,
          'no_show',
          config.noShowFee,
          `No-show for scheduled challenge at ${challengeTime.toLocaleString()}`
        );
        results.push(result);
      }
      // Evaluate late arrival fee
      else if (playerCheckIn) {
        const checkInTime = new Date(playerCheckIn.checkedInAt);
        const lateMinutes = (checkInTime.getTime() - challengeTime.getTime()) / (1000 * 60);
        
        // Only charge if late by threshold + grace period (prevents overcharging)
        if (lateMinutes >= config.lateArrivalThreshold + config.graceMinutes) {
          const result = await this.applyFee(
            challenge.id,
            playerId,
            'late',
            config.lateArrivalFee,
            `Late arrival: ${Math.round(lateMinutes)} minutes after scheduled time (threshold: ${config.lateArrivalThreshold + config.graceMinutes} minutes)`
          );
          results.push(result);
        }
      }
    }
    
    return results;
  }

  /**
   * Apply a fee to a player's account
   */
  private async applyFee(
    challengeId: string,
    playerId: string,
    feeType: 'late' | 'no_show' | 'cancellation',
    amount: number,
    reason: string
  ): Promise<FeeEvaluationResult> {
    try {
      // Check for existing fee record to prevent duplicates
      const existingFees = await this.storage.getChallengeFeesByChallenge(challengeId);
      const existingFee = existingFees.find(fee => 
        fee.playerId === playerId && 
        fee.feeType === feeType && 
        fee.status !== 'charged'
      );
      
      if (existingFee) {
        // Update existing fee if found instead of creating duplicate
        return await this.retryFeePayment(existingFee);
      }

      // Get player information
      const player = await this.storage.getPlayer(playerId);
      if (!player || !player.stripeCustomerId) {
        return {
          challengeId,
          playerId,
          feeType,
          amount,
          reason,
          applied: false,
          error: 'Player not found or no Stripe customer ID'
        };
      }

      // Get customer's default payment method
      const customer = await this.stripe.customers.retrieve(player.stripeCustomerId);
      const defaultPaymentMethodId = (customer as any).invoice_settings?.default_payment_method;
      
      if (!defaultPaymentMethodId) {
        // No default payment method - mark fee as pending
        await this.storage.createChallengeFee({
          challengeId,
          playerId,
          feeType,
          amount,
          scheduledAt: new Date(),
          status: 'pending'
        });
        
        return {
          challengeId,
          playerId,
          feeType,
          amount,
          reason,
          applied: false,
          error: 'No default payment method on file'
        };
      }

      // Create deterministic idempotency key to prevent duplicate charges
      const idempotencyKey = `fee_${challengeId}_${playerId}_${feeType}`;

      // Create payment intent for off-session use
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        customer: player.stripeCustomerId,
        payment_method: defaultPaymentMethodId,
        description: sanitizeTextObj(`Challenge ${feeType.replace('_', ' ')} fee: ${reason}`),
        metadata: {
          type: 'challenge_fee',
          challengeId,
          playerId,
          feeType
        },
        confirmation_method: 'automatic',
        confirm: true,
        off_session: true
      }, {
        idempotencyKey
      });

      // Record fee in database
      await this.storage.createChallengeFee({
        challengeId,
        playerId,
        feeType,
        amount,
        scheduledAt: new Date(),
        stripeChargeId: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'charged' : 'pending'
      });

      return {
        challengeId,
        playerId,
        feeType,
        amount,
        reason,
        applied: true,
        stripeChargeId: paymentIntent.id
      };
    } catch (error: any) {
      console.error(`Error applying fee for challenge ${challengeId}:`, error);
      
      // Handle specific Stripe errors
      let status = 'failed';
      let errorMessage = error.message;
      
      if (error.type === 'StripeCardError' && error.payment_intent) {
        // Card error but payment intent was created - mark as pending
        status = 'pending';
        errorMessage = 'Payment requires customer action';
      }
      
      // Record the fee attempt in database
      try {
        await this.storage.createChallengeFee({
          challengeId,
          playerId,
          feeType,
          amount,
          scheduledAt: new Date(),
          stripeChargeId: error.payment_intent?.id,
          status
        });
      } catch (dbError) {
        console.error('Error recording failed fee:', dbError);
      }

      return {
        challengeId,
        playerId,
        feeType,
        amount,
        reason,
        applied: false,
        error: errorMessage
      };
    }
  }

  /**
   * Build fee configuration from challenge policy
   */
  private buildFeeConfig(policy: any): FeeEvaluationConfig {
    return {
      lateArrivalThreshold: policy.lateArrivalThresholdMinutes ?? 15,
      noShowThreshold: policy.noShowThresholdMinutes ?? 30,
      cancellationThreshold: policy.cancellationThresholdHours ? policy.cancellationThresholdHours * 60 : 120,
      lateArrivalFee: policy.lateArrivalFeeAmount ?? 500, // $5.00
      noShowFee: policy.noShowFeeAmount ?? 1000, // $10.00
      lastMinuteCancellationFee: policy.lastMinuteCancellationFeeAmount ?? 750, // $7.50
      enabled: policy.autoFeesEnabled ?? true,
      graceMinutes: policy.graceMinutes ?? 5
    };
  }

  /**
   * Process pending fees - retry payments that failed or require action
   */
  async processPendingFees(): Promise<FeeEvaluationResult[]> {
    const results: FeeEvaluationResult[] = [];
    
    try {
      // Get all pending and failed fees from the last 7 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      
      const pendingFees = await this.storage.getChallengeFeesByStatus(['pending', 'failed']);
      
      for (const fee of pendingFees) {
        // Skip very old fees
        if (new Date(fee.scheduledAt) < cutoffDate) {
          continue;
        }
        
        const result = await this.retryFeePayment(fee);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Error processing pending fees:', error);
      return [];
    }
  }

  /**
   * Retry payment for a specific fee
   */
  private async retryFeePayment(fee: any): Promise<FeeEvaluationResult> {
    try {
      // Get player information
      const player = await this.storage.getPlayer(fee.playerId);
      if (!player || !player.stripeCustomerId) {
        return {
          challengeId: fee.challengeId,
          playerId: fee.playerId,
          feeType: fee.feeType,
          amount: fee.amount,
          reason: 'Retry failed - player not found or no Stripe customer',
          applied: false,
          error: 'Player not found or no Stripe customer ID'
        };
      }

      // Get customer's default payment method
      const customer = await this.stripe.customers.retrieve(player.stripeCustomerId);
      const defaultPaymentMethodId = (customer as any).invoice_settings?.default_payment_method;
      
      if (!defaultPaymentMethodId) {
        return {
          challengeId: fee.challengeId,
          playerId: fee.playerId,
          feeType: fee.feeType,
          amount: fee.amount,
          reason: 'Retry failed - no payment method',
          applied: false,
          error: 'No default payment method on file'
        };
      }

      let paymentIntent;
      
      // Try to retrieve existing PaymentIntent if stripeChargeId exists
      if (fee.stripeChargeId) {
        try {
          const existingPI = await this.stripe.paymentIntents.retrieve(fee.stripeChargeId);
          
          // If payment method changed and PaymentIntent can be updated
          if (existingPI.status === 'requires_payment_method' || 
              (existingPI.status === 'requires_action' && existingPI.payment_method !== defaultPaymentMethodId)) {
            
            // Update payment method and attempt confirmation
            paymentIntent = await this.stripe.paymentIntents.update(existingPI.id, {
              payment_method: defaultPaymentMethodId
            });
            
            paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntent.id, {
              payment_method: defaultPaymentMethodId,
              off_session: true
            });
          } else if (existingPI.status === 'succeeded') {
            // Already succeeded, update our record
            await this.storage.updateChallengeFee(fee.id, {
              status: 'charged'
            });
            
            return {
              challengeId: fee.challengeId,
              playerId: fee.playerId,
              feeType: fee.feeType,
              amount: fee.amount,
              reason: 'Payment already succeeded',
              applied: true,
              stripeChargeId: existingPI.id
            };
          } else {
            // Use existing PaymentIntent as-is
            paymentIntent = existingPI;
          }
        } catch (retrieveError) {
          console.warn(`Could not retrieve existing PaymentIntent ${fee.stripeChargeId}, creating new one:`, retrieveError);
          // Fall through to create new PaymentIntent
        }
      }
      
      // Create new PaymentIntent if we don't have a usable existing one
      if (!paymentIntent) {
        // Use fee.id in idempotency key to allow retries when payment methods change
        const idempotencyKey = `fee_retry_${fee.id}_${defaultPaymentMethodId.slice(-4)}`;
        
        paymentIntent = await this.stripe.paymentIntents.create({
          amount: fee.amount,
          currency: 'usd',
          customer: player.stripeCustomerId,
          payment_method: defaultPaymentMethodId,
          description: sanitizeTextObj(`Challenge ${fee.feeType.replace('_', ' ')} fee retry`),
          metadata: {
            type: 'challenge_fee',
            challengeId: fee.challengeId,
            playerId: fee.playerId,
            feeType: fee.feeType,
            originalFeeId: fee.id
          },
          confirmation_method: 'automatic',
          confirm: true,
          off_session: true
        }, {
          idempotencyKey
        });
      }

      // Update fee record with new status and charge ID
      const newStatus = paymentIntent.status === 'succeeded' ? 'charged' : 
                       paymentIntent.status === 'requires_action' ? 'pending' : 'failed';
      
      await this.storage.updateChallengeFee(fee.id, {
        stripeChargeId: paymentIntent.id,
        status: newStatus
      });

      return {
        challengeId: fee.challengeId,
        playerId: fee.playerId,
        feeType: fee.feeType,
        amount: fee.amount,
        reason: `Fee retry attempt`,
        applied: newStatus === 'charged',
        stripeChargeId: paymentIntent.id
      };
    } catch (error: any) {
      console.error(`Error retrying fee payment for fee ${fee.id}:`, error);
      
      // Update status on failure
      await this.storage.updateChallengeFee(fee.id, {
        status: 'failed'
      });
      
      return {
        challengeId: fee.challengeId,
        playerId: fee.playerId,
        feeType: fee.feeType,
        amount: fee.amount,
        reason: `Fee retry attempt failed`,
        applied: false,
        error: error.message
      };
    }
  }

  /**
   * Run evaluation for a specific challenge (manual trigger)
   */
  async evaluateSpecificChallenge(challengeId: string): Promise<FeeEvaluationResult[]> {
    try {
      const challenge = await this.storage.getChallenge(challengeId);
      if (!challenge) {
        return [];
      }

      const policy = await this.storage.getChallengesPolicyByHall(challenge.hallId);
      if (!policy) {
        return [];
      }

      const config = this.buildFeeConfig(policy);
      return await this.evaluateChallenge(challenge, config);
    } catch (error) {
      console.error(`Error evaluating specific challenge ${challengeId}:`, error);
      return [];
    }
  }
}