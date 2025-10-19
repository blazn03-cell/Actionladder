import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Trophy, DollarSign, Shield, Lock, Clock } from "lucide-react";
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
  "2man_army": { name: "2-Man Army", size: 2, emoji: "👥👥", comingSoon: true },
  "3man_crew": { name: "3-Man Crew", size: 3, emoji: "👥👥👥", comingSoon: true }
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(CHALLENGE_TYPES).map(([type, info]) => (
          <Card key={type} className={`border-gray-700 ${info.comingSoon ? 'bg-gray-800/50 opacity-75' : 'bg-gray-800'}`}>
            <CardHeader className="text-center">
              <CardTitle className={`flex items-center justify-center gap-2 ${info.comingSoon ? 'text-gray-400' : 'text-emerald-400'}`}>
                <span className="text-2xl">{info.emoji}</span>
                {info.name}
                {info.comingSoon && (
                  <Badge variant="secondary" className="ml-2 bg-orange-600 text-white">
                    <Clock className="h-3 w-3 mr-1" />
                    Coming Soon
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-gray-300">
                Team size: {info.size} players
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-2">
                {info.comingSoon ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-orange-400">
                    <Lock className="h-4 w-4" />
                    Feature Coming Soon
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Shield className="h-4 w-4" />
                    Pro Membership only
                  </div>
                )}
                <div className="text-sm text-gray-400">
                  {info.comingSoon ? 
                    "Team matches are being developed and will be available soon" :
                    "Each player puts up a challenge fee ($10 – $10,000)"
                  }
                </div>
                {!info.comingSoon && (
                  <div className="text-sm text-emerald-400 font-semibold">
                    Total team stake = individual fee × {info.size}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Challenge Form */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-400 flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Create Team Challenge
          </CardTitle>
          <CardDescription className="text-gray-300">
            Team challenges are coming soon! Check back later for team match functionality.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 bg-gray-700 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 text-orange-400 mb-4">
              <Clock className="h-6 w-6" />
              <span className="text-lg font-semibold">Feature Coming Soon</span>
            </div>
            <p className="text-gray-300 mb-4">
              We're working hard to bring you team challenges! This feature will include:
            </p>
            <ul className="text-left text-gray-300 space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">•</span>
                2v2 Army matches with strategic team play
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">•</span>
                3v3 Crew battles with lineup strategies
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">•</span>
                High-stakes team competitions
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">•</span>
                Pro membership integration
              </li>
            </ul>
            <Button
              disabled
              className="w-full bg-gray-600 text-gray-400 cursor-not-allowed"
              data-testid="button-create-challenge-disabled"
            >
              <Lock className="mr-2 h-4 w-4" />
              Team Challenges Coming Soon
            </Button>
          </div>
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