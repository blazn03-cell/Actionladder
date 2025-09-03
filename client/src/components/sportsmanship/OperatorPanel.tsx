import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  UserX, 
  UserCheck,
  X,
  CheckCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface OperatorPanelProps {
  sessionId: string;
  venueId: string;
  operatorId: string;
}

interface VoteWeights {
  totalWeight: number;
  outWeight: number;
  keepWeight: number;
}

export default function OperatorPanel({ sessionId, venueId, operatorId }: OperatorPanelProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [activeVoteWeights, setActiveVoteWeights] = useState<Record<string, VoteWeights>>({});
  
  const queryClient = useQueryClient();

  // Fetch active votes
  const { data: activeVotes = [], refetch: refetchVotes } = useQuery({
    queryKey: [`/api/attitude-votes/active/${sessionId}/${venueId}`],
    refetchInterval: 2000, // Poll every 2 seconds for live updates
  });

  // Fetch recent incidents
  const { data: recentIncidents = [] } = useQuery({
    queryKey: [`/api/incidents/recent/${venueId}?hours=24`],
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Fetch active check-ins for eligible voters
  const { data: activeCheckins = [] } = useQuery({
    queryKey: [`/api/checkins/session/${sessionId}`],
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Create new vote mutation
  const createVote = useMutation({
    mutationFn: async (voteData: any) => {
      return apiRequest("/api/attitude-votes", {
        method: "POST",
        body: JSON.stringify(voteData),
      });
    },
    onSuccess: () => {
      refetchVotes();
      setSelectedUserId("");
      setSelectedUserName("");
    },
  });

  // Force close vote mutation
  const closeVote = useMutation({
    mutationFn: async (voteId: string) => {
      return apiRequest(`/api/attitude-votes/${voteId}/close`, {
        method: "POST",
        body: JSON.stringify({ operatorId }),
      });
    },
    onSuccess: () => {
      refetchVotes();
    },
  });

  // Mock user list (in real app, this would come from API)
  const mockUsers = [
    { id: "user1", name: "Johnny Pool" },
    { id: "user2", name: "Sarah Striker" },
    { id: "user3", name: "Mike Cannon" },
    { id: "user4", name: "Lisa Sharp" },
  ];

  // Calculate total eligible voting weight
  const totalEligibleWeight = activeCheckins.reduce((sum: number, checkin: any) => {
    let weight = 0.5; // attendee
    if (checkin.role === "player") weight = 1.0;
    if (checkin.role === "operator") weight = 2.0;
    return sum + weight;
  }, 0);

  const handleStartVote = () => {
    if (!selectedUserId) return;
    
    createVote.mutate({
      targetUserId: selectedUserId,
      sessionId,
      venueId,
      endsInSec: 90,
      createdBy: operatorId,
    });
  };

  const formatTimeRemaining = (remainingSeconds: number) => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculatePercentage = (weight: number, total: number) => {
    return total > 0 ? Math.round((weight / total) * 100) : 0;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Sportsmanship Operator Panel</h1>
        <p className="text-gray-300">Real-time vote management and incident tracking</p>
      </div>

      {/* Current Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{activeCheckins.length}</div>
            <div className="text-sm text-gray-400">Checked In</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{totalEligibleWeight.toFixed(1)}</div>
            <div className="text-sm text-gray-400">Total Vote Weight</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{activeVotes.length}</div>
            <div className="text-sm text-gray-400">Active Votes</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <ShieldCheck className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{recentIncidents.length}</div>
            <div className="text-sm text-gray-400">Today's Incidents</div>
          </CardContent>
        </Card>
      </div>

      {/* Start New Vote */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-emerald-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Start Sportsmanship Vote
          </CardTitle>
          <CardDescription className="text-gray-300">
            Open a community vote on player behavior (use after direct warning unless severe)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetUser" className="text-white">Select Player</Label>
              <Select value={selectedUserId} onValueChange={(value) => {
                setSelectedUserId(value);
                const user = mockUsers.find(u => u.id === value);
                setSelectedUserName(user?.name || "");
              }}>
                <SelectTrigger data-testid="select-target-user" className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Choose player to vote on" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {mockUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id} className="text-white">
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Vote Duration</Label>
              <div className="p-2 bg-gray-700 rounded border border-gray-600 text-gray-300">
                90 seconds (standard)
              </div>
            </div>
          </div>

          <Button
            data-testid="button-start-vote"
            onClick={handleStartVote}
            disabled={!selectedUserId || createVote.isPending}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {createVote.isPending ? "Starting Vote..." : "Start Sportsmanship Vote"}
          </Button>
        </CardContent>
      </Card>

      {/* Active Votes Management */}
      {activeVotes.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Votes ({activeVotes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeVotes.map((vote: any) => {
              const outWeight = activeVoteWeights[vote.id]?.outWeight || 0;
              const keepWeight = activeVoteWeights[vote.id]?.keepWeight || 0;
              const totalWeight = outWeight + keepWeight;
              const quorumProgress = totalWeight > 0 ? (totalWeight / vote.quorumRequired) * 100 : 0;
              const outPercentage = calculatePercentage(outWeight, totalWeight);
              
              return (
                <div key={vote.id} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-white">
                        Voting on: {selectedUserName || 'Player'}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {formatTimeRemaining(vote.remainingSeconds || 0)} remaining
                      </p>
                    </div>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-300">
                      LIVE
                    </Badge>
                  </div>

                  {/* Vote Results */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-red-900/30 rounded border border-red-600">
                      <UserX className="h-6 w-6 text-red-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-red-300">{outWeight.toFixed(1)}</div>
                      <div className="text-sm text-gray-400">Vote Out ({outPercentage}%)</div>
                    </div>
                    <div className="text-center p-3 bg-green-900/30 rounded border border-green-600">
                      <UserCheck className="h-6 w-6 text-green-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-green-300">{keepWeight.toFixed(1)}</div>
                      <div className="text-sm text-gray-400">Keep In ({100 - outPercentage}%)</div>
                    </div>
                  </div>

                  {/* Quorum Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Quorum Progress</span>
                      <span className="text-white">{totalWeight.toFixed(1)} / {vote.quorumRequired.toFixed(1)}</span>
                    </div>
                    <Progress 
                      value={Math.min(100, quorumProgress)} 
                      className="h-2"
                    />
                    <div className="text-xs text-gray-400">
                      {quorumProgress >= 100 ? "✓ Quorum met" : "Need more votes to meet quorum"}
                    </div>
                  </div>

                  {/* Threshold Indicator */}
                  <div className="mt-3 p-2 bg-gray-600 rounded">
                    <div className="text-sm text-gray-300">
                      <strong>Pass Threshold:</strong> {(vote.thresholdRequired * 100)}% vote out required
                      {totalWeight > 0 && (
                        <span className={`ml-2 ${outPercentage >= (vote.thresholdRequired * 100) ? 'text-red-400' : 'text-gray-400'}`}>
                          ({outPercentage >= (vote.thresholdRequired * 100) ? 'WOULD PASS' : 'would not pass'})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Force Close Button */}
                  <Button
                    data-testid={`button-force-close-${vote.id}`}
                    onClick={() => closeVote.mutate(vote.id)}
                    disabled={closeVote.isPending}
                    variant="outline"
                    className="w-full mt-4 border-gray-500 text-gray-300 hover:bg-gray-600"
                  >
                    {closeVote.isPending ? "Closing..." : "Force Close Vote"}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent Incidents */}
      {recentIncidents.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-purple-400 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Recent Incidents (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentIncidents.slice(0, 5).map((incident: any) => (
                <div key={incident.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div>
                    <div className="font-medium text-white">
                      {incident.type === "ejection" ? "Player Ejected" : incident.type}
                    </div>
                    <div className="text-sm text-gray-400">{incident.details}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(incident.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}