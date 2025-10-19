
// safeLanguage.ts
// One place to rule your wording. Import and use in React, Node, scripts, etc.

export type Replacement = { from: RegExp; to: string };

const WORD = String.raw`\b`;              // word boundary
const NOT_LETTER = String.raw`(?![A-Za-z])`; // avoid partial matches (e.g., "alphabet")

// Build a case-insensitive, whole-word regex with optional plural/verb variants.
function make(pattern: string, flags = "gi") {
  return new RegExp(pattern, flags);
}

// Preserve capitalization style of the source word when we replace.
function preserveCase(source: string, replacement: string) {
  if (source.toUpperCase() === source) return replacement.toUpperCase();           // BET -> CHALLENGE FEE
  if (source[0] === source[0]?.toUpperCase())                                     // Bet -> Challenge fee
    return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement;                                                              // bet -> challenge fee
}

// Master map of risky -> safe terms (Action Ladder approved terminology).
const rules: Array<{ pattern: RegExp; safe: string }> = [
  // Core gambling/betting terms
  { pattern: make(`${WORD}(bet|bets|betting|bettor)${NOT_LETTER}`), safe: "challenge fee" },
  { pattern: make(`${WORD}(wager|wagers|wagering)${NOT_LETTER}`), safe: "match fee" },
  { pattern: make(`${WORD}(gamble|gambles|gambling|gambler)${NOT_LETTER}`), safe: "ladder fee" },

  // Money pools (context-aware to avoid replacing "Kelly Pool" or "pool table")
  { pattern: make(`${WORD}(pot|pots)${NOT_LETTER}`), safe: "prize pool" },
  { pattern: make(`${WORD}(side[ -]?pot|side[ -]?pots)${NOT_LETTER}`), safe: "bonus pool" },
  { pattern: make(`${WORD}(prize[ -]?pool|money[ -]?pool|cash[ -]?pool)${NOT_LETTER}`), safe: "prize pool" }, // Only money-related pools

  // Entry/participation
  { pattern: make(`${WORD}(buy[ -]?in|buyins)${NOT_LETTER}`), safe: "entry fee" },
  { pattern: make(`${WORD}(stake|stakes|staked|staking)${NOT_LETTER}`), safe: "challenge credit" },
  { pattern: make(`${WORD}(ante)${NOT_LETTER}`), safe: "challenge credit" },

  // Payouts/rewards
  { pattern: make(`${WORD}(cash[ -]?out|cashouts)${NOT_LETTER}`), safe: "rewards" },
  { pattern: make(`${WORD}(payout|payouts|pay[ -]?out)${NOT_LETTER}`), safe: "performance bonus" },
  { pattern: make(`${WORD}(winnings)${NOT_LETTER}`), safe: "season rewards" },

  // Casino/lottery terms
  { pattern: make(`${WORD}(jackpot|jackpots)${NOT_LETTER}`), safe: "end-of-season prize" },
  { pattern: make(`${WORD}(lottery|lotteries)${NOT_LETTER}`), safe: "competition reward" },
  { pattern: make(`${WORD}(slots|slot[ -]?machine)${NOT_LETTER}`), safe: "competition reward" },
  { pattern: make(`${WORD}(casino|casinos)${NOT_LETTER}`), safe: "competition venue" },
  { pattern: make(`${WORD}(bookie|bookmaker|sportsbook)${NOT_LETTER}`), safe: "league coordinator" },

  // Money/risk words
  { pattern: make(`${WORD}(win cash|make money)${NOT_LETTER}`), safe: "earn rewards" },
  { pattern: make(`${WORD}(unlock prizes|profit from)${NOT_LETTER}`), safe: "unlock prizes" },
  { pattern: make(`${WORD}(bankroll)${NOT_LETTER}`), safe: "credits balance" },
  { pattern: make(`${WORD}(risk)${NOT_LETTER}`), safe: "challenge credit" },

  // Side betting/challenges
  { pattern: make(`${WORD}(side[ -]?bet|side[ -]?bets)${NOT_LETTER}`), safe: "friendly challenge" },
  { pattern: make(`${WORD}(side[ -]?action)${NOT_LETTER}`), safe: "extra matches" },

  // Context-sensitive replacements
  { pattern: make(`${WORD}(bet on yourself)${NOT_LETTER}`), safe: "back your skills" },
  { pattern: make(`${WORD}(hustle for cash)${NOT_LETTER}`), safe: "hustle for points" },
  { pattern: make(`${WORD}(action)${NOT_LETTER}(?!.*ladder)`), safe: "match play" }, // Preserve "Action Ladder"

  // General terms
  { pattern: make(`${WORD}(odds)${NOT_LETTER}`), safe: "skill rating" },
  { pattern: make(`${WORD}(house cut|rake)${NOT_LETTER}`), safe: "platform fee" },
  { pattern: make(`${WORD}(prize[ -]?money)${NOT_LETTER}`), safe: "prize pool" },
  { pattern: make(`${WORD}(game of chance)${NOT_LETTER}`), safe: "skills-based competition" },

  // Never-use terms (blocked entirely)
  { pattern: make(`${WORD}(weed|thc|coke|pills|dope|marijuana|cannabis)${NOT_LETTER}`), safe: "[CONTENT REMOVED]" },
  { pattern: make(`${WORD}(porn|escort|xxx|nude|camgirl|adult)${NOT_LETTER}`), safe: "[CONTENT REMOVED]" },
  { pattern: make(`${WORD}(guns|ammo|weapons|hitman|fraud|scam)${NOT_LETTER}`), safe: "[CONTENT REMOVED]" },
  { pattern: make(`${WORD}(launder|dark web|stolen|illegal)${NOT_LETTER}`), safe: "[CONTENT REMOVED]" },
];

export function sanitizeText(input: string): string {
  if (!input) return input;
  let out = input;

  // Replace while preserving case per match
  rules.forEach(({ pattern, safe }) => {
    out = out.replace(pattern, (match) => preserveCase(match, safe));
  });

  // Clean up extra spaces and content removal markers
  out = out.replace(/\[CONTENT REMOVED\]/g, "").replace(/\s{2,}/g, " ").trim();
  return out;
}

// Helper to sanitize specific fields on an object (e.g., Stripe product payloads)
export function sanitizeFields<T extends Record<string, any>>(obj: T, fields: string[]): T {
  const clone = { ...obj };
  for (const f of fields) {
    if (typeof clone[f] === "string") {
      (clone as any)[f] = sanitizeText(clone[f]);
    }
  }
  return clone;
}

// Safe term bank for quick reference
export const SAFE_TERMS_BANK = {
  // Green-light terms for heavy use
  challengeFee: "Challenge Fee",
  entryFee: "Entry Fee", 
  prizePool: "Prize Pool",
  performanceBonus: "Performance Bonus",
  rewards: "Rewards",
  credits: "Credits",
  ladderPoints: "Ladder Points",
  seasonRewards: "Season Rewards",
  competitionLeague: "Competition League",
  skillsBasedPlay: "Skills-Based Play",
  friendlyChallenges: "Friendly Challenges",
  
  // Action alternatives
  matchPlay: "Match Play",
  extraMatches: "Extra Matches",
  backYourSkills: "Back Your Skills",
  hustleForPoints: "Hustle for Points",
} as const;
