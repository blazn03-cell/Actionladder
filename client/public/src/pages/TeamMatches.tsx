import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Swords, 
  Eye, 
  EyeOff, 
  Crown, 
  Target, 
  Plus, 
  Calendar,
  Trophy,
  Zap,
  AlertTriangle
} from "lucide-react";
import type { TeamMatch, Team, TeamPlayer, TeamSet } from "@shared/schema";

export default function TeamMatches() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOperatorId, setSelectedOperatorId] = useState("");
  const [isCreateMatchOpen, setIsCreateMatchOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState("");

  // Get team matches for selected operator
  const { data: teamMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/team-matches", selectedOperatorId],
    enabled: !!selectedOperatorId,
    queryFn: () => apiRequest(`/api/team-matches?operatorId=${selectedOperatorId}`),
  });

  // Get teams for creating matches
  const { data: teams } = useQuery({
    queryKey: ["/api/teams", selectedOperatorId],
    enabled: !!selectedOperatorId,
    queryFn: () => apiRequest(`/api/teams?operatorId=${selectedOperatorId}`),
  });

  // Create team match mutation
  const createMatchMutation = useMutation({
    mutationFn: (matchData: any) => apiRequest("/api/team-matches", { method: "POST", body: JSON.stringify(matchData) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-matches"] });
      setIsCreateMatchOpen(false);
      toast({
        title: "Team Match Created",
        description: "New team match has been scheduled",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create team match",
        variant: "destructive",
      });
    },
  });

  // Reveal lineup mutation
  const revealLineupMutation = useMutation({
    mutationFn: ({ matchId, side }: { matchId: string; side: string }) => 
      apiRequest(`/api/team-matches/${matchId}/reveal-lineup`, { 
        method: "POST", 
        body: JSON.stringify({ side }) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-matches"] });
      toast({
        title: "Lineup Revealed",
        description: "Team lineup has been revealed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reveal lineup",
        variant: "destructive",
      });
    },
  });

  // Captain's burden trigger mutation
  const triggerCaptainBurdenMutation = useMutation({
    mutationFn: ({ matchId, teamId }: { matchId: string; teamId: string }) => 
      apiRequest(`/api/team-matches/${matchId}/trigger-captain-burden`, { 
        method: "POST", 
        body: JSON.stringify({ teamId }) 
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Captain's Burden",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process captain's burden",
        variant: "destructive",
      });
    },
  });

  const handleCreateMatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const homeTeam = teams?.find((t: Team) => t.id === formData.get("homeTeamId"));
    const awayTeam = teams?.find((t: Team) => t.id === formData.get("awayTeamId"));
    
    if (!homeTeam || !awayTeam) {
      toast({
        title: "Error",
        description: "Please select valid home and away teams",
        variant: "destructive",
      });
      return;
    }

    if (homeTeam.teamType !== awayTeam.teamType) {
      toast({
        title: "Error", 
        description: "Teams must be the same type (3-man vs 3-man, 5-man vs 5-man)",
        variant: "destructive",
      });
      return;
    }
    
    const matchData = {
      homeTeamId: formData.get("homeTeamId"),
      awayTeamId: formData.get("awayTeamId"),
      operatorId: selectedOperatorId,
      maxSets: homeTeam.teamType === "3man" ? 3 : 5,
      scheduledAt: formData.get("scheduledAt") ? new Date(formData.get("scheduledAt") as string) : null,
      moneyBallActive: formData.get("moneyBall") === "on",
    };
    
    createMatchMutation.mutate(matchData);
  };

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return "Unknown Team";
    const team = (teams as Team[])?.find((t: Team) => t.id === teamId);
    return team?.name || "Unknown Team";
  };

  const getMatchStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled": return <Badge variant="outline">Scheduled</Badge>;
      case "in_progress": return <Badge className="bg-yellow-600">In Progress</Badge>;
      case "completed": return <Badge className="bg-green-600">Completed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-400 mb-2">Team Matches</h1>
        <p className="text-gray-400">Manage team division matches with put-up rules and special mechanics</p>
      </div>

      {/* Operator Selection */}
      <Card className="mb-6 bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-green-400">Select Pool Hall Operator</CardTitle>
          <CardDescription>Choose an operator to manage their team matches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="operator-select">Operator</Label>
              <Input
                id="operator-select"
                placeholder="Enter operator ID"
                value={selectedOperatorId}
                onChange={(e) => setSelectedOperatorId(e.target.value)}
                className="bg-gray-800 border-gray-600"
                data-testid="input-operator-id"
              />
            </div>
            <Button 
              onClick={() => setSelectedOperatorId("")}
              variant="outline"
              className="mt-6"
              data-testid="button-clear-operator"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedOperatorId && (
        <>
          {/* Create Match Button */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-green-400">Scheduled Matches</h2>
            <Dialog open={isCreateMatchOpen} onOpenChange={setIsCreateMatchOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700" data-testid="button-create-match">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Match
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-green-400">Schedule Team Match</DialogTitle>
                  <DialogDescription>
                    Create a new team division match with special rules
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateMatch} className="space-y-4">
                  <div>
                    <Label htmlFor="homeTeamId">Home Team</Label>
                    <Select name="homeTeamId" required>
                      <SelectTrigger className="bg-gray-800 border-gray-600" data-testid="select-home-team">
                        <SelectValue placeholder="Select home team" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {teams?.map((team: Team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name} ({team.teamType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="awayTeamId">Away Team</Label>
                    <Select name="awayTeamId" required>
                      <SelectTrigger className="bg-gray-800 border-gray-600" data-testid="select-away-team">
                        <SelectValue placeholder="Select away team" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {teams?.map((team: Team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name} ({team.teamType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="scheduledAt">Match Date & Time</Label>
                    <Input
                      id="scheduledAt"
                      name="scheduledAt"
                      type="datetime-local"
                      className="bg-gray-800 border-gray-600"
                      data-testid="input-match-datetime"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="moneyBall"
                      name="moneyBall"
                      className="w-4 h-4"
                      data-testid="checkbox-money-ball"
                    />
                    <Label htmlFor="moneyBall" className="text-sm">
                      Enable Money Ball ($20 bonus pot for deciding set)
                    </Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateMatchOpen(false)}
                      data-testid="button-cancel-match"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMatchMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-submit-match"
                    >
                      {createMatchMutation.isPending ? "Scheduling..." : "Schedule Match"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Team Matches Grid */}
          {matchesLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading matches...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(teamMatches as TeamMatch[])?.map((match: TeamMatch) => (
                <TeamMatchCard
                  key={match.id}
                  match={match}
                  teams={teams}
                  onRevealLineup={(matchId, side) => revealLineupMutation.mutate({ matchId, side })}
                  onTriggerCaptainBurden={(matchId, teamId) => 
                    triggerCaptainBurdenMutation.mutate({ matchId, teamId })
                  }
                />
              ))}
            </div>
          )}

          {(teamMatches as TeamMatch[])?.length === 0 && (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="py-8 text-center">
                <Swords className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <p className="text-gray-400 mb-4">No team matches scheduled</p>
                <Button
                  onClick={() => setIsCreateMatchOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-create-first-match"
                >
                  Schedule First Match
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function TeamMatchCard({ 
  match, 
  teams, 
  onRevealLineup, 
  onTriggerCaptainBurden 
}: { 
  match: TeamMatch;
  teams: Team[];
  onRevealLineup: (matchId: string, side: string) => void;
  onTriggerCaptainBurden: (matchId: string, teamId: string) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Get team sets for this match
  const { data: teamSets } = useQuery({
    queryKey: ["/api/team-sets", match.id],
    enabled: showDetails,
    queryFn: () => apiRequest(`/api/team-sets?teamMatchId=${match.id}`),
  });

  const homeTeam = (teams as Team[])?.find(t => t.id === match.homeTeamId);
  const awayTeam = (teams as Team[])?.find(t => t.id === match.awayTeamId);

  const getMatchTypeDisplay = () => {
    if (!homeTeam) return "Unknown";
    return homeTeam.teamType === "3man" ? "3-Man Match" : "5-Man Match";
  };

  const isMatchComplete = match.status === "completed";
  const isHillHill = match.isHillHill;
  const hasMoneyBall = match.moneyBallActive;

  return (
    <Card className="bg-gray-900 border-gray-700" data-testid={`card-match-${match.id}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <Swords className="h-5 w-5" />
              {homeTeam?.name || "Home"} vs {awayTeam?.name || "Away"}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              {getMatchTypeDisplay()}
              {hasMoneyBall && <Badge className="bg-yellow-600">Money Ball</Badge>}
              {isHillHill && <Badge className="bg-red-600">Hill-Hill</Badge>}
            </CardDescription>
          </div>
          {getMatchStatusBadge(match.status || "scheduled")}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Score Display */}
          <div className="text-center">
            <div className="flex justify-center items-center gap-4 text-3xl font-bold">
              <span className="text-blue-400">{match.homeScore}</span>
              <span className="text-gray-500">-</span>
              <span className="text-red-400">{match.awayScore}</span>
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Set {match.currentSet} of {match.maxSets}
            </div>
          </div>

          {/* Special Rules Indicators */}
          <div className="flex flex-wrap gap-2 justify-center">
            {match.putUpRound && (
              <Badge variant="outline" className="text-purple-400">
                {match.putUpRound === "best_vs_best" ? "Best vs Best" : "Worst vs Worst"}
              </Badge>
            )}
            {homeTeam?.captainForcedNext && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Home Captain Burden
              </Badge>
            )}
            {awayTeam?.captainForcedNext && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Away Captain Burden
              </Badge>
            )}
          </div>

          <Separator className="bg-gray-700" />

          {/* Lineup Status */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Home Lineup:</span>
              <div className="flex items-center gap-2">
                {match.homeLineupRevealed ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Revealed
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <EyeOff className="h-3 w-3" />
                      Secret
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRevealLineup(match.id, "home")}
                      data-testid={`button-reveal-home-${match.id}`}
                    >
                      Reveal
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Away Lineup:</span>
              <div className="flex items-center gap-2">
                {match.awayLineupRevealed ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Revealed
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <EyeOff className="h-3 w-3" />
                      Secret
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRevealLineup(match.id, "away")}
                      data-testid={`button-reveal-away-${match.id}`}
                    >
                      Reveal
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Match Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="flex-1"
              data-testid={`button-toggle-details-${match.id}`}
            >
              {showDetails ? "Hide Details" : "Show Details"}
            </Button>
            
            {match.status === "in_progress" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onTriggerCaptainBurden(match.id, match.homeTeamId)}
                className="text-red-400"
                data-testid={`button-captain-burden-home-${match.id}`}
              >
                <Crown className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Match Details */}
          {showDetails && (
            <div className="mt-4 space-y-4 border-t border-gray-700 pt-4">
              <div className="text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Home Team:</span>
                    <div className="font-medium">{homeTeam?.name}</div>
                    <div className="text-xs text-gray-500">
                      {homeTeam?.seasonWins}W - {homeTeam?.seasonLosses}L
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Away Team:</span>
                    <div className="font-medium">{awayTeam?.name}</div>
                    <div className="text-xs text-gray-500">
                      {awayTeam?.seasonWins}W - {awayTeam?.seasonLosses}L
                    </div>
                  </div>
                </div>
              </div>

              {match.scheduledAt && (
                <div className="text-sm">
                  <span className="text-gray-400">Scheduled:</span>
                  <div>{new Date(match.scheduledAt).toLocaleString()}</div>
                </div>
              )}

              {hasMoneyBall && (
                <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Zap className="h-4 w-4" />
                    <span className="font-semibold">Money Ball Active</span>
                  </div>
                  <div className="text-yellow-300 text-sm">
                    ${((match.moneyBallAmount || 0) / 100).toFixed(0)} bonus pot for deciding set
                  </div>
                </div>
              )}

              {/* Individual Sets */}
              {(teamSets as TeamSet[])?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-400 mb-2">Sets</h4>
                  <div className="space-y-2">
                    {(teamSets as TeamSet[]).map((set: TeamSet) => (
                      <div 
                        key={set.id} 
                        className="flex justify-between items-center p-2 bg-gray-800 rounded"
                        data-testid={`set-${set.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Set {set.setNumber}</Badge>
                          {set.isPutUpSet && (
                            <Badge className="bg-purple-600">
                              {set.putUpType === "best_vs_best" ? "Best vs Best" : "Worst vs Worst"}
                            </Badge>
                          )}
                          {set.isMoneyBallSet && (
                            <Badge className="bg-yellow-600">
                              <Zap className="h-3 w-3 mr-1" />
                              Money Ball
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm">
                          {set.status === "completed" ? (
                            <Badge className="bg-green-600">
                              <Trophy className="h-3 w-3 mr-1" />
                              Complete
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{set.status}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getMatchStatusBadge(status: string) {
  switch (status) {
    case "scheduled": return <Badge variant="outline">Scheduled</Badge>;
    case "in_progress": return <Badge className="bg-yellow-600">In Progress</Badge>;
    case "completed": return <Badge className="bg-green-600">Completed</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}