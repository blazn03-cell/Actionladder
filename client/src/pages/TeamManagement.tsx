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
import { Users, Crown, Shield, Plus, UserPlus, Trash2 } from "lucide-react";
import type { Team, TeamPlayer, Player } from "@shared/schema";

export default function TeamManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOperatorId, setSelectedOperatorId] = useState("");
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");

  // Get teams for selected operator
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams", selectedOperatorId],
    enabled: !!selectedOperatorId,
    queryFn: () => apiRequest(`/api/teams?operatorId=${selectedOperatorId}`),
  });

  // Get all players for roster management
  const { data: players } = useQuery({
    queryKey: ["/api/players"],
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: (teamData: any) => apiRequest("/api/teams", { method: "POST", body: JSON.stringify(teamData) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsCreateTeamOpen(false);
      toast({
        title: "Team Created",
        description: "New team has been successfully created",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      });
    },
  });

  // Add player to team mutation
  const addPlayerMutation = useMutation({
    mutationFn: (playerData: any) => apiRequest("/api/team-players", { method: "POST", body: JSON.stringify(playerData) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-players"] });
      setIsAddPlayerOpen(false);
      toast({
        title: "Player Added",
        description: "Player successfully added to team",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add player to team",
        variant: "destructive",
      });
    },
  });

  // Remove player from team mutation
  const removePlayerMutation = useMutation({
    mutationFn: (playerId: string) => apiRequest(`/api/team-players/${playerId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-players"] });
      toast({
        title: "Player Removed",
        description: "Player removed from team",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove player",
        variant: "destructive",
      });
    },
  });

  const handleCreateTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const teamData = {
      name: formData.get("teamName"),
      operatorId: selectedOperatorId,
      hallId: formData.get("hallId") || null,
      captainId: formData.get("captainId"),
      teamType: formData.get("teamType"),
    };
    
    createTeamMutation.mutate(teamData);
  };

  const handleAddPlayer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const playerData = {
      teamId: selectedTeamId,
      playerId: formData.get("playerId"),
      role: formData.get("role"),
      position: formData.get("position") ? parseInt(formData.get("position") as string) : null,
    };
    
    addPlayerMutation.mutate(playerData);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "captain": return <Crown className="h-4 w-4 text-yellow-500" />;
      case "substitute": return <Shield className="h-4 w-4 text-blue-500" />;
      default: return <Users className="h-4 w-4 text-green-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "captain": return "default";
      case "substitute": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-400 mb-2">Team Management</h1>
        <p className="text-gray-400">Manage your 3-man and 5-man team divisions</p>
      </div>

      {/* Operator Selection */}
      <Card className="mb-6 bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-green-400">Select Pool Hall Operator</CardTitle>
          <CardDescription>Choose an operator to manage their teams</CardDescription>
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
          {/* Create Team Button */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-green-400">Teams</h2>
            <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700" data-testid="button-create-team">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-green-400">Create New Team</DialogTitle>
                  <DialogDescription>
                    Add a new 3-man or 5-man team to the division
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div>
                    <Label htmlFor="teamName">Team Name</Label>
                    <Input
                      id="teamName"
                      name="teamName"
                      required
                      placeholder="Enter team name"
                      className="bg-gray-800 border-gray-600"
                      data-testid="input-team-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="teamType">Team Type</Label>
                    <Select name="teamType" required>
                      <SelectTrigger className="bg-gray-800 border-gray-600" data-testid="select-team-type">
                        <SelectValue placeholder="Select team type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="3man">3-Man Team</SelectItem>
                        <SelectItem value="5man">5-Man Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="captainId">Team Captain</Label>
                    <Select name="captainId" required>
                      <SelectTrigger className="bg-gray-800 border-gray-600" data-testid="select-captain">
                        <SelectValue placeholder="Select team captain" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {(players as Player[])?.map((player: Player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name} (Rating: {player.rating})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="hallId">Pool Hall (Optional)</Label>
                    <Input
                      id="hallId"
                      name="hallId"
                      placeholder="Pool hall ID"
                      className="bg-gray-800 border-gray-600"
                      data-testid="input-hall-id"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateTeamOpen(false)}
                      data-testid="button-cancel-team"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTeamMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-submit-team"
                    >
                      {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Teams Grid */}
          {teamsLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading teams...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(teams as Team[])?.map((team: Team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  players={players as Player[]}
                  onAddPlayer={(teamId) => {
                    setSelectedTeamId(teamId);
                    setIsAddPlayerOpen(true);
                  }}
                  onRemovePlayer={(playerId) => removePlayerMutation.mutate(playerId)}
                />
              ))}
            </div>
          )}

          {(teams as Team[])?.length === 0 && (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="py-8 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <p className="text-gray-400 mb-4">No teams found for this operator</p>
                <Button
                  onClick={() => setIsCreateTeamOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-create-first-team"
                >
                  Create First Team
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add Player Dialog */}
      <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-green-400">Add Player to Team</DialogTitle>
            <DialogDescription>
              Add a new player or substitute to the team roster
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPlayer} className="space-y-4">
            <div>
              <Label htmlFor="playerId">Player</Label>
              <Select name="playerId" required>
                <SelectTrigger className="bg-gray-800 border-gray-600" data-testid="select-add-player">
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {(players as Player[])?.map((player: Player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} (Rating: {player.rating})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select name="role" required>
                <SelectTrigger className="bg-gray-800 border-gray-600" data-testid="select-player-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="player">Regular Player</SelectItem>
                  <SelectItem value="substitute">Substitute</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="position">Lineup Position (Optional)</Label>
              <Input
                id="position"
                name="position"
                type="number"
                min="1"
                max="5"
                placeholder="1-5"
                className="bg-gray-800 border-gray-600"
                data-testid="input-player-position"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddPlayerOpen(false)}
                data-testid="button-cancel-add-player"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addPlayerMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-submit-add-player"
              >
                {addPlayerMutation.isPending ? "Adding..." : "Add Player"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeamCard({ 
  team, 
  players, 
  onAddPlayer, 
  onRemovePlayer 
}: { 
  team: Team;
  players: Player[];
  onAddPlayer: (teamId: string) => void;
  onRemovePlayer: (playerId: string) => void;
}) {
  const [showRoster, setShowRoster] = useState(false);
  
  // Get team players
  const { data: teamPlayers } = useQuery({
    queryKey: ["/api/team-players", team.id],
    queryFn: () => apiRequest(`/api/team-players?teamId=${team.id}`),
  });

  const getPlayerName = (playerId: string) => {
    const player = players?.find(p => p.id === playerId);
    return player?.name || "Unknown Player";
  };

  const getPlayerRating = (playerId: string) => {
    const player = players?.find(p => p.id === playerId);
    return player?.rating || 0;
  };

  return (
    <Card className="bg-gray-900 border-gray-700" data-testid={`card-team-${team.id}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-green-400 flex items-center gap-2">
              {getRoleIcon(team.teamType)}
              {team.name}
            </CardTitle>
            <CardDescription>
              {team.teamType === "3man" ? "3-Man Team" : "5-Man Team"}
            </CardDescription>
          </div>
          <Badge variant={team.status === "active" ? "default" : "secondary"}>
            {team.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Team Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{team.seasonWins}</div>
              <div className="text-xs text-gray-400">Wins</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{team.seasonLosses}</div>
              <div className="text-xs text-gray-400">Losses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{team.ladderPoints}</div>
              <div className="text-xs text-gray-400">Points</div>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Team Composition */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Players:</span>
            <span className="text-green-400">{team.currentPlayers}/{team.maxPlayers}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Subs:</span>
            <span className="text-blue-400">{team.currentSubs}/{team.maxSubs}</span>
          </div>

          {/* Captain's Burden Warning */}
          {team.captainForcedNext && (
            <div className="p-2 bg-red-900/20 border border-red-700 rounded">
              <div className="text-red-400 text-sm font-semibold">Captain's Burden Active</div>
              <div className="text-red-300 text-xs">Captain must play first next match</div>
            </div>
          )}

          {/* Roster Management */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRoster(!showRoster)}
              className="flex-1"
              data-testid={`button-toggle-roster-${team.id}`}
            >
              {showRoster ? "Hide Roster" : "Show Roster"}
            </Button>
            <Button
              onClick={() => onAddPlayer(team.id)}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              data-testid={`button-add-player-${team.id}`}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>

          {/* Roster Display */}
          {showRoster && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-green-400">Team Roster</h4>
              {(teamPlayers as TeamPlayer[])?.map((teamPlayer: TeamPlayer) => (
                <div 
                  key={teamPlayer.id} 
                  className="flex items-center justify-between p-2 bg-gray-800 rounded"
                  data-testid={`roster-player-${teamPlayer.id}`}
                >
                  <div className="flex items-center gap-2">
                    {getRoleIcon(teamPlayer.role)}
                    <div>
                      <div className="font-medium">{getPlayerName(teamPlayer.playerId)}</div>
                      <div className="text-xs text-gray-400">
                        Rating: {getPlayerRating(teamPlayer.playerId)} • 
                        Record: {teamPlayer.seasonWins}W-{teamPlayer.seasonLosses}L
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={teamPlayer.role === "captain" ? "default" : teamPlayer.role === "substitute" ? "secondary" : "outline"}>
                      {teamPlayer.role}
                    </Badge>
                    {teamPlayer.position && (
                      <Badge variant="outline">#{teamPlayer.position}</Badge>
                    )}
                    {teamPlayer.role !== "captain" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemovePlayer(teamPlayer.id)}
                        className="text-red-400 hover:text-red-300"
                        data-testid={`button-remove-player-${teamPlayer.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getRoleIcon(teamType: string) {
  return teamType === "3man" ? 
    <Users className="h-5 w-5 text-green-400" /> : 
    <Shield className="h-5 w-5 text-blue-400" />;
}