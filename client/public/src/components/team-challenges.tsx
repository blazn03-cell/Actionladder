import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Trophy, DollarSign, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TeamChallenge {
  id: string;
  challengingTeamId: string;
  challengeType: string;
  individualFee: number;
  totalStake: number;
  title: string;
  description?: string;
  status: string;
  acceptingTeamId?: string;
  winnerId?: string;
  operatorId: string;
  requiresProMembership: boolean;
  createdAt: string;
}

const CHALLENGE_TYPES = {
  "2man_army": { name: "2-Man Army", size: 2, emoji: "👥👥" },
  "3man_crew": { name: "3-Man Crew", size: 3, emoji: "👥👥👥" },
  "5man_squad": { name: "5-Man Squad", size: 5, emoji: "👥👥👥👥👥" }
};

export default function TeamChallenges() {
  const [challengeType, setChallengeType] = useState<string>("");
  const [individualFee, setIndividualFee] = useState<number>(60); // Default $60
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  
  const queryClient = useQueryClient();

  // Fetch team challenges
  const { data: challenges, isLoading } = useQuery({
    queryKey: ["/api/team-challenges"],
  });

  // Create team challenge mutation
  const createChallenge = useMutation({
    mutationFn: async (challengeData: any) => {
      return apiRequest("/api/team-challenges", {
        method: "POST",
        body: JSON.stringify(challengeData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-challenges"] });
      // Reset form
      setChallengeType("");
      setIndividualFee(60);
      setTitle("");
      setDescription("");
    },
  });

  // Accept challenge mutation
  const acceptChallenge = useMutation({
    mutationFn: async ({ challengeId, acceptingTeamId }: { challengeId: string; acceptingTeamId: string }) => {
      return apiRequest(`/api/team-challenges/${challengeId}/accept`, {
        method: "POST",
        body: JSON.stringify({ acceptingTeamId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-challenges"] });
    },
  });

  const handleCreateChallenge = () => {
    if (!challengeType || !title) return;

    const challengeTypeInfo = CHALLENGE_TYPES[challengeType as keyof typeof CHALLENGE_TYPES];
    const totalStake = individualFee * challengeTypeInfo.size;

    createChallenge.mutate({
      challengingTeamId: "mock-team-id", // In real app, get from selected team
      challengeType,
      individualFee: individualFee * 100, // Convert to cents
      totalStake: totalStake * 100, // Convert to cents
      title,
      description,
      operatorId: "mock-operator-id", // In real app, get from authenticated operator
      requiresProMembership: true,
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-500";
      case "accepted": return "bg-blue-500";
      case "in_progress": return "bg-yellow-500";
      case "completed": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Team Challenges</h1>
        <p className="text-gray-300">Pro Membership Required • $10 - $10,000 Range</p>
      </div>

      {/* Challenge Types Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(CHALLENGE_TYPES).map(([type, info]) => (
          <Card key={type} className="bg-gray-800 border-gray-700">
            <CardHeader className="text-center">
              <CardTitle className="text-emerald-400 flex items-center justify-center gap-2">
                <span className="text-2xl">{info.emoji}</span>
                {info.name}
              </CardTitle>
              <CardDescription className="text-gray-300">
                Team size: {info.size} players
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <Shield className="h-4 w-4" />
                  Pro Membership only
                </div>
                <div className="text-sm text-gray-400">
                  Each player puts up a challenge fee ($10 – $10,000)
                </div>
                <div className="text-sm text-emerald-400 font-semibold">
                  Total team stake = individual fee × {info.size}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Challenge Form */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-emerald-400 flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Create Team Challenge
          </CardTitle>
          <CardDescription className="text-gray-300">
            Challenge other teams to a high-stakes competition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="challengeType" className="text-white">Challenge Type</Label>
              <Select value={challengeType} onValueChange={setChallengeType}>
                <SelectTrigger data-testid="select-challenge-type" className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select challenge type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {Object.entries(CHALLENGE_TYPES).map(([type, info]) => (
                    <SelectItem key={type} value={type} className="text-white">
                      {info.emoji} {info.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="individualFee" className="text-white">Individual Fee ($)</Label>
              <Input
                id="individualFee"
                data-testid="input-individual-fee"
                type="number"
                min="10"
                max="10000"
                value={individualFee}
                onChange={(e) => setIndividualFee(Number(e.target.value))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">Challenge Title</Label>
            <Input
              id="title"
              data-testid="input-challenge-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Friday Night Showdown"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Description (Optional)</Label>
            <Input
              id="description"
              data-testid="input-challenge-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Winner takes all..."
            />
          </div>

          {challengeType && (
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold">Challenge Summary</span>
              </div>
              <div className="space-y-1 text-sm text-gray-300">
                <div>Individual Fee: {formatCurrency(individualFee * 100)}</div>
                <div>Team Size: {CHALLENGE_TYPES[challengeType as keyof typeof CHALLENGE_TYPES].size} players</div>
                <div className="text-emerald-400 font-semibold">
                  Total Team Stake: {formatCurrency(individualFee * CHALLENGE_TYPES[challengeType as keyof typeof CHALLENGE_TYPES].size * 100)}
                </div>
              </div>
            </div>
          )}

          <Button
            data-testid="button-create-challenge"
            onClick={handleCreateChallenge}
            disabled={!challengeType || !title || createChallenge.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {createChallenge.isPending ? "Creating..." : "Create Challenge"}
          </Button>
        </CardContent>
      </Card>

      {/* Active Challenges */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-emerald-400 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading challenges...</div>
          ) : !challenges || challenges.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No active challenges. Create one to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {challenges.map((challenge: TeamChallenge) => (
                <div key={challenge.id} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{challenge.title}</h3>
                      <p className="text-sm text-gray-400">
                        {CHALLENGE_TYPES[challenge.challengeType as keyof typeof CHALLENGE_TYPES]?.emoji} {" "}
                        {CHALLENGE_TYPES[challenge.challengeType as keyof typeof CHALLENGE_TYPES]?.name}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(challenge.status)} text-white`}>
                      {challenge.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {challenge.description && (
                    <p className="text-sm text-gray-300 mb-3">{challenge.description}</p>
                  )}
                  
                  <Separator className="my-3 bg-gray-600" />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Individual Fee:</span>
                      <span className="text-emerald-400 ml-2 font-semibold">
                        {formatCurrency(challenge.individualFee)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total Stake:</span>
                      <span className="text-emerald-400 ml-2 font-semibold">
                        {formatCurrency(challenge.totalStake)}
                      </span>
                    </div>
                  </div>
                  
                  {challenge.status === "open" && (
                    <Button
                      data-testid={`button-accept-challenge-${challenge.id}`}
                      onClick={() => acceptChallenge.mutate({
                        challengeId: challenge.id,
                        acceptingTeamId: "mock-accepting-team-id"
                      })}
                      disabled={acceptChallenge.isPending}
                      className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      {acceptChallenge.isPending ? "Accepting..." : "Accept Challenge"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}