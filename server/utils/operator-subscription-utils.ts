// Operator subscription utility functions and pricing calculator

export interface SubscriptionTier {
  name: string;
  maxPlayers: number;
  basePriceMonthly: number; // in cents
  description: string;
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  small: {
    name: "Small Hall",
    maxPlayers: 15,
    basePriceMonthly: 19900, // $199/month
    description: "Perfect for neighborhood halls (≤15 players)"
  },
  medium: {
    name: "Medium Hall", 
    maxPlayers: 25,
    basePriceMonthly: 29900, // $299/month
    description: "Growing halls with regular crowds (16-25 players)"
  },
  large: {
    name: "Large Hall",
    maxPlayers: 40,
    basePriceMonthly: 39900, // $399/month
    description: "Established venues with big player base (26-40 players)"
  },
  mega: {
    name: "Mega Hall",
    maxPlayers: 999,
    basePriceMonthly: 49900, // $499/month
    description: "Major venues and tournament centers (41+ players)"
  }
};

export const ADDON_PRICING = {
  extraLadder: 10000, // $100/month per extra ladder/division
  rookieModule: 5000, // $50/month for rookie system
  rookiePass: 1500, // $15/month per rookie pass
  extraPlayer: 800, // $8/month per player beyond tier limit
  extraPlayerBundle: 5000, // $50 for 10 extra players (bulk discount)
};

export class OperatorSubscriptionCalculator {
  
  // Determine appropriate tier based on player count
  static getTierForPlayerCount(playerCount: number): string {
    if (playerCount <= 15) return "small";
    if (playerCount <= 25) return "medium";
    if (playerCount <= 40) return "large";
    return "mega";
  }
  
  // Calculate base subscription cost
  static calculateBaseCost(playerCount: number): { tier: string; baseCost: number } {
    const tier = this.getTierForPlayerCount(playerCount);
    const baseCost = SUBSCRIPTION_TIERS[tier].basePriceMonthly;
    return { tier, baseCost };
  }
  
  // Calculate extra player charges beyond tier limit
  static calculateExtraPlayerCharges(playerCount: number, tier: string): number {
    const tierLimit = SUBSCRIPTION_TIERS[tier].maxPlayers;
    const extraPlayers = Math.max(0, playerCount - tierLimit);
    
    if (extraPlayers === 0) return 0;
    
    // Bulk pricing: $50 for 10 players or $8 per individual player
    const bulkSets = Math.floor(extraPlayers / 10);
    const individualPlayers = extraPlayers % 10;
    
    return (bulkSets * ADDON_PRICING.extraPlayerBundle) + 
           (individualPlayers * ADDON_PRICING.extraPlayer);
  }
  
  // Calculate total monthly subscription cost
  static calculateTotalCost(params: {
    playerCount: number;
    extraLadders?: number;
    rookieModuleActive?: boolean;
    rookiePassesActive?: number;
  }): {
    tier: string;
    baseCost: number;
    extraPlayerCost: number;
    extraLadderCost: number;
    rookieModuleCost: number;
    rookiePassCost: number;
    totalCost: number;
    breakdown: string[];
  } {
    const { playerCount, extraLadders = 0, rookieModuleActive = false, rookiePassesActive = 0 } = params;
    
    const { tier, baseCost } = this.calculateBaseCost(playerCount);
    const extraPlayerCost = this.calculateExtraPlayerCharges(playerCount, tier);
    const extraLadderCost = extraLadders * ADDON_PRICING.extraLadder;
    const rookieModuleCost = rookieModuleActive ? ADDON_PRICING.rookieModule : 0;
    const rookiePassCost = rookiePassesActive * ADDON_PRICING.rookiePass;
    
    const totalCost = baseCost + extraPlayerCost + extraLadderCost + rookieModuleCost + rookiePassCost;
    
    const breakdown = [
      `${SUBSCRIPTION_TIERS[tier].name}: $${(baseCost / 100).toFixed(0)}/mo`,
    ];
    
    if (extraPlayerCost > 0) {
      const extraPlayers = Math.max(0, playerCount - SUBSCRIPTION_TIERS[tier].maxPlayers);
      breakdown.push(`Extra players (${extraPlayers}): $${(extraPlayerCost / 100).toFixed(0)}/mo`);
    }
    
    if (extraLadders > 0) {
      breakdown.push(`Extra ladders (${extraLadders}): $${(extraLadderCost / 100).toFixed(0)}/mo`);
    }
    
    if (rookieModuleActive) {
      breakdown.push(`Rookie module: $${(rookieModuleCost / 100).toFixed(0)}/mo`);
    }
    
    if (rookiePassesActive > 0) {
      breakdown.push(`Rookie passes (${rookiePassesActive}): $${(rookiePassCost / 100).toFixed(0)}/mo`);
    }
    
    return {
      tier,
      baseCost,
      extraPlayerCost,
      extraLadderCost,
      rookieModuleCost,
      rookiePassCost,
      totalCost,
      breakdown
    };
  }
  
  // Get subscription tier information
  static getTierInfo(tier: string): SubscriptionTier | undefined {
    return SUBSCRIPTION_TIERS[tier];
  }
  
  // Get all available tiers
  static getAllTiers(): SubscriptionTier[] {
    return Object.values(SUBSCRIPTION_TIERS);
  }
  
  // Calculate savings with bulk player pricing
  static calculatePlayerBulkSavings(extraPlayers: number): number {
    if (extraPlayers < 10) return 0;
    
    const bulkSets = Math.floor(extraPlayers / 10);
    const individualCost = extraPlayers * ADDON_PRICING.extraPlayer;
    const bulkCost = (bulkSets * ADDON_PRICING.extraPlayerBundle) + 
                    ((extraPlayers % 10) * ADDON_PRICING.extraPlayer);
    
    return individualCost - bulkCost;
  }
  
  // Check if operator qualifies for tier upgrade
  static shouldUpgradeTier(currentTier: string, playerCount: number): boolean {
    const recommendedTier = this.getTierForPlayerCount(playerCount);
    return recommendedTier !== currentTier;
  }
  
  // Format price for display
  static formatPrice(priceInCents: number): string {
    return `$${(priceInCents / 100).toFixed(0)}`;
  }
}

export const operatorSubscriptionCalculator = new OperatorSubscriptionCalculator();