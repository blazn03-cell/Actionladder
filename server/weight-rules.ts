// Weight Rules implementation for consecutive losses

import { storage } from "./storage";

export interface WeightRule {
  playerId: string;
  opponentId: string;
  consecutiveLosses: number;
  totalLosses: number;
  weightOwed: boolean;
  lastLossAt?: Date;
}

export class WeightRulesSystem {
  
  // Update weight rules after a match result
  async updateWeightRules(matchResult: {
    winnerId: string;
    loserId: string;
    winnerRating: number;
    loserRating: number;
  }): Promise<{ weightMultiplier: number; owedWeight: boolean }> {
    
    const { winnerId, loserId, winnerRating, loserRating } = matchResult;
    
    // Check if loser played against higher-ranked player
    const isHigherRanked = winnerRating > loserRating;
    
    // Get existing weight rule record
    let rule = await storage.getWeightRule(loserId, winnerId);
    
    if (!rule) {
      // Create new rule record
      rule = {
        playerId: loserId,
        opponentId: winnerId,
        consecutiveLosses: 1,
        totalLosses: 1,
        weightOwed: false,
        lastLossAt: new Date()
      };
    } else {
      // Update existing rule
      rule.consecutiveLosses += 1;
      rule.totalLosses += 1;
      rule.lastLossAt = new Date();
    }
    
    // Apply weight rules based on consecutive losses
    if (isHigherRanked && rule.consecutiveLosses >= 2) {
      // Lose 2 in a row to same higher-ranked player → they owe you weight
      rule.weightOwed = true;
    }
    
    // Save updated rule
    await storage.updateWeightRule(rule);
    
    // Calculate weight multiplier for next match
    let weightMultiplier = 1.0;
    let owedWeight = false;
    
    if (rule.consecutiveLosses >= 3) {
      // Lose 3 in a row → weight or more cash (1.5x wager)
      weightMultiplier = 1.5;
      owedWeight = true;
    } else if (rule.weightOwed) {
      // Standard weight owed from 2 consecutive losses
      weightMultiplier = 1.2; // 20% handicap
      owedWeight = true;
    }
    
    return { weightMultiplier, owedWeight };
  }
  
  // Get weight multiplier for an upcoming match
  async getWeightMultiplier(challengerId: string, opponentId: string): Promise<number> {
    // Check if challenger owes weight to opponent
    const rule = await storage.getWeightRule(challengerId, opponentId);
    
    if (!rule || !rule.weightOwed) {
      return 1.0; // No weight owed
    }
    
    if (rule.consecutiveLosses >= 3) {
      return 1.5; // 50% more cash for 3+ losses
    } else if (rule.consecutiveLosses >= 2) {
      return 1.2; // 20% weight for 2+ losses
    }
    
    return 1.0;
  }
  
  // Clear weight debt after challenger wins
  async clearWeightDebt(winnerId: string, loserId: string): Promise<void> {
    const rule = await storage.getWeightRule(winnerId, loserId);
    
    if (rule) {
      rule.consecutiveLosses = 0;
      rule.weightOwed = false;
      await storage.updateWeightRule(rule);
    }
  }
  
  // Reset consecutive losses (but keep total losses)
  async resetConsecutiveLosses(playerId: string, opponentId: string): Promise<void> {
    const rule = await storage.getWeightRule(playerId, opponentId);
    
    if (rule) {
      rule.consecutiveLosses = 0;
      rule.weightOwed = false;
      await storage.updateWeightRule(rule);
    }
  }
}

export const weightRulesSystem = new WeightRulesSystem();