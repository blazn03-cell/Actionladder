
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SafeText } from "@/components/SafeText";
import { apiRequest } from "@/lib/queryClient";

interface WeeklyPrize {
  week: string;
  prizeAmount: number;
  participants: string[];
  winner?: string;
  drawn: boolean;
  drawnAt?: string;
}

export function MiniPrizeWidget({ playerId }: { playerId: string }) {
  const [weeklyPrize, setWeeklyPrize] = useState<WeeklyPrize | null>(null);
  const [isEntered, setIsEntered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyPrize();
  }, []);

  const loadWeeklyPrize = async () => {
    try {
      const response = await apiRequest("/api/weekly-prize/current", {
        method: "GET"
      });
      
      if (response.ok) {
        const data = await response.json();
        setWeeklyPrize(data.weeklyPrize);
        setIsEntered(data.isEntered);
      }
    } catch (error) {
      console.error("Error loading weekly prize:", error);
    } finally {
      setLoading(false);
    }
  };

  const enterDrawing = async () => {
    try {
      const response = await apiRequest("/api/weekly-prize/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId })
      });

      if (response.ok) {
        setIsEntered(true);
        await loadWeeklyPrize();
      }
    } catch (error) {
      console.error("Error entering drawing:", error);
    }
  };

  if (loading) return null;

  return (
    <Card className="bg-gray-900 border-purple-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-purple-400 flex items-center gap-2">
          🎯 Weekly Mini-Prize
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Prize Amount */}
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            ${weeklyPrize ? (weeklyPrize.prizeAmount / 100).toFixed(2) : "50.00"}
          </div>
          <SafeText className="text-sm text-gray-400">
            Weekly drawing prize
          </SafeText>
        </div>

        {/* Participants Count */}
        {weeklyPrize && (
          <div className="text-center">
            <SafeText className="text-sm text-purple-300">
              {weeklyPrize.participants.length} players entered
            </SafeText>
          </div>
        )}

        {/* Entry Status */}
        {!weeklyPrize?.drawn && (
          <div className="text-center">
            {isEntered ? (
              <Badge className="bg-green-600 text-white">
                ✓ You're entered!
              </Badge>
            ) : (
              <Button 
                onClick={enterDrawing}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Enter Drawing
              </Button>
            )}
          </div>
        )}

        {/* Winner Announcement */}
        {weeklyPrize?.drawn && weeklyPrize.winner && (
          <div className="text-center p-2 bg-yellow-900/20 border border-yellow-700/30 rounded">
            <SafeText className="text-sm text-yellow-300">
              🏆 This week's winner
            </SafeText>
            <div className="font-bold text-yellow-400">
              {weeklyPrize.winner === playerId ? "You won!" : "Someone else won"}
            </div>
          </div>
        )}

        {/* How it Works */}
        <div className="text-xs text-gray-500 space-y-1">
          <SafeText>• Enter once per week</SafeText>
          <SafeText>• Winner drawn Sunday night</SafeText>
          <SafeText>• Prize credited to wallet</SafeText>
        </div>
      </CardContent>
    </Card>
  );
}
