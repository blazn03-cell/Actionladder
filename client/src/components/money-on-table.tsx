import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, Target, Users, Clock } from "lucide-react";

const moneyGameSchema = z.object({
  name: z.string().min(1, "Game name is required"),
  billAmount: z.number().min(1, "Bill amount must be at least $1"),
  maxPlayers: z.number().min(2, "Must allow at least 2 players").max(10, "Max 10 players"),
  table: z.string().min(1, "Table assignment is required"),
  gameType: z.enum(["straight-lag", "rail-first", "progressive"]),
});

type MoneyGameFormData = z.infer<typeof moneyGameSchema>;

interface MoneyGame {
  id: string;
  name: string;
  billAmount: number;
  pot: number;
  currentPlayers: number;
  maxPlayers: number;
  table: string;
  gameType: "straight-lag" | "rail-first" | "progressive";
  status: "waiting" | "active" | "completed";
  winner?: string;
  players: string[];
  createdAt: string;
}

function CreateMoneyGameDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<MoneyGameFormData>({
    resolver: zodResolver(moneyGameSchema),
    defaultValues: {
      name: "",
      billAmount: 20,
      maxPlayers: 6,
      table: "Table 1",
      gameType: "straight-lag",
    },
  });

  const createGameMutation = useMutation({
    mutationFn: (data: MoneyGameFormData) => 
      apiRequest("POST", "/api/money-games", {
        ...data,
        pot: data.billAmount * data.maxPlayers,
        currentPlayers: 0,
        status: "waiting",
        players: [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/money-games"] });
      toast({
        title: "Money Game Created",
        description: "New Money on the Table game started!",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create game",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MoneyGameFormData) => {
    createGameMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-money-game" className="bg-emerald-600 hover:bg-emerald-700">
          <DollarSign className="w-4 h-4 mr-2" />
          Start Money Game
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-emerald-500/20">
        <DialogHeader>
          <DialogTitle className="text-emerald-400">Create Money on the Table Game</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Name</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-game-name"
                      placeholder="High Stakes Money Hunt"
                      className="bg-muted border-emerald-500/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bill Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-bill-amount"
                        type="number"
                        min="1"
                        max="500"
                        className="bg-muted border-emerald-500/20"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxPlayers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Players</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-max-players"
                        type="number"
                        min="2"
                        max="10"
                        className="bg-muted border-emerald-500/20"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="table"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-table" className="bg-muted border-emerald-500/20">
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 8 }, (_, i) => (
                        <SelectItem key={i + 1} value={`Table ${i + 1}`}>
                          Table {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gameType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-game-type" className="bg-muted border-emerald-500/20">
                        <SelectValue placeholder="Select game type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="straight-lag">Straight Lag</SelectItem>
                      <SelectItem value="rail-first">Rail First</SelectItem>
                      <SelectItem value="progressive">Progressive Betting</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              data-testid="button-submit-money-game"
              type="submit"
              disabled={createGameMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {createGameMutation.isPending ? "Creating..." : "Start Game"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function MoneyGameCard({ game }: { game: MoneyGame }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const joinGameMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/money-games/${game.id}/join`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/money-games"] });
      toast({
        title: "Joined Game",
        description: `You've joined ${game.name}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join game",
        variant: "destructive",
      });
    },
  });

  const startGameMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/money-games/${game.id}/start`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/money-games"] });
      toast({
        title: "Game Started",
        description: `${game.name} is now active!`,
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting": return "bg-yellow-900/40 text-yellow-300 border-yellow-500/40";
      case "active": return "bg-emerald-900/40 text-emerald-300 border-emerald-500/40";
      case "completed": return "bg-gray-600/40 text-gray-300 border-gray-500/40";
      default: return "bg-gray-600/40 text-gray-300 border-gray-500/40";
    }
  };

  const getGameTypeLabel = (type: string) => {
    switch (type) {
      case "straight-lag": return "Straight Lag";
      case "rail-first": return "Rail First";
      case "progressive": return "Progressive";
      default: return type;
    }
  };

  return (
    <Card className="bg-card/50 border-emerald-500/20 hover:border-emerald-400/40 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-emerald-400 text-lg">{game.name}</CardTitle>
          <Badge className={getStatusColor(game.status)}>
            {game.status.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            {game.table}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {game.currentPlayers}/{game.maxPlayers}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            ${game.billAmount} each
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-emerald-400">${game.pot}</p>
            <p className="text-xs text-gray-500">Total Pot</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-white">{getGameTypeLabel(game.gameType)}</p>
            <p className="text-xs text-gray-500">Game Rules</p>
          </div>
        </div>

        {game.players.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Players:</p>
            <div className="flex flex-wrap gap-1">
              {game.players.map((player, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {player}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {game.status === "waiting" && game.currentPlayers < game.maxPlayers && (
            <Button
              data-testid={`button-join-game-${game.id}`}
              onClick={() => joinGameMutation.mutate()}
              disabled={joinGameMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {joinGameMutation.isPending ? "Joining..." : `Join ($${game.billAmount})`}
            </Button>
          )}
          
          {game.status === "waiting" && game.currentPlayers >= 2 && (
            <Button
              data-testid={`button-start-game-${game.id}`}
              onClick={() => startGameMutation.mutate()}
              disabled={startGameMutation.isPending}
              variant="outline"
              className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            >
              {startGameMutation.isPending ? "Starting..." : "Start Game"}
            </Button>
          )}

          {game.status === "completed" && game.winner && (
            <div className="flex-1 text-center py-2">
              <p className="text-emerald-400 font-semibold">Winner: {game.winner}</p>
              <p className="text-xs text-gray-500">Won ${game.pot}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MoneyOnTable() {
  const { data: games = [], isLoading } = useQuery<MoneyGame[]>({
    queryKey: ["/api/money-games"],
  });

  const activeGames = games.filter(game => game.status !== "completed");
  const completedGames = games.filter(game => game.status === "completed").slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-emerald-400">Money on the Table</h2>
          <p className="text-gray-400 mt-1">
            Place your bill and land the cue ball on top to win the pot
          </p>
        </div>
        <CreateMoneyGameDialog />
      </div>

      {/* Game Rules */}
      <Card className="bg-card/30 border-emerald-500/20">
        <CardHeader>
          <CardTitle className="text-emerald-400 flex items-center gap-2">
            <Target className="w-5 h-5" />
            How to Play
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Straight Lag</h4>
              <p className="text-gray-400">
                Lag from the headstring to see who can stop closest to the bill on the table.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Rail First</h4>
              <p className="text-gray-400">
                Must strike a rail before the cue ball settles on the money.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Progressive</h4>
              <p className="text-gray-400">
                Everyone adds more money if no one lands squarely on the bill.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Games */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          Active Games ({activeGames.length})
        </h3>
        
        {activeGames.length === 0 ? (
          <Card className="bg-card/30 border-emerald-500/20">
            <CardContent className="text-center py-8">
              <DollarSign className="w-12 h-12 text-emerald-400/50 mx-auto mb-4" />
              <p className="text-gray-400">No active money games</p>
              <p className="text-sm text-gray-500 mt-1">Start a new game to get the action going!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeGames.map((game) => (
              <MoneyGameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </div>

      {/* Recently Completed */}
      {completedGames.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Recently Completed</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedGames.map((game) => (
              <MoneyGameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <Card className="bg-card/30 border-emerald-500/20">
        <CardHeader>
          <CardTitle className="text-emerald-400">Money Game Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{games.length}</p>
              <p className="text-xs text-gray-500">Total Games</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{activeGames.length}</p>
              <p className="text-xs text-gray-500">Active Now</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">
                ${games.reduce((sum, game) => sum + game.pot, 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Total Money</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">
                ${Math.round(games.reduce((sum, game) => sum + game.billAmount, 0) / Math.max(games.length, 1))}
              </p>
              <p className="text-xs text-gray-500">Avg Bill</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}