import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Bounty, InsertBounty, Player } from "@shared/schema";

const bountySchema = z.object({
  type: z.enum(["onRank", "onPlayer"]),
  rank: z.number().min(1, "Rank must be at least 1").optional(),
  targetId: z.string().optional(),
  prize: z.number().min(1, "Prize must be at least $1"),
  description: z.string().min(1, "Description is required"),
}).refine((data) => {
  if (data.type === "onRank" && !data.rank) {
    return false;
  }
  if (data.type === "onPlayer" && !data.targetId) {
    return false;
  }
  return true;
}, {
  message: "Rank is required for rank bounties and target player is required for player bounties",
  path: ["rank"],
});

type BountyFormData = z.infer<typeof bountySchema>;

function CreateBountyDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const form = useForm<BountyFormData>({
    resolver: zodResolver(bountySchema),
    defaultValues: {
      type: "onRank",
      rank: 1,
      targetId: "",
      prize: 50,
      description: "",
    },
  });

  const watchType = form.watch("type");

  const createBountyMutation = useMutation({
    mutationFn: (data: InsertBounty) => 
      apiRequest("/api/bounties", { 
        method: "POST", 
        body: JSON.stringify(data) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bounties"] });
      toast({
        title: "Bounty Created",
        description: "New bounty has been posted!",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bounty",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BountyFormData) => {
    const bountyData: InsertBounty = {
      ...data,
      active: true,
    };
    createBountyMutation.mutate(bountyData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
          data-testid="button-create-bounty"
        >
          Post Bounty
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border border-neon-green/20">
        <DialogHeader>
          <DialogTitle className="text-white">Post New Bounty</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Bounty Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-bounty-type">
                        <SelectValue placeholder="Select bounty type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="onRank">Beat Rank ≤ X</SelectItem>
                      <SelectItem value="onPlayer">Beat Specific Player</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchType === "onRank" && (
              <FormField
                control={form.control}
                name="rank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Target Rank</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder="1"
                        data-testid="input-bounty-rank"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchType === "onPlayer" && (
              <FormField
                control={form.control}
                name="targetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Target Player</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-bounty-target">
                          <SelectValue placeholder="Select target player" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {players.map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name} ({player.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="prize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Prize ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      data-testid="input-bounty-prize"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Beat the King of 600+ Division"
                      data-testid="input-bounty-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel-bounty"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBountyMutation.isPending}
                className="bg-red-500 text-white hover:bg-red-600"
                data-testid="button-submit-bounty"
              >
                {createBountyMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  "Post Bounty"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function BountyCard({ bounty, players }: { bounty: Bounty; players: Player[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const claimBountyMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/bounties/${id}`, { 
        method: "PUT", 
        body: JSON.stringify({ active: false }) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bounties"] });
      toast({
        title: "Bounty Claimed",
        description: "Bounty has been marked as claimed!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to claim bounty",
        variant: "destructive",
      });
    },
  });

  const handleClaimBounty = () => {
    if (confirm("Mark this bounty as claimed?")) {
      claimBountyMutation.mutate(bounty.id);
    }
  };

  const getTargetPlayerName = (targetId: string) => {
    return players.find(p => p.id === targetId)?.name || "Unknown Player";
  };

  const getBountyTitle = () => {
    if (bounty.type === "onRank") {
      return `Defeat rank ≤ ${bounty.rank}`;
    } else {
      return `Defeat ${getTargetPlayerName(bounty.targetId || "")}`;
    }
  };

  return (
    <Card className={`border card-hover ${bounty.active ? 'border-red-500/30 bg-gradient-to-r from-red-600/20 to-transparent' : 'border-gray-500/30 bg-gradient-to-r from-gray-600/20 to-transparent'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">{getBountyTitle()}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className={`${bounty.active ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
              ${bounty.prize}
            </Badge>
            <Badge className={bounty.active ? "bg-neon-green/20 text-neon-green" : "bg-gray-500/20 text-gray-400"}>
              {bounty.active ? "Active" : "Claimed"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-gray-300">{bounty.description}</p>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Type: {bounty.type === "onRank" ? "Rank Challenge" : "Player Target"}
            </div>
            {bounty.active && (
              <Button
                onClick={handleClaimBounty}
                disabled={claimBountyMutation.isPending}
                size="sm"
                className="bg-red-500/20 hover:bg-red-500/40 text-red-400"
                data-testid={`button-claim-bounty-${bounty.id}`}
              >
                Mark as Claimed
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AutoBountyInfo() {
  return (
    <Card className="bg-gradient-to-r from-yellow-600/20 to-transparent border border-yellow-500/30">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center">
          <span className="mr-2">⚡</span> Auto-Bounties
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-2">
            <span className="text-yellow-400 font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">King of 600+ Division:</span> Automatic $50 bounty
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-yellow-400 font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">King of 599 & Under:</span> Automatic $30 bounty
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-yellow-400 font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Long Streaks:</span> Auto-bounty increases with streak length
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-3">
            Auto-bounties refresh when a new king is crowned or streak is broken
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BountyRules() {
  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">🎯 Bounty Rules</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-2">
            <span className="text-red-400 font-bold">•</span>
            <span className="text-gray-300">
              Bounties are paid out when conditions are met in official ladder matches
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-red-400 font-bold">•</span>
            <span className="text-gray-300">
              Multiple players can work toward the same bounty
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-red-400 font-bold">•</span>
            <span className="text-gray-300">
              Bounty poster pays the winner - house facilitates but doesn't fund
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-red-400 font-bold">•</span>
            <span className="text-gray-300">
              Auto-bounties are house-funded and reset when conditions change
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Bounties() {
  const { data: bounties = [], isLoading: bountiesLoading, error: bountiesError } = useQuery<Bounty[]>({
    queryKey: ["/api/bounties"],
  });

  const { data: players = [], isLoading: playersLoading, error: playersError } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  if (bountiesLoading || playersLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" color="neon" />
      </div>
    );
  }

  if (bountiesError || playersError) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-400">
          Error loading data: {(bountiesError as Error)?.message || (playersError as Error)?.message}
        </div>
      </div>
    );
  }

  const activeBounties = bounties.filter(b => b.active);
  const claimedBounties = bounties.filter(b => !b.active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">🎯 Bounties</h1>
          <p className="text-gray-400">Challenge the best, collect the rewards</p>
        </div>
        <CreateBountyDialog />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AutoBountyInfo />
        <BountyRules />
      </div>

      {/* Active Bounties */}
      {activeBounties.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">🔥 Active Bounties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeBounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} players={players} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Claimed */}
      {claimedBounties.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">💰 Recently Claimed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {claimedBounties.slice(0, 6).map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} players={players} />
            ))}
          </div>
        </div>
      )}

      {bounties.length === 0 && (
        <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">No bounties posted yet</div>
            <CreateBountyDialog />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
