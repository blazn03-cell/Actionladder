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
import type { KellyPool, InsertKellyPool } from "@shared/schema";

const kellyPoolSchema = z.object({
  name: z.string().min(1, "Game name is required"),
  entry: z.number().min(1, "Entry fee must be at least $1"),
  maxPlayers: z.number().min(2, "Must allow at least 2 players").max(15, "Max 15 players for Kelly Pool"),
  table: z.string().min(1, "Table assignment is required"),
});

type KellyPoolFormData = z.infer<typeof kellyPoolSchema>;

const ballColors = [
  "🟡", "🔵", "🔴", "🟣", "🟠", "🟢", "🟤", "⚫",
  "🟡", "🔵", "🔴", "🟣", "🟠", "🟢", "🟤"
];

function CreateKellyPoolDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<KellyPoolFormData>({
    resolver: zodResolver(kellyPoolSchema),
    defaultValues: {
      name: "",
      entry: 20,
      maxPlayers: 8,
      table: "Table 1",
    },
  });

  const createKellyPoolMutation = useMutation({
    mutationFn: (data: InsertKellyPool) => apiRequest("POST", "/api/kelly-pools", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kelly-pools"] });
      toast({
        title: "Kelly Pool Created",
        description: "New Kelly Pool game has been started!",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create Kelly Pool",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: KellyPoolFormData) => {
    const balls = Array.from({ length: data.maxPlayers }, (_, i) => 
      i < ballColors.length ? String(i + 1) : "open"
    );

    const kellyPoolData: InsertKellyPool = {
      ...data,
      pot: 0,
      currentPlayers: 0,
      balls,
      status: "open",
    };

    createKellyPoolMutation.mutate(kellyPoolData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/50"
          data-testid="button-create-kelly-pool"
        >
          New Kelly Pool
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border border-neon-green/20">
        <DialogHeader>
          <DialogTitle className="text-white">Start New Kelly Pool</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Game Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Table 3 Kelly Pool" data-testid="input-kelly-pool-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Entry Fee ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-kelly-entry"
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
                    <FormLabel className="text-gray-300">Max Players</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-kelly-max-players"
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
                  <FormLabel className="text-gray-300">Table</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-kelly-table">
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 6 }, (_, i) => (
                        <SelectItem key={i + 1} value={`Table ${i + 1}`}>Table {i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                data-testid="button-cancel-kelly"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createKellyPoolMutation.isPending}
                className="bg-orange-500 text-white hover:bg-orange-600"
                data-testid="button-submit-kelly"
              >
                {createKellyPoolMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  "Start Game"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function KellyPoolCard({ kellyPool }: { kellyPool: KellyPool }) {
  const { toast } = useToast();

  const handleJoinGame = async () => {
    toast({
      title: "Joining Kelly Pool",
      description: "Redirecting to payment...",
    });
    
    window.location.href = `/checkout?type=kelly-pool&id=${kellyPool.id}&amount=${kellyPool.entry}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-neon-green/20 text-neon-green";
      case "active":
        return "bg-yellow-500/20 text-yellow-400";
      case "completed":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const progressPercentage = kellyPool.maxPlayers > 0 
    ? (kellyPool.currentPlayers / kellyPool.maxPlayers) * 100 
    : 0;

  return (
    <Card className="bg-gradient-to-r from-orange-500/20 to-transparent border border-orange-500/30 card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">{kellyPool.name}</CardTitle>
          <Badge className={getStatusColor(kellyPool.status)}>
            {kellyPool.status === "open" ? "Open" : kellyPool.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Ball Assignments */}
          <div className="grid grid-cols-4 gap-2">
            {kellyPool.balls?.slice(0, 8).map((ball, index) => (
              <div key={index} className="text-center p-2 bg-black/40 rounded">
                <div className="text-xs text-gray-400">Ball</div>
                <div className="font-bold text-orange-400">
                  {ball === "open" ? "Open" : `${ballColors[index]} ${ball}`}
                </div>
              </div>
            ))}
          </div>
          
          {/* Game Info */}
          <div className="text-sm text-gray-400">
            {kellyPool.currentPlayers} players • ${kellyPool.entry} each • {kellyPool.table}
          </div>
          
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Players:</span>
              <span className="text-orange-400 font-semibold">
                {kellyPool.currentPlayers}/{kellyPool.maxPlayers}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          
          {/* Pot Display */}
          <div className="text-center p-2 bg-black/40 rounded">
            <div className="text-xs text-gray-400">Current Pot</div>
            <div className="font-bold text-dollar-green text-lg">
              ${kellyPool.currentPlayers * kellyPool.entry}
            </div>
          </div>
          
          {kellyPool.status === "open" && (
            <Button 
              onClick={handleJoinGame}
              className="w-full bg-dollar-green/20 hover:bg-dollar-green/40 text-dollar-green"
              data-testid={`button-join-kelly-${kellyPool.id}`}
            >
              Join (${kellyPool.entry})
            </Button>
          )}
          
          {kellyPool.status === "active" && (
            <div className="text-center text-yellow-400 font-semibold">
              Game in Progress
            </div>
          )}
          
          {kellyPool.status === "completed" && (
            <div className="text-center text-gray-400">
              Game Completed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function KellyPoolRules() {
  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">🎲 Kelly Pool Rules</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-2">
            <span className="text-orange-400 font-bold">•</span>
            <span className="text-gray-300">
              Each player draws a numbered pill secretly - that's your target ball
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-orange-400 font-bold">•</span>
            <span className="text-gray-300">
              Winner is whoever's ball gets legally pocketed first
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-orange-400 font-bold">•</span>
            <span className="text-gray-300">
              Fast-paced game perfect for quick action between ladder matches
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-orange-400 font-bold">•</span>
            <span className="text-gray-300">
              Entry fees create instant pot - winner takes all
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function KellyPool() {
  const { data: kellyPools = [], isLoading } = useQuery<KellyPool[]>({
    queryKey: ["/api/kelly-pools"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" color="neon" />
      </div>
    );
  }

  const openGames = kellyPools.filter(k => k.status === "open");
  const activeGames = kellyPools.filter(k => k.status === "active");
  const completedGames = kellyPools.filter(k => k.status === "completed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">🎲 Kelly Pool</h1>
          <p className="text-gray-400">Quick games, instant action</p>
        </div>
        <CreateKellyPoolDialog />
      </div>

      {/* Rules */}
      <KellyPoolRules />

      {/* Open Games */}
      {openGames.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Open Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openGames.map((kellyPool) => (
              <KellyPoolCard key={kellyPool.id} kellyPool={kellyPool} />
            ))}
          </div>
        </div>
      )}

      {/* Active Games */}
      {activeGames.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">In Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGames.map((kellyPool) => (
              <KellyPoolCard key={kellyPool.id} kellyPool={kellyPool} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Games */}
      {completedGames.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Recent Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGames.slice(0, 6).map((kellyPool) => (
              <KellyPoolCard key={kellyPool.id} kellyPool={kellyPool} />
            ))}
          </div>
        </div>
      )}

      {kellyPools.length === 0 && (
        <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">No Kelly Pool games yet</div>
            <CreateKellyPoolDialog />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
