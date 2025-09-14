import { storage } from "./storage";

/**
 * Premium Subscription Savings Calculator
 * Calculates real monetary value premium users save through perks and reduced fees using actual user activity data
 */
export class PremiumSavingsCalculator {
  
  /**
   * Calculate total monthly savings for premium users using real activity data
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
    activityMetrics: {
      monthlySideBetAmount: number;
      monthlyTutoringSessions: number;
      monthlyTournamentWinnings: number;
      totalReferrals: number;
    };
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
        netCost: 4500,
        activityMetrics: {
          monthlySideBetAmount: 0,
          monthlyTutoringSessions: 0,
          monthlyTournamentWinnings: 0,
          totalReferrals: 0
        }
      };
    }

    // Base subscription cost
    const subscriptionCost = 4500; // $45/month

    // Get real user activity data for the last 30 days
    const activityMetrics = await this.calculateRealActivityMetrics(userId);

    // Commission savings: 5% vs 10% (Rookie) = 5% savings on side bets
    // Using actual betting activity instead of estimates
    const commissionSavings = Math.round(activityMetrics.monthlySideBetAmount * 0.05); // Real 5% savings

    // Free monthly tutoring session value based on actual usage
    // Premium users get 1 free session ($30 value) + discounted additional sessions
    const tutoringValue = Math.min(activityMetrics.monthlyTutoringSessions, 1) * 3000; // Up to $30/month for first session

    // Tournament winnings bonus: Keep 95% vs 90% = 5% more winnings
    // Using actual tournament winnings instead of estimates
    const tournamentWinningsBonus = Math.round(activityMetrics.monthlyTournamentWinnings * 0.05); // Real 5% bonus

    // Loyalty discount (10% off after 6 months)
    let loyaltyDiscount = 0;
    if (user?.createdAt && 
        new Date().getTime() - new Date(user.createdAt).getTime() > (6 * 30 * 24 * 60 * 60 * 1000)) {
      loyaltyDiscount = Math.round(subscriptionCost * 0.1); // $4.50/month
    }

    // Referral credits: $10 per successful referral using actual referral count
    const referralCredits = Math.min(activityMetrics.totalReferrals, 3) * 1000; // Max $30/month for up to 3 referrals

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
      netCost: Math.max(netCost, 0), // Can't be negative
      activityMetrics
    };
  }

  /**
   * Calculate real user activity metrics for the last 30 days
   */
  private static async calculateRealActivityMetrics(userId: string): Promise<{
    monthlySideBetAmount: number;
    monthlyTutoringSessions: number;
    monthlyTournamentWinnings: number;
    totalReferrals: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get real side betting activity
    const sideBets = await storage.getSideBetsByUser(userId);
    const recentSideBets = sideBets.filter(bet => 
      bet.createdAt && new Date(bet.createdAt) >= thirtyDaysAgo
    );
    const monthlySideBetAmount = recentSideBets.reduce((total, bet) => total + (bet.amount || 0), 0);

    // Get real tutoring session usage
    const tutoringSessions = await storage.getTutoringSessionsByRookie(userId);
    const recentTutoringSessions = tutoringSessions.filter(session => 
      session.createdAt && new Date(session.createdAt) >= thirtyDaysAgo
    );
    const monthlyTutoringSessions = recentTutoringSessions.length;

    // Get real tournament winnings (we'll need to calculate from match wins)
    const matches = await storage.getAllMatches();
    const userWinningMatches = matches.filter(match => 
      match.winner === userId &&
      match.createdAt && new Date(match.createdAt) >= thirtyDaysAgo
    );
    const monthlyTournamentWinnings = userWinningMatches.reduce((total, match) => 
      total + (match.prizePoolAmount || match.stake || 0), 0
    );

    // Calculate total referrals (users who joined through this user's referral)
    const allUsers = await storage.getAllUsers();
    const totalReferrals = allUsers.filter(user => 
      user.email?.includes(`ref=${userId}`) || // Simple referral tracking
      user.name?.includes(`Referred by ${userId}`) // Alternative tracking method
    ).length;

    return {
      monthlySideBetAmount,
      monthlyTutoringSessions,
      monthlyTournamentWinnings,
      totalReferrals
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

  /**
   * Get detailed savings breakdown with real vs estimated comparison
   */
  static async getSavingsBreakdown(userId: string): Promise<{
    realSavings: any;
    estimatedSavings: any;
    accuracy: {
      commissionSavingsAccuracy: number;
      tutoringValueAccuracy: number;
      tournamentBonusAccuracy: number;
    };
  }> {
    const realSavings = await this.calculateMonthlySavings(userId);
    
    // Calculate estimated savings using old method for comparison
    const estimatedSavings = {
      commissionSavings: 1000, // $10 estimated
      tutoringValue: 3000, // $30 estimated
      tournamentWinningsBonus: 500, // $5 estimated
      totalSavings: 4500 // Total estimated
    };

    // Calculate accuracy metrics
    const accuracy = {
      commissionSavingsAccuracy: this.calculateAccuracy(realSavings.commissionSavings, estimatedSavings.commissionSavings),
      tutoringValueAccuracy: this.calculateAccuracy(realSavings.tutoringValue, estimatedSavings.tutoringValue),
      tournamentBonusAccuracy: this.calculateAccuracy(realSavings.tournamentWinningsBonus, estimatedSavings.tournamentWinningsBonus)
    };

    return {
      realSavings,
      estimatedSavings,
      accuracy
    };
  }

  /**
   * Calculate accuracy percentage between real and estimated values
   */
  private static calculateAccuracy(real: number, estimated: number): number {
    if (estimated === 0) return real === 0 ? 100 : 0;
    const difference = Math.abs(real - estimated);
    const accuracy = Math.max(0, 100 - (difference / estimated) * 100);
    return Math.round(accuracy * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get user activity trends over time
   */
  static async getActivityTrends(userId: string, months: number = 6): Promise<{
    monthlyTrends: Array<{
      month: string;
      sideBetAmount: number;
      tutoringSessions: number;
      tournamentWinnings: number;
      totalSavings: number;
    }>;
    averageMonthlySavings: number;
    growthTrend: 'increasing' | 'decreasing' | 'stable';
  }> {
    const monthlyTrends = [];
    let totalSavingsSum = 0;

    for (let i = 0; i < months; i++) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthData = await this.calculateMonthlyActivity(userId, monthStart, monthEnd);
      monthlyTrends.unshift(monthData); // Add to beginning for chronological order
      totalSavingsSum += monthData.totalSavings;
    }

    const averageMonthlySavings = Math.round(totalSavingsSum / months);

    // Determine growth trend by comparing first and last month
    let growthTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (monthlyTrends.length >= 2) {
      const firstMonth = monthlyTrends[0].totalSavings;
      const lastMonth = monthlyTrends[monthlyTrends.length - 1].totalSavings;
      const growthRate = (lastMonth - firstMonth) / Math.max(firstMonth, 1);
      
      if (growthRate > 0.1) growthTrend = 'increasing';
      else if (growthRate < -0.1) growthTrend = 'decreasing';
    }

    return {
      monthlyTrends,
      averageMonthlySavings,
      growthTrend
    };
  }

  /**
   * Calculate activity for a specific month period
   */
  private static async calculateMonthlyActivity(userId: string, startDate: Date, endDate: Date): Promise<{
    month: string;
    sideBetAmount: number;
    tutoringSessions: number;
    tournamentWinnings: number;
    totalSavings: number;
  }> {
    // Get side betting activity for the month
    const sideBets = await storage.getSideBetsByUser(userId);
    const monthSideBets = sideBets.filter(bet => 
      bet.createdAt && 
      new Date(bet.createdAt) >= startDate && 
      new Date(bet.createdAt) <= endDate
    );
    const sideBetAmount = monthSideBets.reduce((total, bet) => total + (bet.amount || 0), 0);

    // Get tutoring sessions for the month
    const tutoringSessions = await storage.getTutoringSessionsByRookie(userId);
    const monthSessions = tutoringSessions.filter(session => 
      session.createdAt && 
      new Date(session.createdAt) >= startDate && 
      new Date(session.createdAt) <= endDate
    );

    // Get tournament winnings for the month
    const matches = await storage.getAllMatches();
    const monthWinningMatches = matches.filter(match => 
      match.winner === userId &&
      match.createdAt && 
      new Date(match.createdAt) >= startDate && 
      new Date(match.createdAt) <= endDate
    );
    const tournamentWinnings = monthWinningMatches.reduce((total, match) => 
      total + (match.prizePoolAmount || match.stake || 0), 0
    );

    // Calculate savings for this month
    const commissionSavings = Math.round(sideBetAmount * 0.05);
    const tutoringValue = Math.min(monthSessions.length, 1) * 3000;
    const tournamentBonus = Math.round(tournamentWinnings * 0.05);
    const totalSavings = commissionSavings + tutoringValue + tournamentBonus;

    return {
      month: startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      sideBetAmount,
      tutoringSessions: monthSessions.length,
      tournamentWinnings,
      totalSavings
    };
  }
}