import { storage } from "./storage";

/**
 * Premium Subscription Savings Calculator
 * Calculates real monetary value premium users save through perks and reduced fees
 */
export class PremiumSavingsCalculator {
  
  /**
   * Calculate total monthly savings for premium users
   */
  static async calculateMonthlySavings(userId: string): Promise<{
    subscriptionCost: number;
    commissionSavings: number;
    tutoringValue: number;
    tournamentWinningsBonus: number;
    loyaltyDiscount: number;
    referralCredits: number;
    totalSavings: number;
    netCost: number;
  }> {
    const user = await storage.getUser(userId);
    const subscription = await storage.getMembershipSubscriptionByPlayerId(userId);
    
    if (!subscription || subscription.tier !== 'premium') {
      return {
        subscriptionCost: 4500,
        commissionSavings: 0,
        tutoringValue: 0,
        tournamentWinningsBonus: 0,
        loyaltyDiscount: 0,
        referralCredits: 0,
        totalSavings: 0,
        netCost: 4500
      };
    }

    // Base subscription cost
    const subscriptionCost = 4500; // $45/month

    // Commission savings: 5% vs 10% (Rookie) = 5% savings on side bets
    // Assuming average $200/month in side bets
    const commissionSavings = 200 * 0.05 * 100; // $10/month savings

    // Free monthly tutoring session value
    const tutoringValue = 3000; // $30/month value

    // Tournament winnings bonus: Keep 95% vs 90% = 5% more winnings
    // Assuming average $100/month in tournament winnings
    const tournamentWinningsBonus = 100 * 0.05 * 100; // $5/month

    // Loyalty discount (10% off after 6 months)
    let loyaltyDiscount = 0;
    if (user?.createdAt && 
        new Date().getTime() - new Date(user.createdAt).getTime() > (6 * 30 * 24 * 60 * 60 * 1000)) {
      loyaltyDiscount = subscriptionCost * 0.1; // $4.50/month
    }

    // Referral credits: $10 per successful referral (assuming 1 per month average)
    const referralCredits = 1000; // $10/month average

    const totalSavings = commissionSavings + tutoringValue + tournamentWinningsBonus + loyaltyDiscount + referralCredits;
    const netCost = subscriptionCost - totalSavings;

    return {
      subscriptionCost,
      commissionSavings,
      tutoringValue,
      tournamentWinningsBonus,
      loyaltyDiscount,
      referralCredits,
      totalSavings,
      netCost: Math.max(netCost, 0) // Can't be negative
    };
  }

  /**
   * Calculate commission savings specifically
   */
  static calculateCommissionSavings(betAmount: number, premiumTier: boolean = true): number {
    const rookieRate = 0.10; // 10%
    const premiumRate = 0.05; // 5%
    
    const rookieCommission = betAmount * rookieRate;
    const premiumCommission = betAmount * premiumRate;
    
    return rookieCommission - premiumCommission; // Savings amount
  }

  /**
   * Check if user qualifies for loyalty discount
   */
  static async qualifiesForLoyaltyDiscount(userId: string): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user?.createdAt) return false;
    
    const sixMonthsAgo = new Date().getTime() - (6 * 30 * 24 * 60 * 60 * 1000);
    return new Date(user.createdAt).getTime() < sixMonthsAgo;
  }
}