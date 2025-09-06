import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Trophy, 
  Users, 
  DollarSign, 
  Target, 
  Zap, 
  MapPin, 
  Calendar,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Crown,
  Star,
  Gamepad2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { SafeText } from "@/components/SafeText";

interface MatchDivision {
  id: string;
  name: string;
  displayName: string;
  minTeamSize: number;
  maxTeamSize: number;
  entryFeeMin: number;
  entryFeeMax: number;
  requiresStreaming: boolean;
  requiresCaptain: boolean;
  allowsSideBets: boolean;
  description: string;
  active: boolean;
}

interface OperatorTier {
  id: string;
  name: string;
  displayName: string;
  monthlyFee: number;
  revenueSplitPercent: number;
  maxTeams: number | null;
  hasPromoTools: boolean;
  hasLiveStreamBonus: boolean;
  hasResellRights: boolean;
  description: string;
  features: string[];
  active: boolean;
}

interface MatchEntry {
  id: string;
  matchId: string;
  divisionId: string;
  homeTeamId: string;
  awayTeamId?: string;
  entryFeePerPlayer: number;
  totalStake: number;
  paymentStatus: string;
  matchStatus: string;
  winnerId?: string;
  homeScore: number;
  awayScore: number;
  scheduledAt?: string;
  completedAt?: string;
  venueId?: string;
  streamUrl?: string;
  operatorId: string;
  metadata: any;
  createdAt: string;
}

interface TeamStripeAccount {
  id: string;
  teamId: string;
  stripeAccountId: string;
  accountStatus: string;
  onboardingCompleted: boolean;
  payoutsEnabled: boolean;
  email?: string;
}

// Mock team data (in real app, this would come from API)
const mockTeams = [
  { id: "team1", name: "Seguin Sharks", city: "Seguin", state: "Texas" },
  { id: "team2", name: "Austin Aces", city: "Austin", state: "Texas" },
  { id: "team3", name: "Dallas Dragons", city: "Dallas", state: "Texas" },
  { id: "team4", name: "Houston Hustlers", city: "Houston", state: "Texas" },
];

export default function MatchDivisions() {
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [entryFeePerPlayer, setEntryFeePerPlayer] = useState<number>(1000);
  const [teamSize, setTeamSize] = useState<number>(2);

  const queryClient = useQueryClient();

  // Fetch match divisions
  const { data: divisions = [] } = useQuery({
    queryKey: ["/api/match-divisions"],
  });

  // Fetch operator tiers
  const { data: operatorTiers = [] } = useQuery({
    queryKey: ["/api/operator-tiers"],
  });

  // Create match entry mutation
  const createMatchEntry = useMutation({
    mutationFn: async (matchData: any) => {
      return apiRequest("/api/match-entries", {
        method: "POST",
        body: JSON.stringify(matchData),
      });
    },
    onSuccess: (data: any) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
  });

  // Stripe onboarding mutation
  const createStripeOnboarding = useMutation({
    mutationFn: async ({ teamId, email }: { teamId: string; email: string }) => {
      return apiRequest(`/api/teams/${teamId}/stripe-onboarding`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    onSuccess: (data: any) => {
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      }
    },
  });

  const selectedDivisionData = divisions.find((d: MatchDivision) => d.id === selectedDivision);

  const handleCreateMatch = () => {
    if (!selectedDivision || !selectedTeam) return;

    createMatchEntry.mutate({
      divisionId: selectedDivision,
      homeTeamId: selectedTeam,
      entryFeePerPlayer,
      teamSize,
      operatorId: "operator-main",
      venueId: "venue-main",
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getDivisionIcon = (divisionName: string) => {
    switch (divisionName) {
      case 'poolhall': return <Gamepad2 className="h-6 w-6" />;
      case 'city': return <MapPin className="h-6 w-6" />;
      case 'state': return <Crown className="h-6 w-6" />;
      default: return <Trophy className="h-6 w-6" />;
    }
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case 'rookie_hall': return <Target className="h-5 w-5" />;
      case 'basic_hall': return <Users className="h-5 w-5" />;
      case 'elite_operator': return <Star className="h-5 w-5" />;
      case 'franchise': return <Crown className="h-5 w-5" />;
      default: return <Trophy className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Match Division System</h1>
        <p className="text-gray-300">
          From Poolhall battles to State championships with integrated Stripe payouts
        </p>
      </div>

      <Tabs defaultValue="divisions" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="divisions">Divisions</TabsTrigger>
          <TabsTrigger value="create-match">Create Match</TabsTrigger>
          <TabsTrigger value="operator-tiers">Operator Tiers</TabsTrigger>
          <TabsTrigger value="team-management">Team Management</TabsTrigger>
        </TabsList>

        {/* Match Divisions Overview */}
        <TabsContent value="divisions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {divisions.map((division: MatchDivision) => (
              <Card key={division.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-900/50 rounded-lg text-emerald-400">
                      {getDivisionIcon(division.name)}
                    </div>
                    <div>
                      <CardTitle className="text-emerald-400">{division.displayName}</CardTitle>
                      <CardDescription className="text-gray-300">
                        {division.minTeamSize}-{division.maxTeamSize} players per team
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-300">{division.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Entry Fee Range</span>
                      <span className="text-white font-medium">
                        {formatCurrency(division.entryFeeMin)} - {formatCurrency(division.entryFeeMax)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Team Size</span>
                      <span className="text-white">{division.minTeamSize}-{division.maxTeamSize} players</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {division.requiresStreaming && (
                      <Badge variant="outline" className="border-purple-500 text-purple-300">
                        Streaming Required
                      </Badge>
                    )}
                    {division.requiresCaptain && (
                      <Badge variant="outline" className="border-blue-500 text-blue-300">
                        Captain Required
                      </Badge>
                    )}
                    {division.allowsSideBets && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-300">
                        <SafeText>Side Bets Allowed</SafeText>
                      </Badge>
                    )}
                  </div>

                  <Button
                    data-testid={`button-select-${division.name}`}
                    onClick={() => setSelectedDivision(division.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    Create {division.displayName} Match
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Create Match */}
        <TabsContent value="create-match" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-emerald-400 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Create New Match
              </CardTitle>
              <CardDescription className="text-gray-300">
                Set up a new match with Stripe payment processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="division" className="text-white">Division</Label>
                  <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                    <SelectTrigger data-testid="select-division" className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Choose division" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {divisions.map((division: MatchDivision) => (
                        <SelectItem key={division.id} value={division.id} className="text-white">
                          {division.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team" className="text-white">Your Team</Label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger data-testid="select-team" className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Choose your team" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {mockTeams.map((team) => (
                        <SelectItem key={team.id} value={team.id} className="text-white">
                          {team.name} ({team.city}, {team.state})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entryFee" className="text-white">Entry Fee Per Player</Label>
                  <Input
                    data-testid="input-entry-fee"
                    type="number"
                    value={entryFeePerPlayer / 100}
                    onChange={(e) => setEntryFeePerPlayer(parseFloat(e.target.value) * 100)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter amount in dollars"
                    min={selectedDivisionData ? selectedDivisionData.entryFeeMin / 100 : 10}
                    max={selectedDivisionData ? selectedDivisionData.entryFeeMax / 100 : 10000}
                  />
                  {selectedDivisionData && (
                    <p className="text-xs text-gray-400">
                      Range: {formatCurrency(selectedDivisionData.entryFeeMin)} - {formatCurrency(selectedDivisionData.entryFeeMax)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamSize" className="text-white">Team Size</Label>
                  <Select value={teamSize.toString()} onValueChange={(value) => setTeamSize(parseInt(value))}>
                    <SelectTrigger data-testid="select-team-size" className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {selectedDivisionData && Array.from(
                        { length: selectedDivisionData.maxTeamSize - selectedDivisionData.minTeamSize + 1 },
                        (_, i) => selectedDivisionData.minTeamSize + i
                      ).map((size) => (
                        <SelectItem key={size} value={size.toString()} className="text-white">
                          {size} players
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedDivisionData && (
                <div className="p-4 bg-gray-700 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">Match Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Division:</span>
                      <span className="text-white">{selectedDivisionData.displayName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Entry Fee Per Player:</span>
                      <span className="text-white">{formatCurrency(entryFeePerPlayer)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Team Size:</span>
                      <span className="text-white">{teamSize} players</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-400">Total Team Entry:</span>
                      <span className="text-emerald-400">{formatCurrency(entryFeePerPlayer * teamSize)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-400">Total Match Stake:</span>
                      <span className="text-emerald-400">{formatCurrency(entryFeePerPlayer * teamSize * 2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                data-testid="button-create-match"
                onClick={handleCreateMatch}
                disabled={!selectedDivision || !selectedTeam || createMatchEntry.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {createMatchEntry.isPending ? "Creating Match..." : "Create Match & Pay Entry Fee"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operator Tiers */}
        <TabsContent value="operator-tiers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {operatorTiers.map((tier: OperatorTier) => (
              <Card key={tier.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-900/50 rounded-lg text-blue-400">
                        {getTierIcon(tier.name)}
                      </div>
                      <div>
                        <CardTitle className="text-blue-400">{tier.displayName}</CardTitle>
                        <CardDescription className="text-gray-300">
                          {formatCurrency(tier.monthlyFee)}/month
                        </CardDescription>
                      </div>
                    </div>
                    {tier.name === "franchise" && (
                      <Badge variant="outline" className="border-gold-500 text-yellow-300">
                        PREMIUM
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-300">{tier.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Revenue Split</span>
                      <span className="text-white font-medium">{tier.revenueSplitPercent}% to platform</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Max Teams</span>
                      <span className="text-white">{tier.maxTeams || "Unlimited"}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-sm font-medium text-white">Features:</h5>
                    <ul className="text-xs text-gray-300 space-y-1">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {tier.hasPromoTools && (
                      <Badge variant="outline" className="border-purple-500 text-purple-300 text-xs">
                        Promo Tools
                      </Badge>
                    )}
                    {tier.hasLiveStreamBonus && (
                      <Badge variant="outline" className="border-red-500 text-red-300 text-xs">
                        Stream Bonus
                      </Badge>
                    )}
                    {tier.hasResellRights && (
                      <Badge variant="outline" className="border-gold-500 text-yellow-300 text-xs">
                        Resell Rights
                      </Badge>
                    )}
                  </div>

                  <Button
                    data-testid={`button-select-tier-${tier.name}`}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Select {tier.displayName}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Team Management */}
        <TabsContent value="team-management" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stripe Onboarding */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-emerald-400 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Stripe Connect Onboarding
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Set up payment processing for your teams to receive payouts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {mockTeams.map((team) => (
                    <div key={team.id} className="p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white">{team.name}</h4>
                          <p className="text-sm text-gray-400">{team.city}, {team.state}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-gray-500 text-gray-300">
                            Not Connected
                          </Badge>
                          <Button
                            data-testid={`button-onboard-${team.id}`}
                            size="sm"
                            onClick={() => createStripeOnboarding.mutate({
                              teamId: team.id,
                              email: `captain@${team.name.toLowerCase().replace(/\s+/g, '')}.com`
                            })}
                            disabled={createStripeOnboarding.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Connect Stripe
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-blue-900/30 border border-blue-600 rounded-lg">
                  <h5 className="font-medium text-blue-300 mb-2">Why Connect Stripe?</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Automatic payouts when you win matches</li>
                    <li>• Secure, tax-compliant payments</li>
                    <li>• Fast bank transfers (1-2 business days)</li>
                    <li>• Track earnings and generate reports</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Match History */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Matches
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Track your team's performance and earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">Poolhall vs Poolhall</span>
                      <Badge className="bg-green-900 text-green-300">Won</Badge>
                    </div>
                    <div className="text-sm text-gray-400">
                      <div>Seguin Sharks vs Austin Aces</div>
                      <div>Entry: $50/player • Prize: $400</div>
                      <div>2 days ago</div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">City vs City</span>
                      <Badge variant="outline" className="border-red-500 text-red-300">Lost</Badge>
                    </div>
                    <div className="text-sm text-gray-400">
                      <div>Austin vs San Antonio</div>
                      <div>Entry: $200/player • Stakes: $2,000</div>
                      <div>1 week ago</div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">State vs State</span>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-300">Scheduled</Badge>
                    </div>
                    <div className="text-sm text-gray-400">
                      <div>Texas vs Oklahoma</div>
                      <div>Entry: $1,000/player • Stakes: $20,000</div>
                      <div>Next Friday</div>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                  View All Matches
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}