
import { storage } from "./storage";

// Player retention incentive system
export const RETENTION_INCENTIVES = {
  STREAK_REWARDS: {
    5: { amount: 5000, description: "$50 streak bonus - 5 matches without missing" }, // $50 in cents
    10: { amount: 10000, description: "$100 streak bonus - 10 matches without missing" },
    15: { amount: 15000, description: "$150 streak bonus - 15 matches without missing" },
    20: { amount: 25000, description: "$250 streak bonus - 20 matches without missing" },
  },
  WEEKLY_MINI_PRIZES: {
    amount: 5000, // $50 weekly pot
    description: "Weekly $50 mini-prize drawings",
  },
  HILL_HILL_CHAOS: {
    multiplier: 2,
    description: "Double points on Hill-Hill Chaos nights",
  },
  PROGRESS_MILESTONES: {
    ladder_climb: { percentage: 25, reward: 2500 }, // $25 at 25% progress
    halfway_hero: { percentage: 50, reward: 5000 }, // $50 at 50% progress
    almost_there: { percentage: 75, reward: 7500 }, // $75 at 75% progress
  },
} as const;

export interface PlayerStreak {
  playerId: string;
  currentStreak: number;
  longestStreak: number;
  lastMatchDate: Date;
  totalRewardsEarned: number;
  streakRewardsClaimed: number[];
}

export interface WeeklyMiniPrize {
  week: string; // "2024-01"
  prizeAmount: number;
  participants: string[];
  winner?: string;
  drawn: boolean;
  drawnAt?: Date;
}

/**
 * Track player match attendance streak
 */
export async function updatePlayerStreak(playerId: string, missedMatch: boolean = false): Promise<PlayerStreak> {
  try {
    let streak = await storage.getPlayerStreak(playerId);
    
    if (!streak) {
      streak = {
        playerId,
        currentStreak: 0,
        longestStreak: 0,
        lastMatchDate: new Date(),
        totalRewardsEarned: 0,
        streakRewardsClaimed: [],
      };
    }

    if (missedMatch) {
      // Reset streak on missed match
      streak.currentStreak = 0;
    } else {
      // Increment streak on completed match
      streak.currentStreak += 1;
      streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    }

    streak.lastMatchDate = new Date();

    // Check for streak rewards
    const eligibleReward = RETENTION_INCENTIVES.STREAK_REWARDS[streak.currentStreak];
    if (eligibleReward && !streak.streakRewardsClaimed.includes(streak.currentStreak)) {
      // Award streak bonus
      await awardStreakBonus(playerId, streak.currentStreak, eligibleReward.amount);
      streak.streakRewardsClaimed.push(streak.currentStreak);
      streak.totalRewardsEarned += eligibleReward.amount;
    }

    await storage.updatePlayerStreak(streak);
    return streak;
  } catch (error) {
    console.error("Error updating player streak:", error);
    throw error;
  }
}

/**
 * Award streak bonus to player wallet
 */
async function awardStreakBonus(playerId: string, streakCount: number, amount: number): Promise<void> {
  try {
    // Add to player wallet
    let wallet = await storage.getWallet(playerId);
    if (!wallet) {
      wallet = await storage.createWallet({
        userId: playerId,
        balanceCredits: 0,
        balanceLockedCredits: 0,
      });
    }

    // Credit the streak bonus
    wallet.balanceCredits += amount;
    await storage.updateWallet(wallet);

    // Log the incentive
    await storage.createPlayUpIncentive({
      playerId,
      incentiveType: "streak_bonus",
      title: `${streakCount}-Match Streak Bonus`,
      description: `$${(amount / 100).toFixed(2)} bonus for ${streakCount} consecutive matches`,
      bonusAmount: amount,
      publicRecognition: true,
      awarded: true,
      awardedAt: new Date(),
    });

    // Log for transparency
    const { transparencyLogger } = await import("./transparency-logs");
    await transparencyLogger.logStreakBonus(playerId, streakCount, amount);

    console.log(`Awarded $${(amount / 100).toFixed(2)} streak bonus to player ${playerId}`);
  } catch (error) {
    console.error("Error awarding streak bonus:", error);
    throw error;
  }
}

/**
 * Create weekly mini-prize drawing
 */
export async function createWeeklyMiniPrize(): Promise<WeeklyMiniPrize> {
  const currentWeek = new Date().toISOString().slice(0, 7); // "2024-01"
  
  const miniPrize: WeeklyMiniPrize = {
    week: currentWeek,
    prizeAmount: RETENTION_INCENTIVES.WEEKLY_MINI_PRIZES.amount,
    participants: [],
    drawn: false,
  };

  await storage.createWeeklyMiniPrize(miniPrize);
  return miniPrize;
}

/**
 * Enter player in weekly drawing
 */
export async function enterWeeklyDrawing(playerId: string): Promise<void> {
  const currentWeek = new Date().toISOString().slice(0, 7);
  let miniPrize = await storage.getWeeklyMiniPrize(currentWeek);
  
  if (!miniPrize) {
    miniPrize = await createWeeklyMiniPrize();
  }

  if (!miniPrize.participants.includes(playerId)) {
    miniPrize.participants.push(playerId);
    await storage.updateWeeklyMiniPrize(miniPrize);
  }
}

/**
 * Draw weekly winner
 */
export async function drawWeeklyWinner(week: string): Promise<string | null> {
  const miniPrize = await storage.getWeeklyMiniPrize(week);
  
  if (!miniPrize || miniPrize.drawn || miniPrize.participants.length === 0) {
    return null;
  }

  // Random winner selection
  const randomIndex = Math.floor(Math.random() * miniPrize.participants.length);
  const winner = miniPrize.participants[randomIndex];

  // Award prize to winner
  let wallet = await storage.getWallet(winner);
  if (!wallet) {
    wallet = await storage.createWallet({
      userId: winner,
      balanceCredits: 0,
      balanceLockedCredits: 0,
    });
  }

  wallet.balanceCredits += miniPrize.prizeAmount;
  await storage.updateWallet(wallet);

  // Mark as drawn
  miniPrize.winner = winner;
  miniPrize.drawn = true;
  miniPrize.drawnAt = new Date();
  await storage.updateWeeklyMiniPrize(miniPrize);

  // Log the win
  await storage.createPlayUpIncentive({
    playerId: winner,
    incentiveType: "weekly_mini_prize",
    title: "Weekly Mini-Prize Winner",
    description: `Won $${(miniPrize.prizeAmount / 100).toFixed(2)} in weekly drawing`,
    bonusAmount: miniPrize.prizeAmount,
    publicRecognition: true,
    awarded: true,
    awardedAt: new Date(),
  });

  // Log for transparency
  const { transparencyLogger } = await import("./transparency-logs");
  await transparencyLogger.logWeeklyPrize(winner, miniPrize.prizeAmount, miniPrize.participants.length);

  return winner;
}

/**
 * Calculate progress towards next milestone
 */
export function calculateProgressToNextMilestone(currentRating: number, targetRating: number): {
  percentage: number;
  progressDescription: string;
  nextMilestone?: { percentage: number; reward: number };
} {
  const progress = Math.min(100, ((currentRating - 1000) / (targetRating - 1000)) * 100);
  
  let nextMilestone;
  for (const [key, milestone] of Object.entries(RETENTION_INCENTIVES.PROGRESS_MILESTONES)) {
    if (progress < milestone.percentage) {
      nextMilestone = milestone;
      break;
    }
  }

  return {
    percentage: Math.max(0, progress),
    progressDescription: `You're ${progress.toFixed(0)}% to next ladder milestone`,
    nextMilestone,
  };
}
