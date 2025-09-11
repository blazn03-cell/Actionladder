import { sanitizeForDisplay } from "./sanitize";

// Player-friendly pricing: $20-40 vs $43+ leagues (half the cost!)
export const MEMBERSHIP_TIERS = {
  ROOKIE: {
    name: "Rookie",
    price: 2000, // $20 in cents - entry tier, 3-4 matches included
    commissionRate: 1800, // 18% pot cut ($9 per $50 pot)
    perks: ["entry_tier", "3_4_matches_included", "local_ladder_access"],
    description: "Entry tier - Half the cost of APA! 3-4 matches included",
  },
  STANDARD: {
    name: "Standard",
    price: 3000, // $30 in cents - unlimited local ladder
    commissionRate: 2400, // 24% pot cut ($12 per $50 pot)
    perks: ["unlimited_local_ladder", "priority_matching", "weekly_bonus_eligible"],
    description: "Unlimited local ladder - Still $13 cheaper than APA ($43/month)",
  },
  PREMIUM: {
    name: "Premium",
    price: 4000, // $40 in cents - all ladders + stream perks
    commissionRate: 3400, // 34% pot cut ($17 per $50 pot)
    perks: ["unlimited_all_ladders", "hall_city_state_access", "stream_perks", "priority_support"],
    description: "All ladders + stream perks - Still $3-5 cheaper than APA!",
  },
} as const;

// Revenue splits based on pot cuts (not membership fees)
export const COMMISSION_CONFIG = {
  BASE_RATE: 3000, // 30% for non-members
  MEMBER_RATE: 1800, // 18% for rookie members
  ROOKIE_RATE: 1800, // 18% pot cut for rookie tier
  STANDARD_RATE: 2400, // 24% pot cut for standard tier  
  PREMIUM_RATE: 3400, // 34% pot cut for premium tier
  ROUND_UP_ENABLED: true, // Round up to nearest $1 for extra profit
  // Revenue splits from pot cuts
  SPLIT_PERCENTAGES: {
    ACTION_LADDER: 23, // 23% to trustees/admin
    OPERATOR: 33, // 33% to operators ($500/month target)
    SEASON_POT: 43, // 43% goes to season pot for players
    MONTHLY_OPERATIONS: 1, // 1% for monthly operations
  },
} as const;

// Monthly distribution targets (50 Standard players × 4 months example)
export const MONTHLY_TARGETS = {
  OPERATOR_MONTHLY_TARGET: 50000, // $500/month per operator target
  TRUSTEE_WEEKLY_TARGET: 17500, // $175/week each trustee
  SEASON_POT_PERCENTAGE: 43, // 43% of total pot cuts go to season pot
  PLAYER_MEMBERSHIP_COST: 3000, // $30 Standard membership average
  TOTAL_SEASON_EXAMPLE: 600000, // $6,000 total (50 players × $30 × 4 months)
  SEASON_POT_EXAMPLE: 260000, // $2,600 season pot
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

  // Real league costs: APA/BCA $43-45/month + $25 annual fee, Bar leagues $32-34/month
  const competitorMonthlyCost = 4300; // $43/month APA average (+ annual fees)
  const competitorMatchFee = 1000; // $10/match

  const actionLadderMonthlyCost = tierConfig.price;
  const actionLadderMatchFee = 600; // $6/match average with new commission structure

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