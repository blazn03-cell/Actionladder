import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { generateQRCodeUrl, generateJoinUrl } from "@/lib/qr-generator";
import { generateFightNightPoster } from "@/lib/poster-generator";
import { useToast } from "@/hooks/use-toast";
import type { Player, Match, Tournament, CharityEvent, KellyPool } from "@shared/schema";

function StatsCard({ title, value, subtitle, icon }: { title: string; value: string | number; subtitle: string; icon: string }) {
  return (
    <div className="bg-black/60 backdrop-blur-sm border border-neon-green/20 rounded-xl p-6 shadow-felt">
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-2xl font-bold text-neon-green">{value}</div>
      <div className="text-sm text-gray-400">{subtitle}</div>
    </div>
  );
}

function KingsOfTheHill({ players }: { players: Player[] }) {
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);
  const hiDivision = sortedPlayers.filter(p => p.rating >= 600);
  const loDivision = sortedPlayers.filter(p => p.rating < 600);
  
  const kingHI = hiDivision[0];
  const kingLO = loDivision[0];

  return (
    <Card className="lg:col-span-2 bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center">
          <span className="mr-3">👑</span>
          Kings of the Hill
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 600+ Division King */}
          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-yellow-400">600+ KILLERS</span>
              <Badge className="bg-yellow-500/20 text-yellow-300">DIVISION 1</Badge>
            </div>
            {kingHI ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-yellow-900">
                      {kingHI.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-white">{kingHI.name}</div>
                    <div className="text-sm text-gray-400">{kingHI.city} • {kingHI.points} pts</div>
                    <div className="text-xs text-yellow-400">🔥 {kingHI.streak}-game streak</div>
                  </div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="text-xs"
                    data-testid="challenge-king-hi"
                  >
                    Challenge King
                  </Button>
                  <span className="text-xs text-yellow-400">Auto-bounty: $50</span>
                </div>
              </>
            ) : (
              <div className="text-gray-400">No players in division</div>
            )}
          </div>
          
          {/* 599 & Under Division King */}
          <div className="bg-gradient-to-br from-accent/20 to-accent/40 border border-accent/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-accent">599 & UNDER</span>
              <Badge className="bg-accent/20 text-accent">DIVISION 2</Badge>
            </div>
            {kingLO ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-felt-green rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {kingLO.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-white">{kingLO.name}</div>
                    <div className="text-sm text-gray-400">{kingLO.city} • {kingLO.points} pts</div>
                    <div className="text-xs text-accent">⚡ {kingLO.streak === 0 ? 'Fresh crown' : `${kingLO.streak}-game streak`}</div>
                  </div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="text-xs"
                    data-testid="challenge-king-lo"
                  >
                    Challenge King
                  </Button>
                  <span className="text-xs text-accent">Auto-bounty: $30</span>
                </div>
              </>
            ) : (
              <div className="text-gray-400">No players in division</div>
            )}
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-400">
          <span className="text-red-400 font-semibold">⚠️ King's Rule:</span> Win & stay King. Lose & drop hard (3–7 spots).
        </div>
      </CardContent>
    </Card>
  );
}

function QRCodeSection() {
  const { toast } = useToast();
  const joinUrl = generateJoinUrl();
  const qrCodeUrl = generateQRCodeUrl(joinUrl);

  const handleGeneratePoster = async () => {
    try {
      toast({
        title: "Generating Poster",
        description: "Creating fight night poster with top 2 players...",
      });
      
      // This would normally use real player data
      const posterData = {
        player1: { name: "Tyga Hoodz", rating: 620, city: "San Marcos" },
        player2: { name: "Jesse — The Spot", rating: 605, city: "Seguin" },
        event: {
          title: "Friday Night Fights",
          date: "This Friday 8PM",
          location: "Tri-City Billiards",
          stakes: "$150"
        }
      };
      
      const posterUrl = await generateFightNightPoster(posterData);
      
      // Create download link
      const link = document.createElement('a');
      link.href = posterUrl;
      link.download = 'fight-night-poster.png';
      link.click();
      
      toast({
        title: "Poster Generated",
        description: "Fight night poster has been downloaded!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate poster",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">📱 Quick Join</CardTitle>
      </CardHeader>
      <CardContent>
        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg mb-4">
          <img 
            src={qrCodeUrl} 
            alt="QR Code to join ladder" 
            className="w-32 h-32 mx-auto"
            data-testid="qr-code"
          />
        </div>
        
        <div className="text-center text-sm text-gray-400 mb-4">
          Scan to join Tri-City Ladder instantly
        </div>
        
        {/* Fight Night Poster Generator */}
        <div className="bg-gradient-to-r from-red-600/20 to-transparent border border-red-500/30 rounded-lg p-4">
          <div className="font-semibold text-white mb-2">🥊 Fight Night Poster</div>
          <div className="text-sm text-gray-400 mb-3">Auto-generate with top 2 players</div>
          <Button 
            onClick={handleGeneratePoster}
            className="w-full bg-red-500/20 hover:bg-red-500/40 text-red-400"
            data-testid="button-generate-poster"
          >
            Generate Poster
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentMatches({ matches, players }: { matches: Match[]; players: Player[] }) {
  const recentMatches = matches
    .filter(m => m.status === "reported")
    .sort((a, b) => new Date(b.reportedAt || 0).getTime() - new Date(a.reportedAt || 0).getTime())
    .slice(0, 5);

  const getPlayerName = (id: string) => {
    return players.find(p => p.id === id)?.name || "Unknown Player";
  };

  if (recentMatches.length === 0) {
    return (
      <Card className="lg:col-span-2 bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">🔥 Recent Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-400">No matches reported yet</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">🔥 Recent Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentMatches.map((match) => {
            const winner = getPlayerName(match.winner || "");
            const loser = getPlayerName(
              match.winner === match.challenger ? match.opponent : match.challenger
            );
            
            return (
              <div key={match.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-white/5 to-transparent rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-neon-green to-accent rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-felt-dark">W</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">{winner} defeated {loser}</div>
                    <div className="text-sm text-gray-400">
                      {match.game} • ${match.stake} stake • {match.table}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-neon-green font-semibold">+{match.stake} pts</div>
                  <div className="text-xs text-gray-400">
                    {match.reportedAt ? new Date(match.reportedAt).toLocaleTimeString() : "Recently"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: players = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: matches = [], isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery<Tournament[]>({
    queryKey: ["/api/tournaments"],
  });

  const { data: kellyPools = [], isLoading: kellyPoolsLoading } = useQuery<KellyPool[]>({
    queryKey: ["/api/kelly-pools"],
  });

  const { data: jackpotData, isLoading: jackpotLoading } = useQuery<{ jackpot: number }>({
    queryKey: ["/api/jackpot"],
  });

  if (playersLoading || matchesLoading || tournamentsLoading || kellyPoolsLoading || jackpotLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" color="neon" />
      </div>
    );
  }

  const completedMatches = matches.filter(m => m.status === "reported").length;
  const upcomingMatches = matches.filter(m => m.status === "scheduled").length;
  const totalStakes = matches
    .filter(m => m.status === "reported")
    .reduce((sum, match) => sum + match.stake, 0);
  const activePlayers = players.length;
  const liveMatches = 3; // This would come from live streaming data

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard 
          title="Break & Run Jackpot" 
          value={`$${jackpotData?.jackpot || 847}`} 
          subtitle="2% of stakes feed this" 
          icon="💰"
        />
        <StatsCard 
          title="Active Players" 
          value={activePlayers} 
          subtitle="Two divisions" 
          icon="👥"
        />
        <StatsCard 
          title="Live Matches" 
          value={liveMatches} 
          subtitle={`${upcomingMatches} upcoming`} 
          icon="🎯"
        />
        <StatsCard 
          title="Total Stakes" 
          value={`$${totalStakes.toLocaleString()}`} 
          subtitle={`${completedMatches} completed`} 
          icon="💵"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <KingsOfTheHill players={players} />
        <QRCodeSection />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentMatches matches={matches} players={players} />
      </div>

      {/* Footer Stats */}
      <Card className="bg-gradient-to-r from-felt-green/20 to-transparent border border-neon-green/10">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-neon-green">{completedMatches}</div>
              <div className="text-sm text-gray-400">Total Matches</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-dollar-green">${totalStakes.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Stakes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">{activePlayers}</div>
              <div className="text-sm text-gray-400">Active Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">3</div>
              <div className="text-sm text-gray-400">Cities</div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-400 mb-2">Pool. Points. Pride.</div>
            <div className="text-xs text-gray-500">Walk‑ups got theme songs. Matches get streamed. Dog a ball? We're clipping it. 😈</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
