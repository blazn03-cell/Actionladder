import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Player, InsertPlayer } from "@shared/schema";
import { Brain, Target } from "lucide-react";

const playerSchema = z.object({
  name: z.string().min(1, "Player name is required"),
  rating: z.number().min(200, "Rating must be at least 200").max(800, "Rating cannot exceed 800"),
  city: z.string().min(1, "City is required"),
  member: z.boolean(),
  theme: z.string().optional(),
  points: z.number().min(0, "Points cannot be negative").max(5000, "Points cannot exceed 5000"),
  birthday: z.string().optional(),
});

type PlayerFormData = z.infer<typeof playerSchema>;

const cities = ["Seguin", "New Braunfels", "San Marcos", "Austin", "San Antonio"];

function CreatePlayerDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: "",
      rating: 500,
      city: "Seguin",
      member: false,
      theme: "",
      points: 800,
      birthday: "",
    },
  });

  const createPlayerMutation = useMutation({
    mutationFn: (data: InsertPlayer) =>
      apiRequest("/api/players", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Player Added",
        description: "New player has been successfully added to the ladder!",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add player",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PlayerFormData) => {
    const playerData: InsertPlayer = {
      ...data,
      respectPoints: 0,
      streak: 0,
      stripeCustomerId: null,
    };
    createPlayerMutation.mutate(playerData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-neon-green/20 hover:bg-neon-green/30 text-neon-green border border-neon-green/50"
          data-testid="button-create-player"
        >
          Add Player
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border border-neon-green/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Player</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Player Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Pool Shark" data-testid="input-player-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Fargo Rating</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-player-rating"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">City</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-player-city">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
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
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Starting Points</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-player-points"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Walk-up Theme Song (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Eye of the Tiger" data-testid="input-player-theme" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthday"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Birthday (MM-DD, Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="03-15"
                      pattern="[0-9]{2}-[0-9]{2}"
                      data-testid="input-player-birthday"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="member"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-neon-green/20 p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-gray-300">Membership</FormLabel>
                    <div className="text-sm text-gray-400">
                      Members pay 5% commission, non-members pay 15%
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-player-member"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel-player"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPlayerMutation.isPending}
                className="bg-neon-green text-felt-dark hover:bg-neon-green/90"
                data-testid="button-submit-player"
              >
                {createPlayerMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  "Add Player"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PlayerCard({ player }: { player: Player }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [showAiContent, setShowAiContent] = useState(false);

  const deletePlayerMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/players/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Player Removed",
        description: "Player has been removed from the ladder",
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

  const analyzePerformanceMutation = useMutation({
    mutationFn: (playerId: string) =>
      fetch(`/api/ai/performance-analysis/${playerId}`).then((res) => res.json()),
    onSuccess: (data) => {
      setAiAnalysis(data.analysis);
      setShowAiContent(true);
      toast({
        title: "AI Analysis Complete!",
        description: "Performance insights are ready.",
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Unable to generate AI analysis at this time.",
        variant: "destructive",
      });
    },
  });

  const getCoachingAdviceMutation = useMutation({
    mutationFn: (playerId: string) =>
      fetch("/api/ai/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      }).then((res) => res.json()),
    onSuccess: (data) => {
      setAiAdvice(data.advice);
      setShowAiContent(true);
      toast({
        title: "AI Coaching Ready!",
        description: "Personalized advice is available.",
      });
    },
    onError: () => {
      toast({
        title: "Coaching Failed",
        description: "Unable to generate coaching advice at this time.",
        variant: "destructive",
      });
    },
  });

  const handleRemovePlayer = () => {
    if (
      confirm(
        `Are you sure you want to remove ${player.name}? Their match history will remain.`
      )
    ) {
      deletePlayerMutation.mutate(player.id);
    }
  };

  const division = player.rating >= 600 ? "600+ Killers" : "599 & Under";
  const divisionColor = player.rating >= 600 ? "text-yellow-400" : "text-accent";

  const isBirthdayToday = () => {
    if (!player.birthday) return false;
    const today = new Date();
    const currentMonth = String(today.getMonth() + 1).padStart(2, "0");
    const currentDay = String(today.getDate()).padStart(2, "0");
    const todayString = `${currentMonth}-${currentDay}`;
    return player.birthday === todayString;
  };

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-neon-green to-accent rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-felt-dark">
                {player.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div>
              <CardTitle className="text-white flex items-center space-x-2">
                <span>{player.name}</span>
                {isBirthdayToday() && <span className="text-xl">🎂</span>}
              </CardTitle>
              <p className="text-sm text-gray-400">{player.city}</p>
            </div>
          </div>
          <Button
            onClick={handleRemovePlayer}
            disabled={deletePlayerMutation.isPending}
            variant="destructive"
            size="sm"
            data-testid={`button-remove-player-${player.id}`}
          >
            Remove
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Division:</span>
            <Badge className={`${divisionColor} bg-transparent border`}>
              {division}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Rating:</span>
              <span className="text-white font-semibold">{player.rating}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Points:</span>
              <span className="text-neon-green font-semibold">{player.points}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Streak:</span>
              <span className="text-white font-semibold flex items-center space-x-1">
                <span>{player.streak || 0}</span>
                {(player.streak || 0) >= 3 && <span className="text-orange-400">🔥</span>}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Respect:</span>
              <span className="text-accent font-semibold">{player.respectPoints || 0}</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Status:</span>
            <Badge
              variant={player.member ? "default" : "secondary"}
              className={
                player.member
                  ? "bg-neon-green/20 text-neon-green"
                  : "bg-gray-600/20 text-gray-400"
              }
            >
              {player.member ? "Member (5%)" : "Non-member (15%)"}
            </Badge>
          </div>

          {player.theme && (
            <div className="bg-gradient-to-r from-purple-600/20 to-transparent border border-purple-500/30 rounded-lg p-2">
              <div className="text-xs text-gray-400">Walk-up Theme:</div>
              <div className="text-sm text-purple-400 italic">"{player.theme}"</div>
            </div>
          )}

          {player.birthday && (
            <div
              className={`bg-gradient-to-r ${
                isBirthdayToday()
                  ? "from-yellow-600/20 to-transparent border-yellow-500/30"
                  : "from-blue-600/20 to-transparent border-blue-500/30"
              } border rounded-lg p-2`}
            >
              <div className="text-xs text-gray-400">Birthday:</div>
              <div
                className={`text-sm ${
                  isBirthdayToday() ? "text-yellow-400" : "text-blue-400"
                }`}
              >
                {player.birthday} {isBirthdayToday() && "🎉 TODAY!"}
              </div>
            </div>
          )}

          <div className="border-t border-green-500/20 pt-3 mt-3">
            <div className="flex space-x-2 mb-3">
              <Button
                onClick={() => analyzePerformanceMutation.mutate(player.id)}
                disabled={analyzePerformanceMutation.isPending}
                size="sm"
                variant="outline"
                className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10"
                data-testid={`button-ai-analysis-${player.id}`}
              >
                {analyzePerformanceMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-1" />
                    AI Analysis
                  </>
                )}
              </Button>
              <Button
                onClick={() => getCoachingAdviceMutation.mutate(player.id)}
                disabled={getCoachingAdviceMutation.isPending}
                size="sm"
                variant="outline"
                className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10"
                data-testid={`button-ai-coaching-${player.id}`}
              >
                {getCoachingAdviceMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-1" />
                    AI Coach
                  </>
                )}
              </Button>
            </div>

            {showAiContent && (aiAnalysis || aiAdvice) && (
              <div className="space-y-3">
                {aiAnalysis && (
                  <div className="bg-gray-900/50 border border-green-500/20 rounded-lg p-3">
                    <h4 className="text-green-400 font-semibold mb-2 flex items-center">
                      <Brain className="w-4 h-4 mr-1" />
                      AI Performance Analysis
                    </h4>
                    <div className="text-xs text-gray-300 whitespace-pre-wrap">
                      {aiAnalysis}
                    </div>
                  </div>
                )}
                {aiAdvice && (
                  <div className="bg-gray-900/50 border border-green-500/20 rounded-lg p-3">
                    <h4 className="text-green-400 font-semibold mb-2 flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      AI Coaching Advice
                    </h4>
                    <div className="text-xs text-gray-300 whitespace-pre-wrap">
                      {aiAdvice}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BirthdayPlayers({ players }: { players: Player[] }) {
  const today = new Date();
  const currentMonth = String(today.getMonth() + 1).padStart(2, "0");
  const currentDay = String(today.getDate()).padStart(2, "0");
  const todayString = `${currentMonth}-${currentDay}`;

  const birthdayPlayers = players.filter((p) => p.birthday === todayString);
  const thisMonthBirthdays = players.filter(
    (p) =>
      p.birthday &&
      p.birthday.startsWith(currentMonth) &&
      p.birthday !== todayString
  );

  if (birthdayPlayers.length === 0 && thisMonthBirthdays.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-yellow-600/20 to-transparent border border-yellow-500/30">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center">
          <span className="mr-2">🎂</span>
          Birthday Benefits
        </CardTitle>
      </CardHeader>
      <CardContent>
        {birthdayPlayers.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-semibold text-yellow-400 mb-2">
              🎉 Today's Birthdays:
            </div>
            {birthdayPlayers.map((player) => (
              <div
                key={player.id}
                className="text-sm text-white flex items-center space-x-2"
              >
                <span>•</span>
                <span>{player.name}</span>
                <Badge className="bg-yellow-500/20 text-yellow-300">Free Entry!</Badge>
              </div>
            ))}
          </div>
        )}
        {thisMonthBirthdays.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-yellow-400 mb-2">This Month:</div>
            {thisMonthBirthdays.map((player) => (
              <div key={player.id} className="text-sm text-white">
                • {player.name} ({player.birthday})
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Players() {
  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" color="neon" />
      </div>
    );
  }

  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);
  const hiDivisionPlayers = players.filter((p) => p.rating >= 600);
  const loDivisionPlayers = players.filter((p) => p.rating < 600);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">👥 Players</h1>
          <p className="text-gray-400">Manage ladder participants</p>
        </div>
        <CreatePlayerDialog />
      </div>

      <BirthdayPlayers players={players} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-neon-green">{players.length}</div>
            <div className="text-sm text-gray-400">Total Players</div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {hiDivisionPlayers.length}
            </div>
            <div className="text-sm text-gray-400">600+ Division</div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">
              {loDivisionPlayers.length}
            </div>
            <div className="text-sm text-gray-400">599 & Under</div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-dollar-green">
              {players.filter((p) => p.member).length}
            </div>
            <div className="text-sm text-gray-400">Members</div>
          </CardContent>
        </Card>
      </div>

      {players.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      ) : (
        <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">No players registered yet</div>
            <CreatePlayerDialog />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
