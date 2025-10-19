import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DollarSign, 
  Target, 
  Building2, 
  Vote, 
  Trophy,
  Zap,
  Plus,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Crown,
  Users,
  Calendar
} from "lucide-react";

// Import the existing components
import MoneyOnTable from "@/components/money-on-table";
import KellyPool from "@/components/kelly-pool";

export default function SpecialGames() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("money-ball");

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-400 mb-2">Special Games</h1>
        <p className="text-gray-400">Unique game variants and special challenge formats</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8 bg-gray-900 border border-gray-700">
          <TabsTrigger 
            value="money-ball" 
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
            data-testid="tab-money-ball"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Money Ball
          </TabsTrigger>
          <TabsTrigger 
            value="kelly-pool" 
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
            data-testid="tab-kelly-pool"
          >
            <Target className="mr-2 h-4 w-4" />
            Kelly Pool
          </TabsTrigger>
          <TabsTrigger 
            value="spot-shot" 
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
            data-testid="tab-spot-shot"
          >
            <Target className="mr-2 h-4 w-4" />
            Spot Shot
          </TabsTrigger>
          <TabsTrigger 
            value="object-carom" 
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
            data-testid="tab-object-carom"
          >
            <Zap className="mr-2 h-4 w-4" />
            Object Carom
          </TabsTrigger>
          <TabsTrigger 
            value="hall-battles" 
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
            data-testid="tab-hall-battles"
          >
            <Building2 className="mr-2 h-4 w-4" />
            Hall vs Hall
          </TabsTrigger>
          <TabsTrigger 
            value="game-voting" 
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
            data-testid="tab-game-voting"
          >
            <Vote className="mr-2 h-4 w-4" />
            Game Voting
          </TabsTrigger>
          <TabsTrigger 
            value="tournament-calcutta" 
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
            data-testid="tab-tournament-calcutta"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Tournament Calcutta
          </TabsTrigger>
          <TabsTrigger 
            value="season-predictions" 
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
            data-testid="tab-season-predictions"
          >
            <Crown className="mr-2 h-4 w-4" />
            Season Predictions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="money-ball" className="space-y-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Money Ball Challenge
              </CardTitle>
              <CardDescription>
                Cue ball lands on cash - high stakes skill challenge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MoneyOnTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kelly-pool" className="space-y-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Kelly Pool
              </CardTitle>
              <CardDescription>
                Classic numbers game with pea shake and elimination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KellyPool />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spot-shot" className="space-y-6">
          <SpotShotGames />
        </TabsContent>

        <TabsContent value="object-carom" className="space-y-6">
          <ObjectBallCarom />
        </TabsContent>

        <TabsContent value="hall-battles" className="space-y-6">
          <PoolhallMatches />
        </TabsContent>

        <TabsContent value="game-voting" className="space-y-6">
          <GameOfTheMonthVoting />
        </TabsContent>

        <TabsContent value="tournament-calcutta" className="space-y-6">
          <TournamentCalcutta />
        </TabsContent>

        <TabsContent value="season-predictions" className="space-y-6">
          <SeasonPredictions />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ObjectBallCarom() {
  const { toast } = useToast();
  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false);

  const { data: caromGames, isLoading } = useQuery({
    queryKey: ["/api/object-carom-games"],
  });

  const createGameMutation = useMutation({
    mutationFn: (gameData: any) => apiRequest("/api/object-carom-games", { 
      method: "POST", 
      body: JSON.stringify(gameData) 
    }),
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create Object Ball Carom game",
        variant: "destructive",
      });
    },
  });

  const handleCreateGame = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const gameData = {
      player1Id: formData.get("player1Id"),
      player2Id: formData.get("player2Id"),
      entryFee: parseInt(formData.get("entryFee") as string) * 100, // Convert to cents
      targetBalls: parseInt(formData.get("targetBalls") as string),
      description: formData.get("description"),
    };
    
    createGameMutation.mutate(gameData);
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Object Ball Carom
            </CardTitle>
            <CardDescription>
              Hit object ball → carom cue ball challenge
            </CardDescription>
          </div>
          <Dialog open={isCreateGameOpen} onOpenChange={setIsCreateGameOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700" data-testid="button-create-carom-game">
                <Plus className="mr-2 h-4 w-4" />
                New Game
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-green-400">Create Object Ball Carom Challenge</DialogTitle>
                <DialogDescription>
                  Set up a precision carom shot challenge
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGame} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="player1Id">Player 1</Label>
                    <Input
                      id="player1Id"
                      name="player1Id"
                      required
                      placeholder="Player 1 ID"
                      className="bg-gray-800 border-gray-600"
                      data-testid="input-player1-id"
                    />
                  </div>
                  <div>
                    <Label htmlFor="player2Id">Player 2</Label>
                    <Input
                      id="player2Id"
                      name="player2Id"
                      required
                      placeholder="Player 2 ID"
                      className="bg-gray-800 border-gray-600"
                      data-testid="input-player2-id"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entryFee">Entry Fee ($)</Label>
                    <Input
                      id="entryFee"
                      name="entryFee"
                      type="number"
                      min="5"
                      max="500"
                      required
                      placeholder="50"
                      className="bg-gray-800 border-gray-600"
                      data-testid="input-entry-fee"
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetBalls">Target Balls</Label>
                    <Input
                      id="targetBalls"
                      name="targetBalls"
                      type="number"
                      min="3"
                      max="15"
                      defaultValue="5"
                      className="bg-gray-800 border-gray-600"
                      data-testid="input-target-balls"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Game Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Carom challenge details..."
                    className="bg-gray-800 border-gray-600"
                    data-testid="input-game-description"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateGameOpen(false)}
                    data-testid="button-cancel-carom-game"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createGameMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-submit-carom-game"
                  >
                    {createGameMutation.isPending ? "Creating..." : "Create Challenge"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-blue-900/20 border border-blue-700 rounded">
            <h3 className="font-semibold text-blue-400 mb-2">Game Rules</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Player shoots object ball first</li>
              <li>• Cue ball must carom off object ball to hit target</li>
              <li>• Both players alternate attempts</li>
              <li>• First to complete required caroms wins Prize Pool</li>
              <li>• Failed attempts result in ball-in-hand for opponent</li>
            </ul>
          </div>

          {isLoading ? (
            <div className="text-center py-4 text-gray-400">Loading carom games...</div>
          ) : (
            <div className="grid gap-4">
              {(caromGames as any[])?.map((game: any) => (
                <div key={game.id} className="p-4 bg-gray-800 rounded border border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{game.player1Name} vs {game.player2Name}</div>
                      <div className="text-sm text-gray-400">
                        ${(game.entryFee / 100).toFixed(0)} entry • {game.targetBalls} target balls
                      </div>
                    </div>
                    <Badge variant={game.status === "active" ? "default" : "secondary"}>
                      {game.status}
                    </Badge>
                  </div>
                </div>
              )) || []}
              {(!caromGames || (caromGames as any[])?.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  No Object Ball Carom games active
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PoolhallMatches() {
  const { toast } = useToast();
  const [isCreateMatchOpen, setIsCreateMatchOpen] = useState(false);

  const { data: hallMatches, isLoading } = useQuery({
    queryKey: ["/api/poolhall-matches"],
  });

  const createMatchMutation = useMutation({
    mutationFn: (matchData: any) => apiRequest("/api/poolhall-matches", { 
      method: "POST", 
      body: JSON.stringify(matchData) 
    }),
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create poolhall match",
        variant: "destructive",
      });
    },
  });

  const handleCreateMatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const matchData = {
      homeHallName: formData.get("homeHallName"),
      awayHallName: formData.get("awayHallName"),
      homeHallId: formData.get("homeHallId"),
      awayHallId: formData.get("awayHallId"),
      format: formData.get("format"),
      entryFee: parseInt(formData.get("entryFee") as string) * 100,
      scheduledAt: formData.get("scheduledAt") ? new Date(formData.get("scheduledAt") as string) : null,
    };
    
    createMatchMutation.mutate(matchData);
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Poolhall vs Poolhall Matches
            </CardTitle>
            <CardDescription>
              Hall rivalry matches and inter-venue competitions
            </CardDescription>
          </div>
          <Dialog open={isCreateMatchOpen} onOpenChange={setIsCreateMatchOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700" data-testid="button-create-hall-match">
                <Plus className="mr-2 h-4 w-4" />
                New Hall Match
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-green-400">Create Poolhall Match</DialogTitle>
                <DialogDescription>
                  Set up a competition between two pool halls
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateMatch} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="homeHallName">Home Hall Name</Label>
                    <Input
                      id="homeHallName"
                      name="homeHallName"
                      required
                      placeholder="Home pool hall"
                      className="bg-gray-800 border-gray-600"
                      data-testid="input-home-hall-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="awayHallName">Away Hall Name</Label>
                    <Input
                      id="awayHallName"
                      name="awayHallName"
                      required
                      placeholder="Away pool hall"
                      className="bg-gray-800 border-gray-600"
                      data-testid="input-away-hall-name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="homeHallId">Home Hall ID</Label>
                    <Input
                      id="homeHallId"
                      name="homeHallId"
                      placeholder="Home hall operator ID"
                      className="bg-gray-800 border-gray-600"
                      data-testid="input-home-hall-id"
                    />
                  </div>
                  <div>
                    <Label htmlFor="awayHallId">Away Hall ID</Label>
                    <Input
                      id="awayHallId"
                      name="awayHallId"
                      placeholder="Away hall operator ID"
                      className="bg-gray-800 border-gray-600"
                      data-testid="input-away-hall-id"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="format">Match Format</Label>
                    <Select name="format" required>
                      <SelectTrigger className="bg-gray-800 border-gray-600" data-testid="select-match-format">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="3v3_team">3v3 Team Battle (Coming Soon)</SelectItem>
                        <SelectItem value="singles_bracket">Singles Bracket</SelectItem>
                        <SelectItem value="mixed_format">Mixed Format</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="entryFee">Entry Fee ($)</Label>
                    <Input
                      id="entryFee"
                      name="entryFee"
                      type="number"
                      min="50"
                      max="1000"
                      required
                      placeholder="200"
                      className="bg-gray-800 border-gray-600"
                      data-testid="input-hall-match-fee"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="scheduledAt">Match Date & Time</Label>
                  <Input
                    id="scheduledAt"
                    name="scheduledAt"
                    type="datetime-local"
                    className="bg-gray-800 border-gray-600"
                    data-testid="input-hall-match-datetime"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateMatchOpen(false)}
                    data-testid="button-cancel-hall-match"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMatchMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-submit-hall-match"
                  >
                    {createMatchMutation.isPending ? "Creating..." : "Create Match"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-purple-900/20 border border-purple-700 rounded">
            <h3 className="font-semibold text-purple-400 mb-2">Hall Battle Rules</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Home hall provides venue and table conditions</li>
              <li>• Away hall brings their best team</li>
              <li>• Winner takes 70% of Prize Pool, runner-up gets 30%</li>
              <li>• Live streaming encouraged for bragging rights</li>
              <li>• Annual championship between top performing halls</li>
            </ul>
          </div>

          {isLoading ? (
            <div className="text-center py-4 text-gray-400">Loading hall matches...</div>
          ) : (
            <div className="grid gap-4">
              {(hallMatches as any[])?.map((match: any) => (
                <div key={match.id} className="p-4 bg-gray-800 rounded border border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-lg">
                        {match.homeHallName} vs {match.awayHallName}
                      </div>
                      <div className="text-sm text-gray-400">
                        {match.format} • ${(match.entryFee / 100).toFixed(0)} entry
                      </div>
                      {match.scheduledAt && (
                        <div className="text-xs text-gray-500">
                          {new Date(match.scheduledAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        <span className="text-blue-400">{match.homeScore || 0}</span>
                        <span className="text-gray-500 mx-2">-</span>
                        <span className="text-red-400">{match.awayScore || 0}</span>
                      </div>
                      <Badge variant={match.status === "active" ? "default" : "secondary"}>
                        {match.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-400">
                  No hall battles scheduled
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function GameOfTheMonthVoting() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateVoteOpen, setIsCreateVoteOpen] = useState(false);

  const { data: currentVoting, isLoading } = useQuery({
    queryKey: ["/api/game-voting/current"],
  });

  const { data: votingHistory } = useQuery({
    queryKey: ["/api/game-voting/history"],
  });

  const submitVoteMutation = useMutation({
    mutationFn: ({ gameType, vote }: { gameType: string; vote: "up" | "down" }) => 
      apiRequest("/api/game-voting/vote", { 
        method: "POST", 
        body: JSON.stringify({ gameType, vote }) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game-voting"] });
      toast({
        title: "Vote Recorded",
        description: "Your vote has been counted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record vote",
        variant: "destructive",
      });
    },
  });

  const createVotingMutation = useMutation({
    mutationFn: (votingData: any) => apiRequest("/api/game-voting", { 
      method: "POST", 
      body: JSON.stringify(votingData) 
    }),
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create voting session",
        variant: "destructive",
      });
    },
  });

  const gameVariants = [
    { id: "money_ball", name: "Money Ball", description: "Cue ball lands on cash" },
    { id: "object_carom", name: "Object Ball Carom", description: "Hit object → carom cue ball" },
    { id: "kelly_pool", name: "Kelly Pool", description: "Numbers game with elimination" },
    { id: "speed_ball", name: "Speed Ball", description: "Timed shot challenges" },
    { id: "trick_shots", name: "Trick Shots", description: "Creative shot competitions" },
    { id: "bank_pool", name: "Bank Pool", description: "All shots must bank" },
  ];

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Game of the Month Voting
            </CardTitle>
            <CardDescription>
              Community votes on featured game variants
            </CardDescription>
          </div>
          <Dialog open={isCreateVoteOpen} onOpenChange={setIsCreateVoteOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700" data-testid="button-create-voting">
                <Plus className="mr-2 h-4 w-4" />
                New Voting
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-green-400">Create Voting Session</DialogTitle>
                <DialogDescription>
                  Start a new Game of the Month voting period
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="votingTitle">Voting Title</Label>
                  <Input
                    id="votingTitle"
                    name="votingTitle"
                    required
                    placeholder="January 2025 Game of the Month"
                    className="bg-gray-800 border-gray-600"
                    data-testid="input-voting-title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      className="bg-gray-800 border-gray-600"
                      data-testid="input-start-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      className="bg-gray-800 border-gray-600"
                      data-testid="input-end-date"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateVoteOpen(false)}
                    data-testid="button-cancel-voting"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createVotingMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-submit-voting"
                  >
                    {createVotingMutation.isPending ? "Creating..." : "Start Voting"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Voting */}
          {(currentVoting as any) && (
            <div className="p-4 bg-green-900/20 border border-green-700 rounded">
              <h3 className="font-semibold text-green-400 mb-4 flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Current Voting: {(currentVoting as any).title}
              </h3>
              <div className="grid gap-3">
                {gameVariants.map((game) => {
                  const votes = (currentVoting as any).votes?.[game.id] || { up: 0, down: 0 };
                  const totalVotes = votes.up + votes.down;
                  const percentage = totalVotes > 0 ? (votes.up / totalVotes) * 100 : 0;
                  
                  return (
                    <div key={game.id} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                      <div className="flex-1">
                        <div className="font-medium">{game.name}</div>
                        <div className="text-sm text-gray-400">{game.description}</div>
                        <div className="text-xs text-gray-500">
                          {votes.up} up • {votes.down} down • {percentage.toFixed(0)}% approval
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => submitVoteMutation.mutate({ gameType: game.id, vote: "up" })}
                          className="text-green-400 hover:bg-green-900/30"
                          data-testid={`button-vote-up-${game.id}`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => submitVoteMutation.mutate({ gameType: game.id, vote: "down" })}
                          className="text-red-400 hover:bg-red-900/30"
                          data-testid={`button-vote-down-${game.id}`}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-center">
                <div className="text-sm text-gray-400">
                  Voting ends: {new Date((currentVoting as any).endDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {/* Previous Winners */}
          {(votingHistory as any[])?.length > 0 && (
            <div>
              <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Previous Winners
              </h3>
              <div className="space-y-2">
                {(votingHistory as any[]).slice(0, 5).map((winner: any) => (
                  <div key={winner.id} className="flex justify-between items-center p-3 bg-gray-800 rounded">
                    <div>
                      <div className="font-medium">{winner.winningGame}</div>
                      <div className="text-sm text-gray-400">{winner.month}</div>
                    </div>
                    <Badge className="bg-yellow-600">
                      <Crown className="h-3 w-3 mr-1" />
                      Winner
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!currentVoting && (
            <div className="text-center py-8">
              <Vote className="mx-auto h-12 w-12 text-gray-500 mb-4" />
              <p className="text-gray-400 mb-4">No active voting session</p>
              <Button
                onClick={() => setIsCreateVoteOpen(true)}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-start-voting"
              >
                Start Monthly Voting
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SpotShotGames() {
  const { toast } = useToast();
  const [selectedVariant, setSelectedVariant] = useState("classic");

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-green-400 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Spot Shot Challenges
        </CardTitle>
        <CardDescription>
          Precision spot shot variations for skilled players
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Spot Shot Variant Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant={selectedVariant === "classic" ? "default" : "outline"}
              onClick={() => setSelectedVariant("classic")}
              className={selectedVariant === "classic" ? "bg-green-600" : ""}
              data-testid="button-classic-spot"
            >
              Classic Spot
            </Button>
            <Button
              variant={selectedVariant === "bank" ? "default" : "outline"}
              onClick={() => setSelectedVariant("bank")}
              className={selectedVariant === "bank" ? "bg-green-600" : ""}
              data-testid="button-bank-spot"
            >
              Bank Spot
            </Button>
            <Button
              variant={selectedVariant === "call-pocket" ? "default" : "outline"}
              onClick={() => setSelectedVariant("call-pocket")}
              className={selectedVariant === "call-pocket" ? "bg-green-600" : ""}
              data-testid="button-call-pocket-spot"
            >
              Call Pocket
            </Button>
            <Button
              variant={selectedVariant === "rotation" ? "default" : "outline"}
              onClick={() => setSelectedVariant("rotation")}
              className={selectedVariant === "rotation" ? "bg-green-600" : ""}
              data-testid="button-rotation-spot"
            >
              Rotation Spot
            </Button>
          </div>

          {/* Game Rules Display */}
          {selectedVariant === "classic" && (
            <div className="p-4 bg-green-900/20 border border-green-700 rounded">
              <h3 className="font-semibold text-green-400 mb-2">The Spot Shot</h3>
              <p className="text-gray-300 mb-3">Ball on the dot and shoot any corner</p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Place object ball on the foot spot (dot)</li>
                <li>• Cue ball can be placed anywhere behind the head string</li>
                <li>• Must pocket the spotted ball in any corner pocket</li>
                <li>• Both players alternate attempts</li>
                <li>• First to make the shot wins the challenge</li>
              </ul>
            </div>
          )}

          {selectedVariant === "bank" && (
            <div className="p-4 bg-blue-900/20 border border-blue-700 rounded">
              <h3 className="font-semibold text-blue-400 mb-2">Bank Spot Shot</h3>
              <p className="text-gray-300 mb-3">Ball must be banked off a cushion before being pocketed</p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Place object ball on the foot spot (dot)</li>
                <li>• Ball must hit at least one cushion before going in pocket</li>
                <li>• Can be pocketed in any corner pocket after banking</li>
                <li>• Direct shots (no bank) are automatic misses</li>
                <li>• Requires advanced cue ball control and angles</li>
              </ul>
            </div>
          )}

          {selectedVariant === "call-pocket" && (
            <div className="p-4 bg-purple-900/20 border border-purple-700 rounded">
              <h3 className="font-semibold text-purple-400 mb-2">Call-the-Pocket Spot Shot</h3>
              <p className="text-gray-300 mb-3">Players must call the exact pocket before shooting</p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Place object ball on the foot spot (dot)</li>
                <li>• Player must declare which corner pocket before shooting</li>
                <li>• Ball must go in the called pocket to count</li>
                <li>• Wrong pocket or scratch is automatic miss</li>
                <li>• Strategic pocket selection is key to victory</li>
              </ul>
            </div>
          )}

          {selectedVariant === "rotation" && (
            <div className="p-4 bg-orange-900/20 border border-orange-700 rounded">
              <h3 className="font-semibold text-orange-400 mb-2">Rotation Spot Shot</h3>
              <p className="text-gray-300 mb-3">Players move the spotted ball to different spots for tougher shots</p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Start with ball on foot spot, then rotate positions</li>
                <li>• Move to side spots (left and right)</li>
                <li>• Progress to head spot for maximum difficulty</li>
                <li>• Must make from each position to advance</li>
                <li>• First to complete all spots wins the challenge</li>
              </ul>
            </div>
          )}

          {/* Create Challenge Section */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="font-semibold text-gray-300 mb-4">Start a Spot Shot Challenge</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-sm text-gray-400">Classic precision shooting</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🔄</div>
                <div className="text-sm text-gray-400">Bank shot mastery</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">📞</div>
                <div className="text-sm text-gray-400">Called pocket accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🔄</div>
                <div className="text-sm text-gray-400">Progressive difficulty</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Button className="bg-green-600 hover:bg-green-700" data-testid="button-create-spot-challenge">
                <Plus className="mr-2 h-4 w-4" />
                Create Spot Shot Challenge
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Tournament Calcutta Component - Bidding on tournament participants
function TournamentCalcutta() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [bidAmount, setBidAmount] = useState<string>("");

  // Fetch tournaments with calcutta enabled
  const { data: tournaments, isLoading: tournamentsLoading } = useQuery({
    queryKey: ["/api/tournaments"],
  });

  // Fetch calcuttas for selected tournament
  const { data: calcuttas, isLoading: calcuttasLoading } = useQuery({
    queryKey: ["/api/tournaments", selectedTournament, "calcuttas"],
    enabled: !!selectedTournament,
  });

  // Fetch bids for selected calcuttas
  const { data: allBids } = useQuery({
    queryKey: ["/api/calcutta-bids"],
  });

  const placeBidMutation = useMutation({
    mutationFn: (bidData: any) => apiRequest("/api/calcutta-bids", {
      method: "POST",
      body: JSON.stringify(bidData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calcutta-bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournament-calcuttas"] });
      toast({
        title: "Success",
        description: "Your bid has been placed successfully!",
      });
      setBidAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to place bid",
        variant: "destructive",
      });
    },
  });

  const handlePlaceBid = (calcuttaId: string) => {
    const amount = parseFloat(bidAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid bid amount",
        variant: "destructive",
      });
      return;
    }

    placeBidMutation.mutate({
      calcuttaId,
      bidderId: "current-user-id", // Replace with actual user ID
      bidAmount: Math.floor(amount * 100), // Convert to cents
      isWinning: false,
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Tournament Calcutta - Bid on Tournament Participants
          </CardTitle>
          <CardDescription>
            Place bids on tournament players before events start. Winners split the prize pool!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tournament Selection */}
          <div className="space-y-2">
            <Label>Select Tournament</Label>
            <Select value={selectedTournament} onValueChange={setSelectedTournament}>
              <SelectTrigger data-testid="select-tournament">
                <SelectValue placeholder="Choose a tournament..." />
              </SelectTrigger>
              <SelectContent>
                {tournaments?.filter((t: any) => t.calcuttaEnabled)?.map((tournament: any) => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    {tournament.name} - {formatCurrency(tournament.entry)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTournament && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-400">Available Participants</h3>
              
              {calcuttasLoading ? (
                <div className="text-center py-8 text-gray-400">Loading participants...</div>
              ) : calcuttas?.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No participants available for bidding yet.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {calcuttas?.map((calcutta: any) => {
                    const participantBids = allBids?.filter((bid: any) => bid.calcuttaId === calcutta.id) || [];
                    const highestBid = participantBids.reduce((max: any, bid: any) => 
                      bid.bidAmount > (max?.bidAmount || 0) ? bid : max, null);

                    return (
                      <Card key={calcutta.id} className="bg-gray-800 border-gray-600">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-green-400">
                            Participant: {calcutta.participantId}
                          </CardTitle>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">
                              Current Bid: {calcutta.currentBid ? formatCurrency(calcutta.currentBid) : "No bids"}
                            </span>
                            <Badge variant={calcutta.biddingOpen ? "default" : "secondary"}>
                              {calcutta.biddingOpen ? "Open" : "Closed"}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        {calcutta.biddingOpen && (
                          <CardContent className="space-y-3">
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Bid amount ($)"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                min="1"
                                step="0.01"
                                data-testid={`input-bid-${calcutta.id}`}
                              />
                              <Button
                                onClick={() => handlePlaceBid(calcutta.id)}
                                disabled={placeBidMutation.isPending}
                                data-testid={`button-place-bid-${calcutta.id}`}
                              >
                                Place Bid
                              </Button>
                            </div>
                            
                            {participantBids.length > 0 && (
                              <div className="text-xs text-gray-400">
                                {participantBids.length} bid(s) placed
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Season Predictions Component - Championship prediction markets
function SeasonPredictions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPrediction, setSelectedPrediction] = useState<string>("");
  const [firstPlace, setFirstPlace] = useState<string>("");
  const [secondPlace, setSecondPlace] = useState<string>("");
  const [thirdPlace, setThirdPlace] = useState<string>("");

  // Fetch season predictions
  const { data: predictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ["/api/season-predictions"],
  });

  // Fetch players for prediction selection
  const { data: players } = useQuery({
    queryKey: ["/api/players"],
  });

  // Fetch prediction entries
  const { data: entries } = useQuery({
    queryKey: ["/api/prediction-entries"],
  });

  const submitPredictionMutation = useMutation({
    mutationFn: (entryData: any) => apiRequest("/api/prediction-entries", {
      method: "POST",
      body: JSON.stringify(entryData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prediction-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/season-predictions"] });
      toast({
        title: "Success",
        description: "Your season prediction has been submitted!",
      });
      setFirstPlace("");
      setSecondPlace("");
      setThirdPlace("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit prediction",
        variant: "destructive",
      });
    },
  });

  const handleSubmitPrediction = () => {
    if (!selectedPrediction || !firstPlace || !secondPlace || !thirdPlace) {
      toast({
        title: "Error",
        description: "Please select a prediction market and all three places",
        variant: "destructive",
      });
      return;
    }

    if (firstPlace === secondPlace || firstPlace === thirdPlace || secondPlace === thirdPlace) {
      toast({
        title: "Error",
        description: "Please select different players for each position",
        variant: "destructive",
      });
      return;
    }

    const prediction = predictions?.find((p: any) => p.id === selectedPrediction);
    if (!prediction) return;

    submitPredictionMutation.mutate({
      predictionId: selectedPrediction,
      predictorId: "current-user-id", // Replace with actual user ID
      firstPlacePick: firstPlace,
      secondPlacePick: secondPlace,
      thirdPlacePick: thirdPlace,
      entryFee: prediction.entryFee,
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getPlayerName = (playerId: string) => {
    const player = players?.find((p: any) => p.id === playerId);
    return player ? player.name : playerId;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Season Championship Predictions
          </CardTitle>
          <CardDescription>
            Predict the top 3 players by wins at season end. Must have 3+ matches played to qualify.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active Predictions */}
          <div className="grid gap-4">
            {predictionsLoading ? (
              <div className="text-center py-8 text-gray-400">Loading predictions...</div>
            ) : predictions?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No active season predictions available.
              </div>
            ) : (
              predictions?.filter((p: any) => p.predictionsOpen)?.map((prediction: any) => (
                <Card key={prediction.id} className="bg-gray-800 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-green-400 text-lg">{prediction.name}</CardTitle>
                    <CardDescription>{prediction.description}</CardDescription>
                    <div className="flex justify-between text-sm">
                      <span>Entry Fee: {formatCurrency(prediction.entryFee)}</span>
                      <span>Prize Pool: {formatCurrency(prediction.prizePool || 0)}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => setSelectedPrediction(prediction.id)}
                      variant={selectedPrediction === prediction.id ? "default" : "outline"}
                      data-testid={`button-select-prediction-${prediction.id}`}
                    >
                      {selectedPrediction === prediction.id ? "Selected" : "Make Prediction"}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Prediction Form */}
          {selectedPrediction && (
            <Card className="bg-gray-800 border-gray-600">
              <CardHeader>
                <CardTitle className="text-green-400">Make Your Prediction</CardTitle>
                <CardDescription>
                  Select the top 3 players you think will have the most wins this season
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>1st Place (70% Performance Bonus)</Label>
                    <Select value={firstPlace} onValueChange={setFirstPlace}>
                      <SelectTrigger data-testid="select-first-place">
                        <SelectValue placeholder="Select player..." />
                      </SelectTrigger>
                      <SelectContent>
                        {players?.map((player: any) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>2nd Place (20% Performance Bonus)</Label>
                    <Select value={secondPlace} onValueChange={setSecondPlace}>
                      <SelectTrigger data-testid="select-second-place">
                        <SelectValue placeholder="Select player..." />
                      </SelectTrigger>
                      <SelectContent>
                        {players?.map((player: any) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>3rd Place (10% Performance Bonus)</Label>
                    <Select value={thirdPlace} onValueChange={setThirdPlace}>
                      <SelectTrigger data-testid="select-third-place">
                        <SelectValue placeholder="Select player..." />
                      </SelectTrigger>
                      <SelectContent>
                        {players?.map((player: any) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleSubmitPrediction}
                  disabled={submitPredictionMutation.isPending || !firstPlace || !secondPlace || !thirdPlace}
                  className="w-full"
                  data-testid="button-submit-prediction"
                >
                  {submitPredictionMutation.isPending ? "Submitting..." : "Submit Prediction"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Current Entries */}
          {entries && entries.length > 0 && (
            <Card className="bg-gray-800 border-gray-600">
              <CardHeader>
                <CardTitle className="text-green-400">Recent Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {entries.slice(0, 5).map((entry: any) => (
                    <div key={entry.id} className="flex justify-between text-sm border-b border-gray-700 pb-2">
                      <span className="text-gray-400">Predictor</span>
                      <span>
                        1st: {getPlayerName(entry.firstPlacePick)} | 
                        2nd: {getPlayerName(entry.secondPlacePick)} | 
                        3rd: {getPlayerName(entry.thirdPlacePick)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
