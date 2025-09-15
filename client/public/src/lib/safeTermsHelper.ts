import { SAFE_TERMS, UI_LABELS, replaceSafeTerms, getSafeTerm, type SafeTermKey } from "@shared/safeTerms";

/**
 * React hook for getting safe terminology in components
 */
export function useSafeTerms() {
  return {
    term: getSafeTerm,
    replace: replaceSafeTerms,
    labels: UI_LABELS,
    
    // Commonly used formatted terms
    challengeFee: (amount: number) => `Challenge Fee: $${amount.toFixed(2)}`,
    performanceCredits: (amount: number) => `Performance Credits: ${amount.toFixed(0)}`,
    prizePool: (amount: number) => `Prize Pool: $${amount.toFixed(2)}`,
    creditsBalance: (amount: number) => `Credits Balance: $${amount.toFixed(2)}`,
    
    // Status formatters  
    formatWinStatus: (amount: number) => `Earned ${amount} Performance Credits`,
    formatLossStatus: (amount: number) => `Spent ${amount} Entry Credits`,
    formatChallenge: (amount: number) => `Challenge Fee: $${amount}`,
  };
}

/**
 * Safe term replacement for dynamic content
 */
export function applySafeTerms<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj } as any;
  
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      result[key] = replaceSafeTerms(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === 'string' ? replaceSafeTerms(item) : 
        typeof item === 'object' ? applySafeTerms(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = applySafeTerms(value);
    }
  }
  
  return result;
}