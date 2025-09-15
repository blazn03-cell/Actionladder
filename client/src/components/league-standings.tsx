import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Trophy, Users, Target, TrendingUp, Crown, Medal, Award, Calendar, MapPin } from "lucide-react";

interface TeamRoster {
  id: string;
  playerId: string;
  hallId: string;
  position: string;
  isActive: boolean;
  player: {
    id: string;
    name: string;
    rating: number;
    theme?: string;
  };
}

interface HallStats {
  id: string;
  name: string;
  city: string;
  wins: number;
  losses: number;
  points: number;
  description: string;
  address?: string;
  phone?: string;
  active: boolean;
  battlesUnlocked: boolean;
  roster: TeamRoster[];
  recentMatches: HallMatch[];
  averageRating: number;
  totalRacks: number;
  winPercentage: number;
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
  entryFee: number;
  homeHall: HallStats;
  awayHall: HallStats;
}

interface LeagueSeason {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: "upcoming" | "active" | "completed";
  totalMatches: number;
  completedMatches: number;
  prizePool: number;
}

function SeasonSelector() {
  const { data: seasons = [] } = useQuery<LeagueSeason[]>({
    queryKey: ["/api/league/seasons"],
  });

  const currentSeason = seasons.find(s => s.status === 'active') || seasons[0];

  return (
    <div className="flex items-center space-x-4 mb-6">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-white">League Season: {currentSeason?.name || "Off-season"}</h2>
        {currentSeason && (
          <div className="flex items-center space-x-4 mt-2">
            <Badge className={`${
              currentSeason.status === 'active' ? 'bg-green-600/20 text-green-400 border-green-500/30' :
              currentSeason.status === 'upcoming' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' :
              'bg-gray-600/20 text-gray-400 border-gray-500/30'
            }`}>
              {currentSeason.status.charAt(0).toUpperCase() + currentSeason.status.slice(1)}
            </Badge>
            <span className="text-gray-400 text-sm">
              {currentSeason.completedMatches}/{currentSeason.totalMatches} matches completed
            </span>
            <div className="text-green-400 font-semibold">
              ${currentSeason.prizePool.toLocaleString()} prize pool
            </div>
          </div>
        )}
      </div>
      {currentSeason && currentSeason.status === 'active' && (
        <div className="text-right">
          <div className="text-sm text-gray-400">Season Progress</div>
          <Progress value={(currentSeason.completedMatches / currentSeason.totalMatches) * 100} className="w-32 mt-1" />
        </div>
      )}
    </div>
  );
}

function StandingsTable() {
  const { data: standings = [], isLoading } = useQuery<HallStats[]>({
    queryKey: ["/api/league/standings"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const sortedStandings = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.winPercentage - a.winPercentage;
  });

  return (
    <div className="space-y-4">
      {sortedStandings.map((hall, index) => {
        const rank = index + 1;
        const totalMatches = hall.wins + hall.losses;
        return (
          <Card key={hall.id} className={`bg-black/60 backdrop-blur-sm border transition-all hover:shadow-xl ${
            rank === 1 ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20' :
            rank === 2 ? 'border-gray-400/50 shadow-lg shadow-gray-400/20' :
            rank === 3 ? 'border-amber-600/50 shadow-lg shadow-amber-600/20' :
            'border-green-500/30'
          }`} data-testid={`league-standings-${hall.id}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl ${
                    rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                    rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                    rank === 3 ? 'bg-amber-600/20 text-amber-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {rank === 1 ? <Crown className="w-8 h-8" /> :
                     rank === 2 ? <Medal className="w-8 h-8" /> :
                     rank === 3 ? <Award className="w-8 h-8" /> :
                     `#${rank}`}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{hall.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {hall.city}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {hall.roster.filter(r => r.isActive).length} active players
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{hall.points}</div>
                  <div className="text-sm text-gray-400">points</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {hall.wins}-{hall.losses} ({hall.winPercentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function LeagueStandings() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const { data: halls = [] } = useQuery<HallStats[]>({
    queryKey: ["/api/league/standings"],
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">ACTIONLADDER POOL LEAGUE</h1>
        <p className="text-gray-400">Official Hall vs Hall Competition</p>
        <div className="text-sm text-green-400 mt-1">Seguin • New Braunfels • San Marcos</div>
      </div>

      <SeasonSelector />

      <Tabs defaultValue="standings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-black/50">
          <TabsTrigger value="standings" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            League Standings
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standings">
          <StandingsTable />
        </TabsContent>

        <TabsContent value="schedule">
          <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-green-400" />
                Upcoming League Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No upcoming matches scheduled</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}