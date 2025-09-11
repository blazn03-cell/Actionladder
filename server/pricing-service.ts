import { sanitizeForDisplay } from "./sanitize";

// Player-friendly pricing: $35-60 vs $90-100+ leagues
export const MEMBERSHIP_TIERS = {
  ROOKIE: {
    name: "Rookie",
    price: 3500, // $35 in cents - entry level
    commissionRate: 1000, // 10% in basis points
    perks: ["training_credits", "access_to_matches", "bonus_fund_eligible"],
    description: "Entry level - $47+ cheaper than leagues ($82+ first month)",
  },
  STANDARD: {
    name: "Standard",
    price: 4500, // $45 in cents - sweet spot pricing
    commissionRate: 800, // 8% in basis points
    perks: ["tournament_eligibility", "reduced_commission", "weekly_bonus_matches", "monthly_prize_drawings"],
    description: "Most popular - Save $37+ vs leagues ($43/month ongoing)",
  },
  PREMIUM: {
    name: "Premium",
    price: 6000, // $60 in cents - clearly cheaper than leagues
    commissionRate: 500, // 5% in basis points
    perks: ["free_tournaments", "lowest_commission", "prestige_badge", "priority_support", "bonus_fund_multiplier"],
    description: "Premium tier - $22+ cheaper than leagues with premium features",
  },
} as const;

// Player-first commission structure: More money back to players
export const COMMISSION_CONFIG = {
  BASE_RATE: 1000, // 10% in basis points
  MEMBER_RATE: 500, // 5% for members in basis points
  ROOKIE_RATE: 1000, // 10% for rookie tier
  STANDARD_RATE: 800, // 8% for standard tier
  PREMIUM_RATE: 500, // 5% for premium tier
  ROUND_UP_ENABLED: true, // Round up to nearest $1 for extra profit
  // NEW PLAYER-FRIENDLY SPLITS
  SPLIT_PERCENTAGES: {
    ACTION_LADDER: 35, // 35% to platform (reduced from 50%)
    OPERATOR: 30, // 30% to operator (fixed $700-800/month)
    BONUS_FUND: 35, // 35% to player bonus fund (increased from 20%)
  },
} as const;

// Monthly distribution targets (3 halls, 6 operators, 60 players)
export const MONTHLY_TARGETS = {
  OPERATOR_FIXED_PAYOUT: 75000, // $750 target per operator
  PLATFORM_OWNER_SHARE: 90000, // $900 platform owner
  TRUSTEE_A_SHARE: 80000, // $800 trustee A
  TRUSTEE_B_SHARE: 80000, // $800 trustee B
  PLAYER_BONUS_FUND: 100000, // $1,000+ monthly bonus fund
  AVERAGE_PLAYER_COST: 7000, // $70 average monthly cost
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
    case "standard":
      return COMMISSION_CONFIG.STANDARD_RATE;
    case "premium":
      return COMMISSION_CONFIG.PREMIUM_RATE;
    default:
      return COMMISSION_CONFIG.BASE_RATE; // Non-members pay full rate
  }
}

/**
 * Calculate membership savings vs APA/BCA leagues - NEW COMPETITIVE PRICING
 */
export function calculateSavings(tier: string, monthlyMatches: number): {
  actionLadderCost: number;
  competitorCost: number;
  monthlySavings: number;
  annualSavings: number;
  bonusFundValue: number;
} {
  const tierConfig = MEMBERSHIP_TIERS[tier.toUpperCase() as keyof typeof MEMBERSHIP_TIERS];
  if (!tierConfig) {
    throw new Error("Invalid membership tier");
  }

  // Real league costs: APA/BCA typically $90-100+/month + higher fees
  const competitorMonthlyCost = 9500; // $95/month league average
  const competitorMatchFee = 1500; // $15/match

  const actionLadderMonthlyCost = tierConfig.price;
  const actionLadderMatchFee = 800; // $8/match average with player-friendly commission

  const actionLadderTotal = actionLadderMonthlyCost + (actionLadderMatchFee * monthlyMatches);
  const competitorTotal = competitorMonthlyCost + (competitorMatchFee * monthlyMatches);

  const monthlySavings = competitorTotal - actionLadderTotal;
  const annualSavings = monthlySavings * 12;

  // Add bonus fund value players get back
  const bonusFundValue = Math.floor(MONTHLY_TARGETS.PLAYER_BONUS_FUND / 60); // $1000 / 60 players

  return {
    actionLadderCost: actionLadderTotal,
    competitorCost: competitorTotal,
    monthlySavings,
    annualSavings,
    bonusFundValue,
  };
}

/**
 * Calculate player-first bonus fund activities
 */
export function calculateBonusFundActivities(monthlyBonusFund: number): {
  weeklyBonusMatches: number;
  monthlyPrizePool: number;
  eventNights: number;
  specialTournaments: number;
} {
  return {
    weeklyBonusMatches: Math.floor(monthlyBonusFund * 0.3), // 30% for weekly bonuses
    monthlyPrizePool: Math.floor(monthlyBonusFund * 0.4), // 40% for monthly prizes
    eventNights: Math.floor(monthlyBonusFund * 0.2), // 20% for event nights
    specialTournaments: Math.floor(monthlyBonusFund * 0.1), // 10% for special tournaments
  };
}