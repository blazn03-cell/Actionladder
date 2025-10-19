import { storage } from "../storage";
import type { InsertPrizePool, InsertPrizePoolContribution, InsertPrizePoolDistribution } from "@shared/schema";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Prize Pool Distribution Percentages (Pro tier with corrected Growth Fund)
export const DISTRIBUTION_CONFIG = {
  rookie: {
    winner: 0.65,      // 65%
    operator: 0.20,    // 20%
    trustee: 0.10,     // 10%
    growthFund: 0.05   // 5%
  },
  basic: {
    winner: 0.62,      // 62%
    operator: 0.22,    // 22%
    trustee: 0.10,     // 10%
    growthFund: 0.06   // 6%
  },
  pro: {
    winner: 0.28,      // 28%
    operator: 0.25,    // 25%
    trustee: 0.20,     // 20%
    admin: 0.13,       // 13% (reduced from 14% to total 100%)
    growthFund: 0.07,  // 7%
    platform: 0.07     // 7%
  }
};

export interface PrizePoolCalculationInput {
  challengeFees: number;      // Head-to-head challenge fees
  subscriptionFees: number;   // Tournament % from subscriptions
  nonMemberFees: number;      // Non-member match fees
  extras: number;             // Break & Run, Hill-Hill, Fines, Sponsors
}

export interface PrizePoolCalculationResult {
  totalContributions: number;
  challengeFees: number;
  subscriptionFees: number;
  nonMemberFees: number;
  extras: number;
  platformFee: number;
  operatorCut: number;
  trusteeCut: number;
  adminCut: number;
  growthFund: number;
  availableForDistribution: number;
}

/**
 * Calculate Prize Pool distribution based on input contributions
 * Example from requirements:
 * - Challenge fees: 20 × $60 = $1,200
 * - Subscriptions: 20 Rookie × $7.00 = $140
 * - Non-member fees: $12 × 10 matches = $120
 * - Extras: $40 + $100 + $100 + $200 = $440
 * - Total Prize Pool = $700 (after deductions)
 */
export function calculatePrizePool(
  input: PrizePoolCalculationInput,
  tier: 'rookie' | 'basic' | 'pro' = 'basic'
): PrizePoolCalculationResult {
  const { challengeFees, subscriptionFees, nonMemberFees, extras } = input;
  
  // Total contributions (all in cents)
  const totalContributions = challengeFees + subscriptionFees + nonMemberFees + extras;
  
  // Get distribution config for tier
  const config = DISTRIBUTION_CONFIG[tier];
  
  // Calculate distributions (all amounts in cents)
  const platformFee = Math.floor(totalContributions * (config.platform || 0));
  const operatorCut = Math.floor(totalContributions * config.operator);
  const trusteeCut = Math.floor(totalContributions * config.trustee);
  const adminCut = Math.floor(totalContributions * (config.admin || 0));
  const growthFund = Math.floor(totalContributions * config.growthFund);
  
  // Available for distribution to winners (everything except the allocated cuts)
  const availableForDistribution = totalContributions - platformFee - operatorCut - trusteeCut - adminCut - growthFund;
  
  return {
    totalContributions,
    challengeFees,
    subscriptionFees,
    nonMemberFees,
    extras,
    platformFee,
    operatorCut,
    trusteeCut,
    adminCut,
    growthFund,
    availableForDistribution
  };
}

/**
 * Create or update a Prize Pool with aggregated contributions
 */
export async function createOrUpdatePrizePool(
  poolId: string,
  poolType: string,
  hallId: string,
  name: string,
  contributions: PrizePoolCalculationInput,
  tier: 'rookie' | 'basic' | 'pro' = 'basic'
) {
  // Calculate distributions
  const calculation = calculatePrizePool(contributions, tier);
  
  // Check if prize pool exists
  let prizePool = await storage.getPrizePoolByPoolId(poolId);
  
  if (prizePool) {
    // Update existing prize pool
    prizePool = await storage.updatePrizePool(prizePool.id, {
      ...calculation,
      updatedAt: new Date()
    });
  } else {
    // Create new prize pool
    const insertData: InsertPrizePool = {
      poolId,
      poolType,
      hallId,
      name,
      description: `Prize Pool for ${name}`,
      ...calculation,
      status: 'active',
      distributionPlan: {
        tier,
        config: DISTRIBUTION_CONFIG[tier]
      }
    };
    
    prizePool = await storage.createPrizePool(insertData);
  }
  
  return prizePool;
}

/**
 * Add a contribution to a Prize Pool
 */
export async function addPrizePoolContribution(
  poolId: string,
  contributionType: 'challenge_fee' | 'subscription' | 'non_member_fee' | 'extra',
  sourceType: string,
  sourceId: string,
  playerId: string,
  amount: number,
  stripePaymentIntentId?: string,
  metadata?: any
) {
  const contribution: InsertPrizePoolContribution = {
    poolId,
    contributionType,
    sourceType,
    sourceId,
    playerId,
    amount,
    stripePaymentIntentId: stripePaymentIntentId || null,
    metadata: metadata || null
  };
  
  return await storage.createPrizePoolContribution(contribution);
}

/**
 * Distribute Prize Pool to recipients via Stripe Connect
 */
export async function distributePrizePool(
  poolId: string,
  recipients: Array<{
    recipientType: 'winner' | 'operator' | 'trustee' | 'growth_fund' | 'platform';
    recipientId: string;
    amount: number;
    percentage: number;
    stripeConnectId?: string;
  }>
) {
  const prizePool = await storage.getPrizePoolByPoolId(poolId);
  
  if (!prizePool) {
    throw new Error(`Prize Pool ${poolId} not found`);
  }
  
  if (prizePool.status === 'distributed') {
    throw new Error(`Prize Pool ${poolId} already distributed`);
  }
  
  // Lock the prize pool
  await storage.lockPrizePool(poolId);
  
  const distributions: InsertPrizePoolDistribution[] = [];
  
  for (const recipient of recipients) {
    const distribution: InsertPrizePoolDistribution = {
      poolId,
      recipientType: recipient.recipientType,
      recipientId: recipient.recipientId,
      amount: recipient.amount,
      percentage: recipient.percentage,
      status: 'pending'
    };
    
    const created = await storage.createPrizePoolDistribution(distribution);
    
    // Create Stripe Connect transfer if recipient has stripeConnectId
    if (recipient.stripeConnectId && recipient.amount > 0) {
      try {
        const transfer = await stripe.transfers.create({
          amount: recipient.amount,
          currency: 'usd',
          destination: recipient.stripeConnectId,
          metadata: {
            pool_id: poolId,
            recipient_type: recipient.recipientType,
            recipient_id: recipient.recipientId
          }
        });
        
        await storage.markDistributionCompleted(created.id, transfer.id);
      } catch (error: any) {
        await storage.markDistributionFailed(created.id, error.message);
        console.error(`Failed to distribute to ${recipient.recipientId}:`, error);
      }
    }
    
    distributions.push(created);
  }
  
  // Mark prize pool as distributed
  await storage.updatePrizePool(prizePool.id, {
    status: 'distributed',
    distributed: recipients.reduce((sum, r) => sum + r.amount, 0)
  });
  
  return distributions;
}

/**
 * Generate Stripe metadata for Prize Pool tracking
 */
export function generatePrizePoolMetadata(
  poolId: string,
  productType: 'tournament_entry_fee' | 'challenge_fee' | 'non_member_fee' | 'extra',
  hallId: string,
  additionalMetadata?: Record<string, string>
) {
  return {
    pool_id: poolId,
    product_type: productType,
    hall_id: hallId,
    ...additionalMetadata
  };
}

/**
 * Example Prize Pool calculation from requirements
 */
export function calculateExamplePrizePool() {
  const input: PrizePoolCalculationInput = {
    challengeFees: 20 * 6000,    // 20 matches × $60 = $1,200 (120000 cents)
    subscriptionFees: 20 * 700,  // 20 Rookie × $7 = $140 (14000 cents)
    nonMemberFees: 12 * 1000,    // $12 × 10 matches = $120 (12000 cents)  
    extras: 4000 + 10000 + 10000 + 20000  // $40 + $100 + $100 + $200 = $440 (44000 cents)
  };
  
  // Total: $1,900 (190000 cents)
  // Expected Prize Pool after deductions: $700 (70000 cents)
  
  return calculatePrizePool(input, 'basic');
}
