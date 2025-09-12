
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SafeText } from "@/components/SafeText";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  totalRewardsEarned: number;
  nextMilestone?: number;
}

const STREAK_MILESTONES = [5, 10, 15, 20];
const STREAK_REWARDS = {
  5: 50,   // $50
  10: 100, // $100
  15: 150, // $150
  20: 250, // $250
};

export function StreakDisplay({ 
  currentStreak, 
  longestStreak, 
  totalRewardsEarned,
  nextMilestone 
}: StreakDisplayProps) {
  const nextRewardStreak = STREAK_MILESTONES.find(milestone => milestone > currentStreak) || 25;
  const progressToNext = Math.min(100, (currentStreak / nextRewardStreak) * 100);
  
  return (
    <Card className="bg-gray-900 border-green-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-green-400 flex items-center gap-2">
          🔥 Attendance Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Streak */}
        <div className="text-center">
          <div className="text-3xl font-bold text-white">
            {currentStreak}
          </div>
          <SafeText className="text-sm text-gray-400">
            matches without missing
          </SafeText>
          {longestStreak > currentStreak && (
            <SafeText className="text-xs text-yellow-400 mt-1">
              Personal best: {longestStreak}
            </SafeText>
          )}
        </div>

        {/* Progress to Next Reward */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <SafeText className="text-sm text-gray-400">
              Progress to ${STREAK_REWARDS[nextRewardStreak] || 300}
            </SafeText>
            <SafeText className="text-sm text-green-400">
              {nextRewardStreak - currentStreak} matches away
            </SafeText>
          </div>
          <Progress value={progressToNext} className="h-2" />
        </div>

        {/* Streak Milestones */}
        <div className="grid grid-cols-2 gap-2">
          {STREAK_MILESTONES.map(milestone => {
            const achieved = currentStreak >= milestone;
            const reward = STREAK_REWARDS[milestone];
            
            return (
              <Badge
                key={milestone}
                variant={achieved ? "default" : "outline"}
                className={`justify-center p-2 ${
                  achieved 
                    ? "bg-green-600 text-white" 
                    : "border-gray-600 text-gray-400"
                }`}
              >
                {milestone} = ${reward}
                {achieved && " ✓"}
              </Badge>
            );
          })}
        </div>

        {/* Total Rewards Earned */}
        {totalRewardsEarned > 0 && (
          <div className="text-center pt-2 border-t border-gray-700">
            <SafeText className="text-sm text-gray-400">
              Total streak bonuses earned
            </SafeText>
            <div className="text-lg font-bold text-green-400">
              ${(totalRewardsEarned / 100).toFixed(2)}
            </div>
          </div>
        )}

        {/* Motivation Message */}
        <div className="text-center text-xs text-gray-500">
          {currentStreak === 0 && "Start your streak today! 🚀"}
          {currentStreak > 0 && currentStreak < 5 && "Keep it up! First $50 at 5 matches 💪"}
          {currentStreak >= 5 && "Streak master! Keep the momentum 🏆"}
        </div>
      </CardContent>
    </Card>
  );
}
