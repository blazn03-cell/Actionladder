
/**
 * Safe Terminology Configuration for Legal Compliance
 * 
 * This file centralizes the replacement of gambling-related terms with 
 * skill-based competition language to position Action Ladder as a legitimate
 * APA/BCA style pool league rather than a gambling platform.
 */

export const SAFE_TERMS = {
  // Core betting/wagering terms - GREEN LIGHT REPLACEMENTS
  bet: "Challenge Fee",
  betAmount: "Challenge Fee ($)",
  betting: "Match Fees",
  wager: "Match Fee", 
  wagering: "Entry Processing",
  gamble: "Ladder Fee",
  gambling: "Skills-Based Play",
  gambler: "Competitor",
  
  // Winnings/payouts - GREEN LIGHT REPLACEMENTS
  winnings: "Season Rewards",
  winner: "Champion",
  payout: "Performance Bonus",
  cashout: "Rewards",
  
  // Money pools - GREEN LIGHT REPLACEMENTS  
  pot: "Prize Pool",
  sidePot: "Bonus Pool",
  jackpot: "End-of-Season Prize",
  pool: "Season Pool", // Context: money pool, not pool table
  
  // Financial terms - GREEN LIGHT REPLACEMENTS
  bankroll: "Credits Balance",
  moneyWon: "Rewards Earned", 
  moneyLost: "Credits Spent",
  profit: "Ladder Credits",
  earnings: "Performance Bonus",
  stake: "Registration Fee",
  stakes: "Entry Fees",
  buyIn: "Entry Fee",
  ante: "Challenge Credit",
  
  // Casino/lottery terms - GREEN LIGHT REPLACEMENTS
  casino: "Competition Venue",
  lottery: "Ladder Bonus", 
  bookie: "League Coordinator",
  bookmaker: "Tournament Operator",
  sportsbook: "League Platform",
  
  // Action terms - GREEN LIGHT REPLACEMENTS
  placeBet: "Enter Challenge",
  makeBet: "Submit Entry",
  acceptBet: "Accept Challenge",
  cancelBet: "Withdraw Entry",
  sideBet: "Friendly Challenge",
  sideBetting: "Extra Matches",
  sideAction: "Extra Matches",
  
  // Status terms - GREEN LIGHT REPLACEMENTS
  winning: "Leading",
  losing: "Trailing", 
  won: "Earned",
  lost: "Spent",
  
  // Platform positioning - GREEN LIGHT REPLACEMENTS
  house: "League",
  houseEdge: "Platform Fee",
  odds: "Skill Rating",
  
  // Context-sensitive phrases
  betOnYourself: "Back Your Skills",
  hustleForCash: "Hustle for Points",
  winCash: "Earn Rewards",
  makeMoney: "Collect Bonuses",
  profitFromMatches: "Unlock Prizes",
  
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
 * Format currency with safe terminology - GREEN LIGHT TERMS
 */
export function formatChallengeFee(amount: number): string {
  return `Challenge Fee: $${amount.toFixed(2)}`;
}

export function formatPerformanceBonus(amount: number): string {
  return `Performance Bonus: $${amount.toFixed(2)}`;
}

export function formatPrizePool(amount: number): string {
  return `Prize Pool: $${amount.toFixed(2)}`;
}

export function formatCreditsBalance(amount: number): string {
  return `Credits Balance: ${amount.toFixed(0)}`;
}

/**
 * UI Component Labels (Safe Terminology) - ALL GREEN LIGHT
 */
export const UI_LABELS = {
  // Button labels - GREEN LIGHT
  enterChallenge: "Enter Challenge",
  submitEntry: "Submit Entry", 
  acceptChallenge: "Accept Challenge",
  withdrawEntry: "Withdraw Entry",
  claimRewards: "Claim Rewards",
  backYourSkills: "Back Your Skills",
  
  // Section headers - GREEN LIGHT
  challengeFees: "Challenge Fees",
  performanceBonus: "Performance Bonus", 
  prizePool: "Prize Pool",
  competitionHistory: "Competition History",
  creditsBalance: "Credits Balance",
  seasonRewards: "Season Rewards",
  skillsBasedPlay: "Skills-Based Play",
  
  // Status messages - GREEN LIGHT
  challengeAccepted: "Challenge Accepted",
  entrySubmitted: "Entry Submitted",
  rewardsEarned: "Rewards Earned",
  creditsAdded: "Credits Added",
  
  // Navigation - GREEN LIGHT
  friendlyChallenges: "Friendly Challenges",
  competitionCenter: "Competition Center", 
  performanceTracker: "Performance Tracker",
  extraMatches: "Extra Matches"
} as const;

/**
 * GREEN LIGHT Word Bank - Use these terms heavily
 */
export const GREEN_LIGHT_TERMS = [
  "Challenge Fee",
  "Entry Fee", 
  "Prize Pool",
  "Performance Bonus",
  "Rewards",
  "Credits", 
  "Ladder Points",
  "Season Rewards",
  "Competition League",
  "Skills-Based Play",
  "Friendly Challenges",
  "Match Play",
  "Extra Matches",
  "Back Your Skills",
  "Hustle for Points"
] as const;

/**
 * Database Column Mapping (for schema updates) - GREEN LIGHT TERMS
 */
export const DB_COLUMN_MAPPING = {
  bet_amount: "challenge_fee",
  winnings: "season_rewards", 
  bankroll: "credits_balance",
  pot_size: "prize_pool",
  total_bet: "total_entry_fees",
  payout_amount: "performance_bonus",
  side_bet_id: "friendly_challenge_id",
  bet_history: "entry_history",
  winning_amount: "rewards_earned",
  losing_amount: "credits_spent"
} as const;
