import { storage } from "./storage";

// Commission rate structure based on membership tiers
export const COMMISSION_RATES = {
  PLATFORM: {
    nonmember: 1500, // 15% for non-members
    basic: 1000, // 10% for basic members  
    pro: 800, // 8% for pro members (reduced rate)
  },
  OPERATOR: {
    nonmember: 500, // 5% for non-members
    basic: 600, // 6% for basic members
    pro: 700, // 7% for pro members
  },
  ESCROW: {
    default: 250, // 2.5% default
    high_volume: 200, // 2% for high volume (over $500)
  },
  MEMBERSHIP: {
    rookie: {
      price: 2000, // $20 in cents
      operatorCut: 400, // $4 operator commission
    },
    basic: {
      price: 2500, // $25 in cents  
      operatorCut: 700, // $7 operator commission
    },
    pro: {
      price: 6000, // $60 in cents
      operatorCut: 1000, // $10 operator commission
    },
  },
};

export interface CommissionCalculation {
  grossAmount: number;
  platformAmount: number;
  operatorAmount: number;
  prizePoolAmount: number;
  platformCommissionBps: number;
  operatorCommissionBps: number;
}

export interface MembershipCommission {
  grossAmount: number;
  platformAmount: number;
  operatorAmount: number;
  membershipTier: string;
}

export class CommissionCalculator {
  /**
   * Calculate commissions for match stakes based on player membership
   */
  static async calculateMatchCommission(
    stakeAmount: number,
    challengerId: string,
    opponentId: string,
    operatorId: string
  ): Promise<CommissionCalculation> {
    // Get player membership tiers
    const challenger = await storage.getPlayer(challengerId);
    const opponent = await storage.getPlayer(opponentId);
    
    // Determine the best membership tier (lowest commission rate applies)
    const challengerTier = challenger?.membershipTier || "none";
    const opponentTier = opponent?.membershipTier || "none";
    
    // Use the better (lower commission) tier of the two players
    const effectiveTier = this.getBestMembershipTier(challengerTier, opponentTier);
    
    // Get commission rates
    const platformBps = COMMISSION_RATES.PLATFORM[effectiveTier as keyof typeof COMMISSION_RATES.PLATFORM];
    const operatorBps = COMMISSION_RATES.OPERATOR[effectiveTier as keyof typeof COMMISSION_RATES.OPERATOR];
    
    // Calculate amounts
    const platformAmount = Math.floor((stakeAmount * platformBps) / 10000);
    const operatorAmount = Math.floor((stakeAmount * operatorBps) / 10000);
    const prizePoolAmount = stakeAmount - platformAmount - operatorAmount;
    
    return {
      grossAmount: stakeAmount,
      platformAmount,
      operatorAmount,
      prizePoolAmount,
      platformCommissionBps: platformBps,
      operatorCommissionBps: operatorBps,
    };
  }

  /**
   * Calculate escrow commissions for challenge pools
   */
  static calculateEscrowCommission(poolAmount: number): CommissionCalculation {
    // Use higher rate (5%) for pools under $500, lower rate (2%) for larger pools
    const commissionBps = poolAmount >= 50000 ? COMMISSION_RATES.ESCROW.high_volume : COMMISSION_RATES.ESCROW.default * 2;
    
    const platformAmount = Math.floor((poolAmount * commissionBps) / 10000);
    const operatorAmount = 0; // Escrow fees go entirely to platform
    const prizePoolAmount = poolAmount - platformAmount;
    
    return {
      grossAmount: poolAmount,
      platformAmount,
      operatorAmount,
      prizePoolAmount,
      platformCommissionBps: commissionBps,
      operatorCommissionBps: 0,
    };
  }

  /**
   * Calculate membership commission splits
   */
  static calculateMembershipCommission(membershipTier: string): MembershipCommission {
    const rates = COMMISSION_RATES.MEMBERSHIP[membershipTier as keyof typeof COMMISSION_RATES.MEMBERSHIP];
    
    if (!rates) {
      throw new Error(`Invalid membership tier: ${membershipTier}`);
    }
    
    const grossAmount = rates.price;
    const operatorAmount = rates.operatorCut;
    const platformAmount = grossAmount - operatorAmount;
    
    return {
      grossAmount,
      platformAmount,
      operatorAmount,
      membershipTier,
    };
  }

  /**
   * Record platform earnings for tracking and payouts
   */
  static async recordPlatformEarnings(
    operatorId: string,
    sourceType: string,
    sourceId: string,
    calculation: CommissionCalculation
  ): Promise<void> {
    await storage.createPlatformEarnings({
      operatorId,
      sourceType,
      sourceId,
      grossAmount: calculation.grossAmount,
      platformAmount: calculation.platformAmount,
      operatorAmount: calculation.operatorAmount,
      platformCommissionBps: calculation.platformCommissionBps,
      operatorCommissionBps: calculation.operatorCommissionBps,
      settlementStatus: "pending",
    });
  }

  /**
   * Record membership earnings for subscription tracking
   */
  static async recordMembershipEarnings(
    subscriptionId: string,
    operatorId: string,
    playerId: string,
    membershipTier: string,
    billingPeriodStart: Date,
    billingPeriodEnd: Date
  ): Promise<void> {
    const commission = this.calculateMembershipCommission(membershipTier);
    
    await storage.createMembershipEarnings({
      subscriptionId,
      operatorId,
      playerId,
      membershipTier,
      grossAmount: commission.grossAmount,
      platformAmount: commission.platformAmount,
      operatorAmount: commission.operatorAmount,
      billingPeriodStart,
      billingPeriodEnd,
    });
  }

  /**
   * Generate operator payout summary for a period
   */
  static async generateOperatorPayout(
    operatorId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<any> {
    // Get all earnings for the period
    const earnings = await storage.getPlatformEarningsByPeriod(operatorId, periodStart, periodEnd);
    const membershipEarnings = await storage.getMembershipEarningsByPeriod(operatorId, periodStart, periodEnd);
    
    // Calculate totals by type
    const matchCommissions = earnings
      .filter(e => e.sourceType === "match_commission")
      .reduce((sum, e) => sum + e.operatorAmount, 0);
    
    const escrowCommissions = earnings
      .filter(e => e.sourceType === "escrow_fee")
      .reduce((sum, e) => sum + e.operatorAmount, 0);
    
    const membershipCommissions = membershipEarnings
      .reduce((sum, e) => sum + e.operatorAmount, 0);
    
    const totalEarnings = matchCommissions + escrowCommissions + membershipCommissions;
    
    // Create payout record
    const payout = await storage.createOperatorPayout({
      operatorId,
      periodStart,
      periodEnd,
      totalEarnings,
      matchCommissions,
      membershipCommissions,
      escrowCommissions,
      otherEarnings: 0,
      payoutStatus: "pending",
      payoutMethod: "stripe_transfer",
    });
    
    return {
      payout,
      breakdown: {
        matchCommissions,
        membershipCommissions,
        escrowCommissions,
        totalEarnings,
      },
    };
  }

  /**
   * Get the best (lowest commission) membership tier between two players
   */
  private static getBestMembershipTier(tier1: string, tier2: string): string {
    const tierHierarchy = ["pro", "basic", "none"];
    
    const tier1Index = tierHierarchy.indexOf(tier1);
    const tier2Index = tierHierarchy.indexOf(tier2);
    
    // Return the tier with the lower index (better tier)
    return tier1Index <= tier2Index ? tier1 : tier2;
  }

  /**
   * Calculate monthly recurring revenue (MRR) for an operator
   */
  static async calculateOperatorMRR(operatorId: string): Promise<any> {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const earnings = await this.generateOperatorPayout(operatorId, startOfMonth, endOfMonth);
    
    return {
      month: startOfMonth.toISOString().slice(0, 7), // YYYY-MM format
      totalEarnings: earnings.breakdown.totalEarnings,
      matchCommissions: earnings.breakdown.matchCommissions,
      membershipCommissions: earnings.breakdown.membershipCommissions,
      escrowCommissions: earnings.breakdown.escrowCommissions,
      projectedMonthly: earnings.breakdown.totalEarnings, // This month's actual
    };
  }
}

export default CommissionCalculator;