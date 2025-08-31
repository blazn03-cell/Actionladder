import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { DollarSign, Shield, Clock, Users, Trophy, AlertTriangle, CheckCircle, Lock } from "lucide-react";
import type { Player, Match } from "@shared/schema";

const betSchema = z.object({
  amount: z.number().min(60, "Minimum bet is $60").max(500000, "Maximum bet is $500,000"),
  opponentId: z.string().min(1, "Select an opponent"),
  gameType: z.enum(["8-ball", "9-ball", "10-ball", "one-pocket", "straight-pool"]),
  gameFormat: z.enum(["race-to-5", "race-to-7", "race-to-9", "single-game"]),
  terms: z.string().optional(),
});

type BetFormData = z.infer<typeof betSchema>;

interface EscrowBet {
  id: string;
  challengerId: string;
  opponentId: string;
  amount: number;
  gameType: string;
  gameFormat: string;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled" | "disputed";
  escrowId: string;
  terms?: string;
  challenger: Player;
  opponent: Player;
  winner?: string;
  createdAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
}

const gameTypes = [
  { value: "8-ball", label: "8-Ball", description: "Classic pool game" },
  { value: "9-ball", label: "9-Ball", description: "Fast-paced rotation" },
  { value: "10-ball", label: "10-Ball", description: "Call shot rotation" },
  { value: "one-pocket", label: "One Pocket", description: "Strategic game" },
  { value: "straight-pool", label: "Straight Pool", description: "14.1 continuous" },
];

const gameFormats = [
  { value: "race-to-5", label: "Race to 5", description: "First to 5 games" },
  { value: "race-to-7", label: "Race to 7", description: "First to 7 games" },
  { value: "race-to-9", label: "Race to 9", description: "First to 9 games" },
  { value: "single-game", label: "Single Game", description: "One game winner takes all" },
];

function CreateBetDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const form = useForm<BetFormData>({
    resolver: zodResolver(betSchema),
    defaultValues: {
      amount: 60,
      opponentId: "",
      gameType: "8-ball",
      gameFormat: "race-to-5",
      terms: "",
    },
  });

  const createBetMutation = useMutation({
    mutationFn: (data: BetFormData) => apiRequest("POST", "/api/escrow-bets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/escrow-bets"] });
      toast({
        title: "Challenge Created!",
        description: "Your bet has been placed in escrow. Waiting for opponent acceptance.",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bet",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BetFormData) => {
    createBetMutation.mutate(data);
  };

  const selectedAmount = form.watch("amount");
  const commissionRate = selectedAmount >= 100 ? 0.05 : 0.15; // 5% for members, 15% for non-members (simplified)
  const commission = selectedAmount * commissionRate;
  const payout = selectedAmount * 2 - commission;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white" data-testid="create-bet-button">
          <DollarSign className="w-4 h-4 mr-2" />
          Create Challenge
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-black/95 border border-green-500/30">
        <DialogHeader>
          <DialogTitle className="text-white">Create Escrow Challenge</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Bet Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={60}
                        max={500000}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="bg-black/50 border-green-500/30 text-white"
                        data-testid="bet-amount-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="opponentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Opponent</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black/50 border-green-500/30 text-white">
                          <SelectValue placeholder="Select opponent" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {players.map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name} ({player.rating} Fargo)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gameType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Game Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black/50 border-green-500/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {gameTypes.map((game) => (
                          <SelectItem key={game.value} value={game.value}>
                            {game.label} - {game.description}
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
                name="gameFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black/50 border-green-500/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {gameFormats.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label} - {format.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Additional Terms (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Best 2 out of 3, specific rules, etc."
                      className="bg-black/50 border-green-500/30 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bet Summary */}
            <Card className="bg-gray-900/50 border border-green-500/30">
              <CardContent className="p-4">
                <h4 className="font-semibold text-white mb-3">Bet Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Your stake:</span>
                    <span>${selectedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Opponent stake:</span>
                    <span>${selectedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Total pot:</span>
                    <span>${(selectedAmount * 2).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-orange-400">
                    <span>Commission ({(commissionRate * 100).toFixed(0)}%):</span>
                    <span>-${commission.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-green-500/30 pt-2">
                    <div className="flex justify-between font-semibold text-green-400">
                      <span>Winner payout:</span>
                      <span>${payout.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBetMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {createBetMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  "Create Challenge"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function BetCard({ bet }: { bet: EscrowBet }) {
  const { toast } = useToast();

  const acceptBetMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/escrow-bets/${bet.id}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/escrow-bets"] });
      toast({
        title: "Challenge Accepted!",
        description: "Funds are now in escrow. Good luck!",
      });
    },
  });

  const cancelBetMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/escrow-bets/${bet.id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/escrow-bets"] });
      toast({
        title: "Challenge Cancelled",
        description: "Your funds have been released from escrow.",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30';
      case 'accepted': return 'bg-blue-600/20 text-blue-400 border-blue-500/30';
      case 'in_progress': return 'bg-orange-600/20 text-orange-400 border-orange-500/30';
      case 'completed': return 'bg-green-600/20 text-green-400 border-green-500/30';
      case 'cancelled': return 'bg-gray-600/20 text-gray-400 border-gray-500/30';
      case 'disputed': return 'bg-red-600/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'accepted': return <Shield className="w-4 h-4" />;
      case 'in_progress': return <Users className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertTriangle className="w-4 h-4" />;
      case 'disputed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30" data-testid={`bet-card-${bet.id}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {bet.challenger.name} vs {bet.opponent.name}
            </h3>
            <p className="text-gray-400">{bet.gameType} • {bet.gameFormat}</p>
            {bet.terms && (
              <p className="text-xs text-gray-500 mt-1">{bet.terms}</p>
            )}
          </div>
          <Badge className={getStatusColor(bet.status)}>
            {getStatusIcon(bet.status)}
            <span className="ml-1 capitalize">{bet.status.replace('_', ' ')}</span>
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">${bet.amount.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Stake Each</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">${(bet.amount * 2).toLocaleString()}</div>
            <div className="text-xs text-gray-400">Total Pot</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-400">
              <Lock className="w-4 h-4 mx-auto mb-1" />
              Escrow
            </div>
            <div className="text-xs text-gray-400">Secured</div>
          </div>
        </div>

        <div className="flex space-x-2">
          {bet.status === 'pending' && (
            <>
              <Button
                onClick={() => acceptBetMutation.mutate()}
                disabled={acceptBetMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
                data-testid={`accept-bet-${bet.id}`}
              >
                {acceptBetMutation.isPending ? <LoadingSpinner size="sm" /> : "Accept"}
              </Button>
              <Button
                onClick={() => cancelBetMutation.mutate()}
                disabled={cancelBetMutation.isPending}
                variant="outline"
                className="flex-1"
                data-testid={`cancel-bet-${bet.id}`}
              >
                {cancelBetMutation.isPending ? <LoadingSpinner size="sm" /> : "Cancel"}
              </Button>
            </>
          )}
          {bet.status === 'accepted' && (
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Start Match
            </Button>
          )}
          {bet.status === 'completed' && bet.winner && (
            <div className="w-full text-center">
              <div className="text-green-400 font-semibold">
                <Trophy className="w-4 h-4 inline mr-1" />
                Winner: {bet.winner}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EscrowStats() {
  const { data: stats } = useQuery({
    queryKey: ["/api/escrow-bets/stats"],
  });

  const escrowStats = stats as any || {
    totalVolume: 0,
    activeBets: 0,
    completedBets: 0,
    totalEscrow: 0,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400">${escrowStats.totalVolume.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Total Volume</div>
        </CardContent>
      </Card>
      <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{escrowStats.activeBets}</div>
          <div className="text-xs text-gray-400">Active Bets</div>
        </CardContent>
      </Card>
      <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{escrowStats.completedBets}</div>
          <div className="text-xs text-gray-400">Completed</div>
        </CardContent>
      </Card>
      <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">${escrowStats.totalEscrow.toLocaleString()}</div>
          <div className="text-xs text-gray-400">In Escrow</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EscrowBetting() {
  const { data: bets = [], isLoading } = useQuery<EscrowBet[]>({
    queryKey: ["/api/escrow-bets"],
  });

  const pendingBets = bets.filter(bet => bet.status === 'pending');
  const activeBets = bets.filter(bet => ['accepted', 'in_progress'].includes(bet.status));
  const completedBets = bets.filter(bet => bet.status === 'completed');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" color="neon" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Escrow Betting</h1>
          <p className="text-gray-400">Secure, automated betting with guaranteed payouts</p>
        </div>
        <CreateBetDialog />
      </div>

      <EscrowStats />

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-black/50">
          <TabsTrigger value="pending">
            Pending ({pendingBets.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({activeBets.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedBets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingBets.length === 0 ? (
            <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
              <CardContent className="p-8 text-center">
                <DollarSign className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">No Pending Challenges</h3>
                <p className="text-gray-500">Create a challenge to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingBets.map(bet => (
                <BetCard key={bet.id} bet={bet} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeBets.length === 0 ? (
            <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">No Active Matches</h3>
                <p className="text-gray-500">Accept a challenge or create one to start playing</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeBets.map(bet => (
                <BetCard key={bet.id} bet={bet} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedBets.length === 0 ? (
            <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">No Completed Matches</h3>
                <p className="text-gray-500">Results will appear here once matches are finished</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {completedBets.map(bet => (
                <BetCard key={bet.id} bet={bet} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}