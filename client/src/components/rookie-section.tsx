import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Star, Trophy, Users, Crown, Target } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { Player } from "@shared/schema";

interface RookieStatsCardProps {
  players: Player[];
}

function RookieStatsCard({ players }: RookieStatsCardProps) {
  const rookies = players.filter(p => p.isRookie);
  const avgRating = rookies.length > 0 
    ? Math.round(rookies.reduce((sum, p) => sum + p.rating, 0) / rookies.length)
    : 0;
  const totalRookieWins = rookies.reduce((sum, p) => sum + (p.rookieWins || 0), 0);
  const readyToGraduate = rookies.filter(p => p.rating >= 500 || (p.rookieWins || 0) >= 10);

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-blue-500/30 shadow-felt">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center">
          <Users className="mr-3 text-blue-400" />
          Rookie Division Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{rookies.length}</div>
            <div className="text-xs text-gray-400">Total Rookies</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{avgRating}</div>
            <div className="text-xs text-gray-400">Avg Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{totalRookieWins}</div>
            <div className="text-xs text-gray-400">Total Wins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{readyToGraduate.length}</div>
            <div className="text-xs text-gray-400">Ready to Graduate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RookieRecognition({ players }: { players: Player[] }) {
  const rookies = players.filter(p => p.isRookie);
  const sortedByWins = [...rookies].sort((a, b) => (b.rookieWins || 0) - (a.rookieWins || 0));
  const sortedByImprovement = [...rookies].sort((a, b) => b.rating - a.rating);
  const rookieOfWeek = sortedByWins[0];
  const mostImproved = sortedByImprovement[0];

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-purple-500/30 shadow-felt">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center">
          <Star className="mr-3 text-purple-400" />
          Rookie Recognition
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rookieOfWeek && (
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Crown className="w-6 h-6 text-yellow-400" />
                <div>
                  <div className="text-lg font-bold text-white">Rookie of the Week</div>
                  <div className="text-purple-400 font-semibold">{rookieOfWeek.name}</div>
                  <div className="text-sm text-gray-400">{rookieOfWeek.rookieWins || 0} wins • {rookieOfWeek.city}</div>
                </div>
              </div>
            </div>
          )}

          {mostImproved && mostImproved.id !== rookieOfWeek?.id && (
            <div className="bg-gradient-to-r from-blue-900/30 to-green-900/30 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Target className="w-6 h-6 text-blue-400" />
                <div>
                  <div className="text-lg font-bold text-white">Most Improved</div>
                  <div className="text-blue-400 font-semibold">{mostImproved.name}</div>
                  <div className="text-sm text-gray-400">Rating: {mostImproved.rating} • {mostImproved.city}</div>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 text-center">
            Recognition resets weekly • Earn respect through good sportsmanship
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RookieGraduationCard({ players }: { players: Player[] }) {
  const { toast } = useToast();
  const readyToGraduate = players.filter(p => 
    p.isRookie && (p.rating >= 500 || (p.rookieWins || 0) >= 10)
  );

  const graduatePlayerMutation = useMutation({
    mutationFn: (playerId: string) =>
      fetch('/api/players/graduate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      }).then(res => res.json()),
    onSuccess: (data) => {
      toast({
        title: "Player Graduated!",
        description: `${data.name} has been promoted to the main ladder`,
      });
      // Invalidate players cache to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
    },
    onError: () => {
      toast({
        title: "Graduation Failed",
        description: "Unable to graduate player",
        variant: "destructive"
      });
    }
  });

  if (readyToGraduate.length === 0) {
    return null;
  }

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 shadow-felt">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center">
          <GraduationCap className="mr-3 text-yellow-400" />
          Ready to Graduate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {readyToGraduate.map((player) => (
            <div 
              key={player.id}
              className="flex items-center justify-between bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-3"
            >
              <div>
                <div className="font-semibold text-white">{player.name}</div>
                <div className="text-sm text-gray-400">
                  Rating: {player.rating} • Wins: {player.rookieWins || 0}
                  {player.rating >= 500 && " • Hit 500+ Rating!"}
                  {(player.rookieWins || 0) >= 10 && " • 10+ Rookie Wins!"}
                </div>
              </div>
              <Button
                onClick={() => graduatePlayerMutation.mutate(player.id)}
                disabled={graduatePlayerMutation.isPending}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
                data-testid={`button-graduate-${player.id}`}
              >
                {graduatePlayerMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  "Graduate"
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RookieLadderTable({ players }: { players: Player[] }) {
  const rookies = players.filter(p => p.isRookie);
  const rankedRookies = rookies
    .sort((a, b) => (b.rookieWins || 0) - (a.rookieWins || 0))
    .map((player, index) => ({ ...player, rookieRank: index + 1 }));

  if (rookies.length === 0) {
    return (
      <Card className="bg-black/60 backdrop-blur-sm border border-blue-500/30 shadow-felt">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">🌟 Rookie Ladder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-400 text-center py-8">
            No rookies in the system yet. Players start as rookies until they hit 500+ Fargo rating.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-blue-500/30 shadow-felt">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center">
          🌟 Rookie Ladder
          <Badge className="ml-3 bg-blue-600/20 text-blue-400 border-blue-500/30">
            Fargo &lt; 500
          </Badge>
        </CardTitle>
        <div className="text-sm text-gray-400 mt-2">
          Standard challenger fee ($60 minimum) • Graduate at 500+ rating or 10 wins
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blue-500/20">
                <th className="text-left py-2 text-gray-400">Rank</th>
                <th className="text-left py-2 text-gray-400">Player</th>
                <th className="text-left py-2 text-gray-400">Rating</th>
                <th className="text-left py-2 text-gray-400">Rookie Wins</th>
                <th className="text-left py-2 text-gray-400">City</th>
                <th className="text-left py-2 text-gray-400">Streak</th>
                <th className="text-left py-2 text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {rankedRookies.map((player) => (
                <tr 
                  key={player.id} 
                  className="border-b border-white/10 hover:bg-white/5 transition-colors"
                  data-testid={`rookie-row-${player.id}`}
                >
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-blue-400">#{player.rookieRank}</span>
                      {player.rookieRank === 1 && <span className="text-yellow-400">🌟</span>}
                      {player.rookieRank === 2 && <span className="text-gray-400">⭐</span>}
                      {player.rookieRank === 3 && <span className="text-amber-400">✨</span>}
                    </div>
                  </td>
                  <td className="py-3">
                    <div>
                      <div className="font-semibold text-white">{player.name}</div>
                      {player.theme && (
                        <div className="text-xs text-gray-400 italic">"{player.theme}"</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`font-semibold ${player.rating >= 500 ? 'text-yellow-400' : 'text-blue-400'}`}>
                      {player.rating}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="font-bold text-green-400">{player.rookieWins || 0}</span>
                    {(player.rookieWins || 0) >= 10 && <span className="text-yellow-400 ml-1">🎯</span>}
                  </td>
                  <td className="py-3">
                    <span className="text-gray-400">{player.city}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center space-x-1">
                      <span className="text-white">{player.streak || 0}</span>
                      {(player.streak || 0) >= 3 && <span className="text-orange-400">🔥</span>}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {player.rating >= 500 && (
                        <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">
                          Ready to Graduate
                        </Badge>
                      )}
                      {(player.rookieWins || 0) >= 10 && (
                        <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                          10+ Wins
                        </Badge>
                      )}
                      {player.member && (
                        <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                          Member
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function RookieRules() {
  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-blue-500/30 shadow-felt">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">📚 Rookie Rules</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Entry Level:</span> All new players start as rookies (Fargo &lt; 500)
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Challenge Fees:</span> Standard challenger fee ($60 minimum, same as main ladders)
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Graduation:</span> Hit 500+ Fargo rating OR win 10 rookie matches
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Rewards:</span> Free drinks, table time, and recognition instead of big cash
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Safe Space:</span> Learn and improve without facing sharks
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Respect Points:</span> Earned through good sportsmanship and helping others
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RookieSection() {
  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" color="neon" />
      </div>
    );
  }

  const rookies = players.filter(p => p.isRookie);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <GraduationCap className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl font-black text-white">ROOKIE SECTION</h1>
          <GraduationCap className="w-8 h-8 text-blue-400" />
        </div>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Your safe space to learn, grow, and earn respect before stepping into the main action.
          No sharks, no pressure—just pure skill development.
        </p>
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-4 max-w-md mx-auto">
          <div className="text-lg font-bold text-blue-400">Graduate When You:</div>
          <div className="text-sm text-gray-300 mt-1">
            • Hit 500+ Fargo rating <span className="text-yellow-400">OR</span><br/>
            • Win 10 rookie division matches
          </div>
        </div>
      </div>

      {/* Stats and Recognition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RookieStatsCard players={players} />
        <RookieRules />
      </div>

      {/* Recognition Section */}
      <RookieRecognition players={players} />

      {/* Graduation Section */}
      <RookieGraduationCard players={players} />

      {/* Rookie Ladder */}
      <RookieLadderTable players={players} />

      {/* Welcome Message for Empty State */}
      {rookies.length === 0 && (
        <Card className="bg-black/60 backdrop-blur-sm border border-blue-500/30 shadow-felt">
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <div className="text-6xl">🌟</div>
              <h3 className="text-2xl font-bold text-white">Welcome Future Champions!</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                The Rookie Section is your launching pad. Start here, learn the ropes, 
                and graduate to the main ladder when you're ready to face the sharks.
              </p>
              <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 text-lg px-4 py-2">
                Everyone starts here
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}