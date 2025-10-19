import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy, Info, Calendar, Award } from "lucide-react";
import type { SelectLadderTrainingScore } from "@shared/schema";

interface LeaderboardEntry extends SelectLadderTrainingScore {
  playerName?: string;
}

export default function HallLeaderboard() {
  const { hallId } = useParams<{ hallId: string }>();
  
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: halls, isLoading: isLoadingHalls } = useQuery<{ halls: any[] }>({
    queryKey: ["/api/halls"],
    retry: false,
  });

  const { data: scores, isLoading: isLoadingScores } = useQuery<SelectLadderTrainingScore[]>({
    queryKey: ["/api/training/hall", hallId, "leaderboard", { period }],
    enabled: !!hallId,
    retry: false,
  });

  const { data: players } = useQuery<any[]>({
    queryKey: ["/api/players"],
    retry: false,
  });

  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    return options;
  }, []);

  const leaderboardData = useMemo<LeaderboardEntry[]>(() => {
    if (!scores || !players) return [];
    
    return scores.map(score => {
      const player = players.find((p: any) => p.id === score.playerId);
      return {
        ...score,
        playerName: player?.name || `Player ${score.playerId.slice(0, 8)}`,
      };
    }).sort((a, b) => a.rank - b.rank);
  }, [scores, players]);

  const winner = leaderboardData.find(entry => entry.isWinner);
  const selectedHall = halls?.halls?.find((h: any) => h.id === hallId);

  const isLoading = isLoadingScores || isLoadingHalls;

  const savageQuotes = [
    "Grinded. Trained. Conquered. 💰 Half-off earned. Who's next?",
    "Put in the work. Earned the reward. Respect. 🏆",
    "Hours logged. Skills sharpened. Discount unlocked. Beast mode. 💪",
    "Coach said improve. They delivered. Savings secured. 🔥",
    "Trained hard. Played smart. Cashed in. Period. 💵",
    "No shortcuts. Just results. Reward claimed. Next. 🎯",
  ];

  const randomQuote = useMemo(() => 
    savageQuotes[Math.floor(Math.random() * savageQuotes.length)],
    [period]
  );

  if (!hallId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-6">
        <Card className="max-w-2xl mx-auto bg-gray-800 border-green-600/30">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="text-yellow-400" />
              Select a Hall
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-400">Choose a pool hall to view training leaderboard:</p>
              <div className="space-y-2">
                {isLoadingHalls ? (
                  <>
                    <Skeleton className="h-12 w-full bg-gray-700" />
                    <Skeleton className="h-12 w-full bg-gray-700" />
                  </>
                ) : halls?.halls && halls.halls.length > 0 ? (
                  halls.halls.map((hall: any) => (
                    <Link key={hall.id} href={`/training/leaderboard/${hall.id}`}>
                      <div 
                        className="p-4 bg-gray-900/50 border border-green-600/30 rounded-lg hover:bg-gray-900/70 hover:border-green-500 transition-all cursor-pointer"
                        data-testid={`link-hall-${hall.id}`}
                      >
                        <div className="font-bold text-white">{hall.name}</div>
                        <div className="text-sm text-gray-400">{hall.city}, {hall.state}</div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No halls available</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
              <Trophy className="text-yellow-400" />
              Training Leaderboard
            </h1>
            {selectedHall && (
              <p className="text-gray-400 mt-2" data-testid="text-hall-name">
                {selectedHall.name} - {selectedHall.city}, {selectedHall.state}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger 
                className="w-full sm:w-[200px] bg-gray-800 border-green-600/30 text-white"
                data-testid="select-period"
              >
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {monthOptions.find(m => m.value === period)?.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-green-600/30">
                {monthOptions.map(option => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="text-white hover:bg-gray-700"
                    data-testid={`option-period-${option.value}`}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Link href="/training/leaderboard">
              <button 
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                data-testid="button-change-hall"
              >
                Change Hall
              </button>
            </Link>
          </div>
        </div>

        {/* Winner Banner */}
        {winner && !isLoading && (
          <Card className="bg-gradient-to-r from-yellow-900/40 via-amber-900/40 to-yellow-900/40 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-gray-900" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="text-yellow-400 font-bold text-sm uppercase tracking-wider">
                    🏆 Monthly Champion
                  </div>
                  <div className="text-2xl font-black text-white mt-1" data-testid="text-winner-name">
                    {winner.playerName}
                  </div>
                  <div className="text-gray-300 mt-2 italic font-medium">
                    "{randomQuote}"
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Badge 
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 text-lg font-bold"
                    data-testid="badge-winner-reward"
                  >
                    {winner.rank === 1 ? "🏆 FREE MONTH" : "🏆 50% OFF"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Card */}
        <Card className="bg-gray-800 border-green-600/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Award className="text-green-400" />
                Rankings
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className="text-gray-400 hover:text-green-400 transition-colors"
                      data-testid="button-scoring-info"
                    >
                      <Info className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 border-green-600/30 text-white max-w-xs">
                    <p className="font-semibold mb-1">Scoring Formula</p>
                    <p className="text-sm">
                      Total Score = 50% coach improvement + 30% hours + 20% win rate
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-gray-700" />
                ))}
              </div>
            ) : leaderboardData.length === 0 ? (
              <div className="text-center py-12" data-testid="empty-state">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No training data for this month</p>
                <p className="text-gray-500 text-sm mt-2">
                  Players need to log training sessions to appear on the leaderboard
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-green-600/30 hover:bg-transparent">
                      <TableHead className="text-gray-400 font-bold">Rank</TableHead>
                      <TableHead className="text-gray-400 font-bold">Player</TableHead>
                      <TableHead className="text-gray-400 font-bold">Ladder</TableHead>
                      <TableHead className="text-gray-400 font-bold text-right">Hours</TableHead>
                      <TableHead className="text-gray-400 font-bold text-right">Coach Score</TableHead>
                      <TableHead className="text-gray-400 font-bold text-right">Win Rate</TableHead>
                      <TableHead className="text-gray-400 font-bold text-right">Total Score</TableHead>
                      <TableHead className="text-gray-400 font-bold text-center">Reward</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboardData.map((entry, index) => (
                      <TableRow
                        key={entry.id}
                        className={`border-green-600/20 ${
                          entry.isWinner 
                            ? 'bg-gradient-to-r from-green-900/30 via-emerald-900/30 to-green-900/30 border-l-4 border-l-green-500 shadow-lg shadow-green-500/10' 
                            : 'hover:bg-gray-700/50'
                        }`}
                        data-testid={`row-player-${entry.playerId}`}
                      >
                        <TableCell className="font-bold">
                          {entry.rank <= 3 ? (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              entry.rank === 1 ? 'bg-yellow-400 text-gray-900' :
                              entry.rank === 2 ? 'bg-gray-300 text-gray-900' :
                              'bg-amber-600 text-white'
                            }`}>
                              {entry.rank}
                            </div>
                          ) : (
                            <span className="text-gray-400">#{entry.rank}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-white" data-testid={`text-player-name-${entry.playerId}`}>
                          {entry.playerName}
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm" data-testid={`text-ladder-${entry.playerId}`}>
                          {entry.ladderId?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Main'}
                        </TableCell>
                        <TableCell className="text-right text-green-400 font-semibold" data-testid={`text-hours-${entry.playerId}`}>
                          {entry.hoursTotal.toFixed(1)}h
                        </TableCell>
                        <TableCell className="text-right text-green-400 font-semibold" data-testid={`text-coach-score-${entry.playerId}`}>
                          {entry.coachAvg.toFixed(1)}/100
                        </TableCell>
                        <TableCell className="text-right text-gray-300" data-testid={`text-win-rate-${entry.playerId}`}>
                          {(entry.winRate * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right font-bold text-white" data-testid={`text-total-score-${entry.playerId}`}>
                          {entry.totalScore.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {entry.isWinner && (
                            <Badge 
                              className="bg-gradient-to-r from-yellow-600 to-amber-600 text-white font-bold"
                              data-testid={`badge-reward-${entry.playerId}`}
                            >
                              {entry.rank === 1 ? '🏆 FREE' : '🏆 50% OFF'}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-gray-800/50 border-blue-600/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="text-blue-400 flex-shrink-0 mt-1" />
              <div className="text-gray-300 text-sm space-y-2">
                <p className="font-semibold text-white">How Training Rewards Work:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>Train consistently and track your sessions with the AI Coach</li>
                  <li>Top performer each month wins a <strong className="text-green-400">FREE MONTH</strong> subscription</li>
                  <li>Runner-up earns <strong className="text-green-400">50% OFF</strong> their next month</li>
                  <li>Scores based on: Coach improvement (50%), training hours (30%), and win rate (20%)</li>
                  <li>All sessions must be logged in the hall's system to count</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
