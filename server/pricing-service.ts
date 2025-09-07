import { sanitizeForDisplay } from "./sanitize";

// Pricing tier configurations based on monetization plan
export const MEMBERSHIP_TIERS = {
  ROOKIE: {
    name: "Rookie",
    price: 2000, // $20 in cents
    commissionRate: 1000, // 10% in basis points
    perks: ["training_credits", "access_to_matches"],
    description: "Perfect for beginners learning the game",
  },
  BASIC: {
    name: "Basic", 
    price: 2500, // $25 in cents
    commissionRate: 800, // 8% in basis points
    perks: ["tournament_eligibility", "reduced_commission"],
    description: "Competitive play with tournament access",
  },
  PRO: {
    name: "Pro",
    price: 6000, // $60 in cents
    commissionRate: 500, // 5% in basis points
    perks: ["free_tournaments", "lowest_commission", "prestige_badge", "priority_support"],
    description: "Premium tier with maximum savings",
  },
} as const;

// Commission structure: "cheaper than leagues" with 5-10% + round-up
export const COMMISSION_CONFIG = {
  BASE_RATE: 1000, // 10% in basis points
  MEMBER_RATE: 500, // 5% for members in basis points
  ROOKIE_RATE: 1000, // 10% for rookie tier
  BASIC_RATE: 800, // 8% for basic tier
  PRO_RATE: 500, // 5% for pro tier
  ROUND_UP_ENABLED: true, // Round up to nearest $1 for extra profit
  SPLIT_PERCENTAGES: {
    ACTION_LADDER: 50, // 50% of commission goes to platform
    OPERATOR: 30, // 30% goes to operator
    BONUS_FUND: 20, // 20% goes to league bonus fund
  },
} as const;

/**
 * Calculate commission with round-up profit margin
 * Example: $100 challenge → $90 pot + $10 fee
 * Split: $5 Action Ladder + $3 operator + $2 bonus fund
 */
export function calculateCommission(amount: number, membershipTier: string = "none"): {
  originalAmount: number;
  commissionRate: number;
  calculatedCommission: number;
  roundedCommission: number;
  actionLadderShare: number;
  operatorShare: number;
  bonusFundShare: number;
  prizePool: number;
} {
  const commissionRate = getCommissionRate(membershipTier);
  const calculatedCommission = Math.ceil(amount * (commissionRate / 10000));
  
  // Round up to nearest $1 for extra profit
  const roundedCommission = COMMISSION_CONFIG.ROUND_UP_ENABLED 
    ? Math.ceil(calculatedCommission / 100) * 100
    : calculatedCommission;
  
  // Split commission according to percentages
  const actionLadderShare = Math.floor(roundedCommission * (COMMISSION_CONFIG.SPLIT_PERCENTAGES.ACTION_LADDER / 100));
  const operatorShare = Math.floor(roundedCommission * (COMMISSION_CONFIG.SPLIT_PERCENTAGES.OPERATOR / 100));
  const bonusFundShare = Math.floor(roundedCommission * (COMMISSION_CONFIG.SPLIT_PERCENTAGES.BONUS_FUND / 100));
  
  const prizePool = amount - roundedCommission;
  
  return {
    originalAmount: amount,
    commissionRate,
    calculatedCommission,
    roundedCommission,
    actionLadderShare,
    operatorShare,
    bonusFundShare,
    prizePool,
  };
}

/**
 * Get commission rate based on membership tier
 */
export function getCommissionRate(membershipTier: string): number {
  switch (membershipTier.toLowerCase()) {
    case "rookie":
      return COMMISSION_CONFIG.ROOKIE_RATE;
    case "basic":
      return COMMISSION_CONFIG.BASIC_RATE;
    case "pro":
      return COMMISSION_CONFIG.PRO_RATE;
    default:
      return COMMISSION_CONFIG.BASE_RATE; // Non-members pay full rate
  }
}

/**
 * Calculate membership savings vs APA/BCA costs
 */
export function calculateSavings(tier: string, monthlyMatches: number): {
  actionLadderCost: number;
  competitorCost: number;
  monthlySavings: number;
  annualSavings: number;
} {
  const tierConfig = MEMBERSHIP_TIERS[tier.toUpperCase() as keyof typeof MEMBERSHIP_TIERS];
  if (!tierConfig) {
    throw new Error("Invalid membership tier");
  }
  
  // Estimate competitor costs (APA/BCA typically $30-40/month + higher fees)
  const competitorMonthlyCost = 3500; // $35/month
  const competitorMatchFee = 1500; // $15/match
  
  const actionLadderMonthlyCost = tierConfig.price;
  const actionLadderMatchFee = 1000; // $10/match average with lower commission
  
  const actionLadderTotal = actionLadderMonthlyCost + (actionLadderMatchFee * monthlyMatches);
  const competitorTotal = competitorMonthlyCost + (competitorMatchFee * monthlyMatches);
  
  const monthlySavings = competitorTotal - actionLadderTotal;
  const annualSavings = monthlySavings * 12;
  
  return {
    actionLadderCost: actionLadderTotal,
    competitorCost: competitorTotal,
    monthlySavings,
    annualSavings,
  };
}