import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Users, Calendar, TrendingUp, Target, Crown } from "lucide-react";

interface PoolHall {
  id: string;
  name: string;
  city: string;
  wins: number;
  losses: number;
  points: number;
  description: string;
  address: string;
  phone: string;
  active: boolean;
  battlesUnlocked: boolean;
  unlockedBy?: string;
  unlockedAt?: string;
  createdAt: string;
}

interface HallMatch {
  id: string;
  homeHallId: string;
  awayHallId: string;
  format: string;
  totalRacks: number;
  homeScore: number;
  awayScore: number;
  status: string;
  winnerHallId?: string;
  scheduledDate?: string;
  completedAt?: string;
  notes?: string;
  stake: number;
  createdAt: string;
}

function HallStandings() {
  const { data: hallsData, isLoading: hallsLoading } = useQuery({
    queryKey: ["/api/halls"],
  });

  if (hallsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-neon-green border-t-transparent rounded-full" />
      </div>
    );
  }

  const halls: PoolHall[] = (hallsData as any)?.halls || [];
  const battlesEnabled = (hallsData as any)?.battlesEnabled || false;

  if (!battlesEnabled) {
    return (
      <div className="text-center py-16">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m-7-7a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-yellow-400 mb-2">HALL BATTLES LOCKED</h3>
          <p className="text-gray-400 mb-4">
            This feature is currently locked for your area.
          </p>
          <p className="text-sm text-gray-500">
            Contact your trustee to unlock hall vs hall competitions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold text-neon-green mb-2">TRI-CITY HALL STANDINGS</h2>
        <p className="text-gray-400">Pool Hall vs Pool Hall Competition Rankings</p>
      </div>

      <div className="grid gap-6">
        {halls.map((hall, index) => {
          const rank = index + 1;
          const totalMatches = hall.wins + hall.losses;
          const winPercentage = totalMatches > 0 ? Math.round((hall.wins / totalMatches) * 100) : 0;
          
          return (
            <Card 
              key={hall.id} 
              className={`bg-felt-darker border-2 transition-all hover:shadow-xl ${
                rank === 1 ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20' :
                rank === 2 ? 'border-gray-400/50 shadow-lg shadow-gray-400/20' :
                rank === 3 ? 'border-amber-600/50 shadow-lg shadow-amber-600/20' :
                'border-neon-green/30'
              }`}
              data-testid={`hall-standings-${hall.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
                      rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                      rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                      rank === 3 ? 'bg-amber-600/20 text-amber-400' :
                      'bg-neon-green/20 text-neon-green'
                    }`}>
                      {rank === 1 ? <Crown className="w-6 h-6" /> : `#${rank}`}
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white">{hall.name}</CardTitle>
                      <CardDescription className="text-gray-400">{hall.city}</CardDescription>
                      <p className="text-sm text-gray-500 mt-1">{hall.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-neon-green">
                      {hall.points.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">Points</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-400">{hall.wins}</div>
                    <div className="text-xs text-gray-400">WINS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-400">{hall.losses}</div>
                    <div className="text-xs text-gray-400">LOSSES</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-400">{totalMatches}</div>
                    <div className="text-xs text-gray-400">TOTAL</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-yellow-400">{winPercentage}%</div>
                    <div className="text-xs text-gray-400">WIN RATE</div>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-400">
                  <div>📍 {hall.address}</div>
                  <div>📞 {hall.phone}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function RecentMatches() {
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/hall-matches"],
  });

  const { data: hallsData } = useQuery({
    queryKey: ["/api/halls"],
  });

  if (matchesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-neon-green border-t-transparent rounded-full" />
      </div>
    );
  }

  const matches: HallMatch[] = (matchesData as any)?.matches || [];
  const halls: PoolHall[] = (hallsData as any)?.halls || [];
  const battlesEnabled = (matchesData as any)?.battlesEnabled || false;

  if (!battlesEnabled) {
    return (
      <div className="text-center py-16">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m-7-7a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-yellow-400 mb-2">HALL BATTLES LOCKED</h3>
          <p className="text-gray-400 mb-4">
            No inter-hall matches available - battles not yet unlocked for this area.
          </p>
          <p className="text-sm text-gray-500">
            Contact your trustee to enable venue vs venue competitions.
          </p>
        </div>
      </div>
    );
  }
  
  const getHallName = (hallId: string) => {
    const hall = halls.find(h => h.id === hallId);
    return hall?.name || "Unknown Hall";
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold text-neon-green mb-2">RECENT HALL BATTLES</h2>
        <p className="text-gray-400">Latest inter-venue match results</p>
      </div>

      <div className="grid gap-4">
        {matches.map((match) => {
          const homeHall = getHallName(match.homeHallId);
          const awayHall = getHallName(match.awayHallId);
          const isCompleted = match.status === "completed";
          
          return (
            <Card 
              key={match.id} 
              className="bg-felt-darker border border-neon-green/30 hover:border-neon-green/50 transition-colors"
              data-testid={`hall-match-${match.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    {/* Home Team */}
                    <div className="text-center">
                      <div className="font-semibold text-white">{homeHall}</div>
                      <div className={`text-2xl font-bold ${
                        isCompleted && match.winnerHallId === match.homeHallId ? 'text-green-400' : 'text-gray-300'
                      }`}>
                        {match.homeScore}
                      </div>
                    </div>
                    
                    {/* VS Separator */}
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-1">VS</div>
                      <div className="text-xs text-gray-500">
                        {match.format.replace('team_', '').toUpperCase()}
                      </div>
                    </div>
                    
                    {/* Away Team */}
                    <div className="text-center">
                      <div className="font-semibold text-white">{awayHall}</div>
                      <div className={`text-2xl font-bold ${
                        isCompleted && match.winnerHallId === match.awayHallId ? 'text-green-400' : 'text-gray-300'
                      }`}>
                        {match.awayScore}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge 
                      variant={isCompleted ? "default" : "secondary"}
                      className={isCompleted ? "bg-green-600/20 text-green-400" : ""}
                    >
                      {match.status.toUpperCase()}
                    </Badge>
                    
                    <div className="text-sm text-gray-400 mt-2">
                      Stake: ${(match.stake / 100).toLocaleString()}
                    </div>
                    
                    {match.scheduledDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(match.scheduledDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                {match.notes && (
                  <div className="mt-4 p-3 bg-black/20 rounded-lg">
                    <p className="text-sm text-gray-300">{match.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function HallBattles() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Tabs defaultValue="standings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-felt-darker border border-neon-green/30">
          <TabsTrigger 
            value="standings" 
            className="data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green"
            data-testid="tab-hall-standings"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Hall Standings
          </TabsTrigger>
          <TabsTrigger 
            value="matches" 
            className="data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green"
            data-testid="tab-hall-matches"
          >
            <Target className="w-4 h-4 mr-2" />
            Recent Battles
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="standings" className="mt-6">
          <HallStandings />
        </TabsContent>
        
        <TabsContent value="matches" className="mt-6">
          <RecentMatches />
        </TabsContent>
      </Tabs>
    </div>
  );
}