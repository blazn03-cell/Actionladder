import Stripe from 'stripe';
import { storage } from '../storage';
import type { InsertSubscriptionReward } from '@shared/schema';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

export async function createTrainingRewardCoupon(
  discountPercent: 50 | 100,
  hallId: string,
  playerId: string,
  period: string
): Promise<string> {
  const couponId = `TRAIN_REWARD_${hallId}_${period.replace(/-/g, '_')}_${discountPercent}`;
  
  try {
    const existingCoupon = await stripe.coupons.retrieve(couponId).catch(() => null);
    
    if (existingCoupon) {
      console.log(`Coupon ${couponId} already exists, reusing it`);
      return couponId;
    }
    
    const coupon = await stripe.coupons.create({
      id: couponId,
      percent_off: discountPercent,
      duration: 'repeating',
      duration_in_months: 1,
      max_redemptions: 1,
      metadata: {
        hallId,
        playerId,
        period,
        rewardType: 'training'
      }
    });

    console.log(`Created training reward coupon: ${coupon.id} (${discountPercent}% off)`);
    return coupon.id;
  } catch (error: any) {
    console.error('Failed to create training reward coupon:', error.message);
    throw error;
  }
}

export async function applyRewardToSubscription(
  subscriptionId: string,
  couponId: string
): Promise<boolean> {
  try {
    await stripe.subscriptions.update(subscriptionId, {
      discounts: [{ coupon: couponId }]
    } as any);
    console.log(`Applied coupon ${couponId} to subscription ${subscriptionId}`);
    return true;
  } catch (error: any) {
    console.error(`Failed to apply reward coupon ${couponId} to subscription ${subscriptionId}:`, error.message);
    return false;
  }
}

export async function getPlayerSubscription(playerId: string): Promise<{
  subscriptionId: string;
  customerId: string;
  status: string;
} | null> {
  try {
    const subscriptions = await storage.getMembershipSubscriptionsByPlayer(playerId);
    const subscription = subscriptions[0];
    
    if (!subscription || !subscription.stripeSubscriptionId) {
      console.log(`No active subscription found for player ${playerId}`);
      return null;
    }

    if (subscription.status !== 'active') {
      console.log(`Player ${playerId} subscription is not active (status: ${subscription.status})`);
      return null;
    }

    return {
      subscriptionId: subscription.stripeSubscriptionId,
      customerId: subscription.stripeCustomerId || '',
      status: subscription.status
    };
  } catch (error: any) {
    console.error(`Error fetching subscription for player ${playerId}:`, error.message);
    return null;
  }
}

export async function generateMonthlyRewardCoupons(winners: Array<{
  playerId: string;
  hallId: string;
  ladderId: string;
  discountPercent: 50 | 100;
  period: string;
}>): Promise<Array<{
  playerId: string;
  hallId: string;
  couponId: string | null;
  applied: boolean;
  error?: string;
  rewardId?: string;
}>> {
  const results = [];

  for (const winner of winners) {
    const result = {
      playerId: winner.playerId,
      hallId: winner.hallId,
      couponId: null as string | null,
      applied: false,
      error: undefined as string | undefined,
      rewardId: undefined as string | undefined
    };

    try {
      const couponId = await createTrainingRewardCoupon(
        winner.discountPercent,
        winner.hallId,
        winner.playerId,
        winner.period
      );
      result.couponId = couponId;

      const rewardType = winner.discountPercent === 100 ? 'free' : 'half';
      const rewardData: InsertSubscriptionReward = {
        playerId: winner.playerId,
        hallId: winner.hallId,
        ladderId: winner.ladderId,
        period: winner.period,
        rewardType,
        appliedToStripe: false,
        stripeCouponId: couponId,
      };

      const createdReward = await storage.createReward(rewardData);
      result.rewardId = createdReward.id;
      console.log(`Created reward record ${createdReward.id} for player ${winner.playerId}`);

      const playerSub = await getPlayerSubscription(winner.playerId);
      
      if (playerSub && playerSub.subscriptionId) {
        const applied = await applyRewardToSubscription(playerSub.subscriptionId, couponId);
        result.applied = applied;

        if (applied) {
          await storage.markRewardApplied(createdReward.id, couponId);
          console.log(`Successfully applied reward to player ${winner.playerId}'s subscription`);
        } else {
          result.error = 'Failed to apply coupon to subscription';
        }
      } else {
        result.error = 'No active subscription found';
        console.log(`Player ${winner.playerId} has no active subscription - reward created but not applied`);
      }
    } catch (error: any) {
      result.error = error.message;
      console.error(`Error processing reward for player ${winner.playerId}:`, error.message);
    }

    results.push(result);
  }

  const successCount = results.filter(r => r.applied).length;
  const totalCount = results.length;
  console.log(`Monthly rewards processing complete: ${successCount}/${totalCount} successfully applied`);

  return results;
}
