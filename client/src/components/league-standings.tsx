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
  stake: number;
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
          <Progress 
            value={(currentSeason.completedMatches / currentSeason.totalMatches) * 100} 
            className="w-32 mt-1"
          />
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
    // Sort by points first, then by win percentage
    if (b.points !== a.points) return b.points - a.points;
    return b.winPercentage - a.winPercentage;
  });

  return (
    <div className="space-y-4">
      {sortedStandings.map((hall, index) => {
        const rank = index + 1;
        const totalMatches = hall.wins + hall.losses;
        
        return (
          <Card 
            key={hall.id} 
            className={`bg-black/60 backdrop-blur-sm border transition-all hover:shadow-xl ${
              rank === 1 ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20' :
              rank === 2 ? 'border-gray-400/50 shadow-lg shadow-gray-400/20' :
              rank === 3 ? 'border-amber-600/50 shadow-lg shadow-amber-600/20' :
              'border-green-500/30'
            }`}
            data-testid={`league-standings-${hall.id}`}
          >
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
                     rank === 3 ? <Award className="w-8 h-8" /> : `#${rank}`}
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
                      <span>Avg Rating: {hall.averageRating}</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{hall.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-400">{hall.points}</div>
                    <div className="text-xs text-gray-400">Points</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-white">{hall.wins}-{hall.losses}</div>
                    <div className="text-xs text-gray-400">W-L Record</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-blue-400">{hall.winPercentage.toFixed(1)}%</div>
                    <div className="text-xs text-gray-400">Win Rate</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-purple-400">{hall.totalRacks}</div>
                    <div className="text-xs text-gray-400">Total Racks</div>
                  </div>
                </div>
              </div>
              
              {/* Recent Performance */}
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">Recent Matches:</div>
                  <div className="flex space-x-1">
                    {hall.recentMatches.slice(0, 5).map((match, idx) => {
                      const won = match.winnerHallId === hall.id;
                      return (
                        <div
                          key={idx}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {won ? 'W' : 'L'}
                        </div>
                      );
                    })}
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

function TeamRosterCard({ hall }: { hall: HallStats }) {
  const activeRoster = hall.roster.filter(r => r.isActive);
  const inactiveRoster = hall.roster.filter(r => !r.isActive);

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Users className="w-5 h-5 mr-2 text-green-400" />
          {hall.name} Roster
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active">
          <TabsList className="grid w-full grid-cols-2 bg-black/50">
            <TabsTrigger value="active">Active ({activeRoster.length})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({inactiveRoster.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-3 mt-4">
            {activeRoster.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No active players on this team
              </div>
            ) : (
              activeRoster.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-green-900/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <div>
                      <div className="font-semibold text-white">{member.player.name}</div>
                      <div className="text-sm text-gray-400">
                        {member.position} • {member.player.rating} Fargo
                      </div>
                      {member.player.theme && (
                        <div className="text-xs text-gray-500 italic">"{member.player.theme}"</div>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                    Active
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="inactive" className="space-y-3 mt-4">
            {inactiveRoster.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No inactive players
              </div>
            ) : (
              inactiveRoster.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-900/10 border border-gray-500/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <div>
                      <div className="font-semibold text-gray-300">{member.player.name}</div>
                      <div className="text-sm text-gray-500">
                        {member.position} • {member.player.rating} Fargo
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-gray-600/20 text-gray-400 border-gray-500/30">
                    Inactive
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function UpcomingMatches() {
  const { data: upcomingMatches = [] } = useQuery<HallMatch[]>({
    queryKey: ["/api/league/upcoming-matches"],
  });

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-green-400" />
          Upcoming League Matches
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingMatches.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No upcoming matches scheduled</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingMatches.map((match) => (
              <div key={match.id} className="border border-gray-600/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-white font-semibold">
                    {match.homeHall.name} vs {match.awayHall.name}
                  </div>
                  <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                    ${(match.stake / 100).toLocaleString()} Stake
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                  <div>Format: {match.format}</div>
                  <div>Racks: {match.totalRacks}</div>
                </div>
                {match.scheduledDate && (
                  <div className="text-sm text-gray-500 mt-2">
                    Scheduled: {new Date(match.scheduledDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LeagueStats() {
  const { data: stats } = useQuery({
    queryKey: ["/api/league/stats"],
  });

  const leagueStats = stats as any || {
    totalHalls: 0,
    totalPlayers: 0,
    totalMatches: 0,
    totalPrizePool: 0,
    avgMatchStake: 0,
    topHall: null,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{leagueStats.totalHalls}</div>
          <div className="text-xs text-gray-400">Pool Halls</div>
        </CardContent>
      </Card>
      <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{leagueStats.totalPlayers}</div>
          <div className="text-xs text-gray-400">League Players</div>
        </CardContent>
      </Card>
      <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{leagueStats.totalMatches}</div>
          <div className="text-xs text-gray-400">Total Matches</div>
        </CardContent>
      </Card>
      <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">${leagueStats.totalPrizePool.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Prize Pool</div>
        </CardContent>
      </Card>
      <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">${leagueStats.avgMatchStake.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Avg Stake</div>
        </CardContent>
      </Card>
      <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
        <CardContent className="p-4 text-center">
          <Crown className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
          <div className="text-xs text-gray-400">League Leader</div>
          <div className="text-sm font-semibold text-white">{leagueStats.topHall || "TBD"}</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LeagueStandings() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  
  const { data: halls = [] } = useQuery<HallStats[]>({
    queryKey: ["/api/league/standings"],
  });

  const selectedHall = selectedTeam ? halls.find(h => h.id === selectedTeam) : null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">ACTIONLADDER POOL LEAGUE</h1>
        <p className="text-gray-400">Official Hall vs Hall Competition</p>
        <div className="text-sm text-green-400 mt-1">Seguin • New Braunfels • San Marcos</div>
      </div>

      <SeasonSelector />
      
      <LeagueStats />

      <Tabs defaultValue="standings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-black/50">
          <TabsTrigger value="standings" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            League Standings
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team Rosters
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standings">
          <StandingsTable />
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {halls.map(hall => (
              <TeamRosterCard key={hall.id} hall={hall} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <UpcomingMatches />
        </TabsContent>
      </Tabs>
    </div>
  );
}