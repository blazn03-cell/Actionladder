/**
 * Safe Terminology Configuration for Legal Compliance
 * 
 * This file centralizes the replacement of gambling-related terms with 
 * skill-based competition language to position Action Ladder as a legitimate
 * APA/BCA style pool league rather than a gambling platform.
 */

export const SAFE_TERMS = {
  // Core betting/wagering terms
  bet: "Challenge Fee",
  betAmount: "Challenge Fee ($)",
  betting: "Entry Fees",
  wager: "Entry Fee",
  wagering: "Entry Processing",
  winnings: "Performance Credits",
  winner: "Champion",
  pot: "Prize Pool",
  jackpot: "Grand Prize",
  payout: "Prize Distribution",
  cashout: "Prize Claim",
  
  // Financial terms
  bankroll: "Credits Balance",
  moneyWon: "Points Gained",
  moneyLost: "Points Lost",
  profit: "Ladder Credits",
  earnings: "Competition Rewards",
  stake: "Entry Stake",
  stakes: "Entry Stakes",
  
  // Game/activity terms
  gamble: "Compete",
  gambling: "Competition",
  gambler: "Competitor",
  sideBet: "Challenge Pool", // Keep minimal mention, remove from main app
  sideBetting: "Challenge Pools",
  betHistory: "Match Fee History",
  
  // Action terms
  placeBet: "Enter Challenge",
  makeBet: "Submit Entry",
  acceptBet: "Accept Challenge",
  cancelBet: "Withdraw Entry",
  
  // Status terms
  winning: "Leading",
  losing: "Trailing",
  won: "Earned",
  lost: "Spent",
  
  // Platform positioning
  house: "League",
  houseEdge: "Service Fee",
  odds: "Performance Rating",
  bookmaker: "Tournament Operator",
  bookie: "League Operator"
} as const;

export type SafeTermKey = keyof typeof SAFE_TERMS;

/**
 * Replace gambling terminology with safe competition language
 */
export function getSafeTerm(key: SafeTermKey): string {
  return SAFE_TERMS[key];
}

/**
 * Replace multiple terms in a string using safe terminology
 */
export function replaceSafeTerms(text: string): string {
  let result = text;
  
  // Sort by length (longest first) to avoid partial replacements
  const sortedTerms = Object.entries(SAFE_TERMS).sort(([a], [b]) => b.length - a.length);
  
  for (const [risky, safe] of sortedTerms) {
    // Case-insensitive replacement with word boundaries
    const regex = new RegExp(`\\b${risky}\\b`, 'gi');
    result = result.replace(regex, safe);
  }
  
  return result;
}

/**
 * Format currency with safe terminology
 */
export function formatChallengeFee(amount: number): string {
  return `Challenge Fee: $${amount.toFixed(2)}`;
}

export function formatPerformanceCredits(amount: number): string {
  return `Performance Credits: ${amount.toFixed(0)}`;
}

export function formatPrizePool(amount: number): string {
  return `Prize Pool: $${amount.toFixed(2)}`;
}

/**
 * UI Component Labels (Safe Terminology)
 */
export const UI_LABELS = {
  // Button labels
  enterChallenge: "Enter Challenge",
  submitEntry: "Submit Entry", 
  acceptChallenge: "Accept Challenge",
  withdrawEntry: "Withdraw Entry",
  claimPrize: "Claim Prize",
  
  // Section headers
  challengeFees: "Challenge Fees",
  performanceCredits: "Performance Credits",
  prizeDistribution: "Prize Distribution",
  competitionHistory: "Competition History",
  creditsBalance: "Credits Balance",
  
  // Status messages
  challengeAccepted: "Challenge Accepted",
  entrySubmitted: "Entry Submitted",
  prizeAwarded: "Prize Awarded",
  creditsAdded: "Credits Added",
  
  // Navigation
  challengePools: "Challenge Pools",
  competitionCenter: "Competition Center",
  performanceTracker: "Performance Tracker"
} as const;

/**
 * Database Column Mapping (for schema updates)
 */
export const DB_COLUMN_MAPPING = {
  bet_amount: "challenge_fee",
  winnings: "performance_credits", 
  bankroll: "credits_balance",
  pot_size: "prize_pool",
  total_bet: "total_entry_fees",
  payout_amount: "prize_amount",
  side_bet_id: "challenge_pool_id",
  bet_history: "entry_history",
  winning_amount: "earned_credits",
  losing_amount: "spent_credits"
} as const;

/**
 * API Response Key Mapping
 */
export const API_KEY_MAPPING = {
  betAmount: "challengeFee",
  winnings: "performanceCredits",
  bankroll: "creditsBalance", 
  potSize: "prizePool",
  totalBet: "totalEntryFees",
  payoutAmount: "prizeAmount",
  sideBetId: "challengePoolId",
  betHistory: "entryHistory",
  winningAmount: "earnedCredits",
  losingAmount: "spentCredits"
} as const;