// Operator Subscription Split Calculator
// Splits: 20% Pot, 53% Trustee, 23% Founder, 4% System Operations (0% Operator)

export interface OperatorSubscriptionSplitBreakdown {
  potAmount: number;        // 20% in cents
  trusteeAmount: number;    // 53% in cents
  founderAmount: number;    // 23% in cents
  payrollAmount: number;    // 4% in cents (System Operations - infrastructure costs)
  totalAmount: number;      // Total in cents
  operatorAmount: number;   // Always 0 - operator keeps nothing
}

/**
 * Calculate operator subscription split with exact percentages
 * 
 * Split Breakdown:
 * - 20% → Pot and Special Games (tournaments, prizes, incentives)
 * - 53% → Trustee (who signed up the Operator)
 * - 23% → Founder
 * - 4% → System Operations (infrastructure costs)
 * - 0% → Operator (they keep nothing - subscription is purely an access fee)
 * 
 * @param totalAmountCents - Total subscription amount in cents
 * @returns Split breakdown with all amounts in cents (integers)
 * 
 * @example
 * // For $199/month subscription (19900 cents)
 * const split = calculateOperatorSubscriptionSplit(19900);
 * // Returns:
 * // {
 * //   potAmount: 3980,      // $39.80 (20%)
 * //   trusteeAmount: 10547, // $105.47 (53%)
 * //   founderAmount: 4577,  // $45.77 (23%)
 * //   payrollAmount: 796,   // $7.96 (4% - System Operations)
 * //   totalAmount: 19900,   // $199.00
 * //   operatorAmount: 0     // $0.00 (0%)
 * // }
 */
export function calculateOperatorSubscriptionSplit(totalAmountCents: number): OperatorSubscriptionSplitBreakdown {
  // Validate input
  if (!Number.isInteger(totalAmountCents) || totalAmountCents < 0) {
    throw new Error('Total amount must be a non-negative integer (cents)');
  }

  // Calculate each split using floor to ensure integer cents
  // We'll handle remainder distribution to ensure exact 100% allocation
  const potAmount = Math.floor(totalAmountCents * 0.20);        // 20%
  const trusteeAmount = Math.floor(totalAmountCents * 0.53);    // 53%
  const founderAmount = Math.floor(totalAmountCents * 0.23);    // 23%
  const payrollAmount = Math.floor(totalAmountCents * 0.04);    // 4% System Operations
  
  // Calculate sum of splits
  let splitSum = potAmount + trusteeAmount + founderAmount + payrollAmount;
  
  // Handle remainder cents to ensure splits sum to exactly totalAmountCents
  // Distribute remainder to largest share (trustee) to maintain proportions
  const remainder = totalAmountCents - splitSum;
  
  const finalSplit: OperatorSubscriptionSplitBreakdown = {
    potAmount,
    trusteeAmount: trusteeAmount + remainder, // Add remainder to trustee (largest share)
    founderAmount,
    payrollAmount,
    totalAmount: totalAmountCents,
    operatorAmount: 0 // Operator keeps nothing
  };

  // Validate that splits sum to total (should always be true with remainder logic)
  const validationSum = finalSplit.potAmount + finalSplit.trusteeAmount + 
                       finalSplit.founderAmount + finalSplit.payrollAmount;
  
  if (validationSum !== totalAmountCents) {
    throw new Error(`Split calculation error: sum ${validationSum} !== total ${totalAmountCents}`);
  }

  return finalSplit;
}

/**
 * Calculate splits for multiple subscription amounts (bulk processing)
 * Useful for batch processing or reporting
 */
export function calculateBulkSubscriptionSplits(amounts: number[]): OperatorSubscriptionSplitBreakdown[] {
  return amounts.map(amount => calculateOperatorSubscriptionSplit(amount));
}

/**
 * Get split percentages as basis points for reference
 * Basis points: 1% = 100 bps
 */
export const SUBSCRIPTION_SPLIT_BPS = {
  POT: 2000,        // 20% = 2000 bps
  TRUSTEE: 5300,    // 53% = 5300 bps
  FOUNDER: 2300,    // 23% = 2300 bps
  PAYROLL: 400,     // 4% = 400 bps (System Operations - infrastructure costs)
  OPERATOR: 0,      // 0% = 0 bps
  TOTAL: 10000      // 100% = 10000 bps
} as const;

/**
 * Format cents amount to USD string for display
 */
export function formatCentsToUSD(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Get human-readable split breakdown with formatted amounts
 */
export function getFormattedSplitBreakdown(totalAmountCents: number): {
  pot: string;
  trustee: string;
  founder: string;
  systemOperations: string;
  operator: string;
  total: string;
} {
  const split = calculateOperatorSubscriptionSplit(totalAmountCents);
  
  return {
    pot: formatCentsToUSD(split.potAmount),
    trustee: formatCentsToUSD(split.trusteeAmount),
    founder: formatCentsToUSD(split.founderAmount),
    systemOperations: formatCentsToUSD(split.payrollAmount),
    operator: formatCentsToUSD(split.operatorAmount),
    total: formatCentsToUSD(split.totalAmount)
  };
}

/**
 * Validate that a split breakdown is correct
 */
export function validateSplit(split: OperatorSubscriptionSplitBreakdown): boolean {
  const sum = split.potAmount + split.trusteeAmount + split.founderAmount + split.payrollAmount;
  return sum === split.totalAmount && split.operatorAmount === 0;
}

/**
 * Example usage and validation
 */
export function exampleSplits() {
  const examples = [
    { tier: 'Small Hall', amount: 19900 },    // $199
    { tier: 'Medium Hall', amount: 29900 },   // $299
    { tier: 'Large Hall', amount: 39900 },    // $399
    { tier: 'Mega Hall', amount: 49900 }      // $499
  ];

  return examples.map(({ tier, amount }) => ({
    tier,
    amountUSD: formatCentsToUSD(amount),
    breakdown: getFormattedSplitBreakdown(amount),
    cents: calculateOperatorSubscriptionSplit(amount)
  }));
}
