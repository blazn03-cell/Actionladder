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
  if (source.toUpperCase() === source) return replacement.toUpperCase();           // BET -> ENTRY FEE
  if (source[0] === source[0]?.toUpperCase())                                     // Bet -> Entry fee
    return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement;                                                              // bet -> entry fee
}

// Master map of risky -> safe terms (tuned for Action Ladder).
// Keep to short, league-style terms.
const rules: Array<{ pattern: RegExp; safe: string }> = [
  // bet, bets, betting, bettor
  { pattern: make(`${WORD}(bet|bets|betting|bettor)${NOT_LETTER}`), safe: "entry fee" },
  // wager, wagering
  { pattern: make(`${WORD}(wager|wagers|wagering)${NOT_LETTER}`), safe: "entry fee" },
  // stake, staked, staking
  { pattern: make(`${WORD}(stake|stakes|staked|staking)${NOT_LETTER}`), safe: "entry fee" },
  // side bet / side-bet / sidebet
  { pattern: make(`${WORD}(side[ -]?bet|side[ -]?bets)${NOT_LETTER}`), safe: "challenge fee" },
  // pot (as money pot)
  { pattern: make(`${WORD}(pot|pots)${NOT_LETTER}`), safe: "prize fund" },
  // side pot / side-pot
  { pattern: make(`${WORD}(side[ -]?pot|side[ -]?pots)${NOT_LETTER}`), safe: "challenge pool" },
  // payout / cash out
  { pattern: make(`${WORD}(payout|payouts|pay[ -]?out)${NOT_LETTER}`), safe: "awards" },
  // cash-out / cashout
  { pattern: make(`${WORD}(cash[ -]?out|cashouts)${NOT_LETTER}`), safe: "award redemption" },
  // bookie / bookmaker (just in case)
  { pattern: make(`${WORD}(bookie|bookmaker|sportsbook)${NOT_LETTER}`), safe: "league office" },
  // odds
  { pattern: make(`${WORD}(odds)${NOT_LETTER}`), safe: "seeding" },
  // action (contextual; keep it neutral)
  { pattern: make(`${WORD}(action)${NOT_LETTER}`), safe: "match play" },
  // buy-in
  { pattern: make(`${WORD}(buy[ -]?in|buyins)${NOT_LETTER}`), safe: "entry fee" },
  // bankroll
  { pattern: make(`${WORD}(bankroll)${NOT_LETTER}`), safe: "season budget" },
  // house cut / rake
  { pattern: make(`${WORD}(rake|house[ -]?cut)${NOT_LETTER}`), safe: "league operations fee" },
  // prize money -> prize fund (money word)
  { pattern: make(`${WORD}(prize[ -]?money)${NOT_LETTER}`), safe: "prize fund" },
  // winnings -> awards
  { pattern: make(`${WORD}(winnings)${NOT_LETTER}`), safe: "awards" },
  // jackpot
  { pattern: make(`${WORD}(jackpot|jackpots)${NOT_LETTER}`), safe: "grand award" },
  // gambling specific
  { pattern: make(`${WORD}(gambl|gambling|gambler|gambles)${NOT_LETTER}`), safe: "league play" },
  // casino
  { pattern: make(`${WORD}(casino|casinos)${NOT_LETTER}`), safe: "pool hall" },
  // games of chance
  { pattern: make(`${WORD}(game of chance)${NOT_LETTER}`), safe: "skill competition" },
];

export function sanitizeText(input: string): string {
  if (!input) return input;
  let out = input;

  // Replace while preserving case per match
  rules.forEach(({ pattern, safe }) => {
    out = out.replace(pattern, (match) => preserveCase(match, safe));
  });

  // Optional: tighten spaces that can appear after replacements (e.g., "Entry fee s")
  out = out.replace(/\s{2,}/g, " ").trim();
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