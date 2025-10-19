// Text sanitization to replace gambling terms with league-safe language
const WORD_MAP: Record<string, string> = {
  'bet': 'challenge',
  'bets': 'challenges', 
  'betted': 'challenged',
  'betting': 'challenging',
  'gamble': 'play',
  'gambling': 'competitive play',
  'odds': 'skill rating',
  'wager': 'challenge',
  'wagers': 'challenges',
  'wagered': 'challenged',
  'wagering': 'challenging',
  'escrow': 'hold',
  'pot': 'pool',
  'pots': 'pools',
  'jackpot': 'prize pool',
  'stake': 'entry fee',
  'stakes': 'entry fees',
  'ante': 'entry fee',
  'bankroll': 'balance',
  'house edge': 'platform fee',
  'bookmaker': 'operator',
  'bookie': 'operator',
  'punter': 'player',
  'punters': 'players',
  'lucky': 'skilled',
  'unlucky': 'less skilled',
  'gambler': 'competitor',
  'gamblers': 'competitors',
  'casino': 'venue',
  'sportsbook': 'league platform',
};

export function sanitizeCopy(input: string): string {
  const pattern = new RegExp(`\\b(${Object.keys(WORD_MAP).join('|')})\\b`, 'gi');
  return input.replace(pattern, (match) => {
    const lowerMatch = match.toLowerCase();
    const replacement = WORD_MAP[lowerMatch];
    
    if (!replacement) return match;
    
    // Preserve original casing
    if (match === match.toUpperCase()) {
      return replacement.toUpperCase();
    } else if (match[0] === match[0].toUpperCase()) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase();
    } else {
      return replacement.toLowerCase();
    }
  });
}

export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeCopy(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Express middleware for sanitizing request bodies
export function sanitizeBody(fieldsToSanitize: string[] = []) {
  return (req: any, res: any, next: any) => {
    if (req.body && typeof req.body === 'object') {
      for (const field of fieldsToSanitize) {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = sanitizeCopy(req.body[field]);
        }
      }
    }
    next();
  };
}

// Wrapper for Stripe payment descriptions to ensure compliance
export function createStripeDescription(description: string): string {
  const sanitized = sanitizeCopy(description);
  
  // Additional Stripe-specific sanitization for payment processing compliance
  const stripeCompliant = sanitized
    .replace(/\b(side\s+)?pool\b/gi, 'tournament entry')
    .replace(/\bchallenge\s+fee\b/gi, 'tournament fee')
    .replace(/\bentry\s+fee\b/gi, 'tournament entry')
    .replace(/\bcompetitive\s+play\b/gi, 'tournament participation');
    
  return stripeCompliant;
}

// Sanitize common text fields for database storage
export function sanitizeForStorage(data: {
  title?: string;
  description?: string;
  name?: string;
  content?: string;
  [key: string]: any;
}): any {
  const sanitized = { ...data };
  
  const textFields = ['title', 'description', 'name', 'content'];
  textFields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeCopy(sanitized[field]);
    }
  });
  
  return sanitized;
}