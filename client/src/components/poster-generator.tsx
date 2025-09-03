import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { FileImage, Download, Palette, Type, Crown, Target, Zap } from "lucide-react";
import type { Player } from "@shared/schema";

const posterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  playerAId: z.string().min(1, "Select first player"),
  playerBId: z.string().min(1, "Select second player"),
  matchType: z.string().min(1, "Select match type"),
  entryFee: z.string().optional(),
  date: z.string().optional(),
  venue: z.string().optional(),
  theme: z.enum(["fight-night", "championship", "grudge-match", "tournament", "custom"]),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
});

type PosterFormData = z.infer<typeof posterSchema>;

interface GeneratedPoster {
  id: string;
  url: string;
  title: string;
  subtitle?: string;
  playerA: Player;
  playerB: Player;
  theme: string;
  createdAt: Date;
}

function CreatePosterDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const form = useForm<PosterFormData>({
    resolver: zodResolver(posterSchema),
    defaultValues: {
      title: "FIGHT NIGHT",
      subtitle: "",
      playerAId: "",
      playerBId: "",
      matchType: "8-Ball Race to 7",
      entryFee: "$500 WINNER TAKES ALL",
      date: "",
      venue: "ActionLadder Billiards",
      theme: "fight-night",
    },
  });

  const savePosterMutation = useMutation({
    mutationFn: async (posterData: PosterFormData) => {
      return apiRequest("POST", "/api/posters", posterData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posters"] });
      toast({
        title: "Poster Created!",
        description: "Your fight night poster has been generated and saved.",
      });
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create poster",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PosterFormData) => {
    savePosterMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700" data-testid="create-poster-button">
          <FileImage className="w-4 h-4 mr-2" />
          Create Fight Poster
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-black border-green-500/30">
        <DialogHeader>
          <DialogTitle className="text-white">Generate Fight Night Poster</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="playerAId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Player A</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-muted border-green-500/20">
                          <SelectValue placeholder="Select first player" />
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

              <FormField
                control={form.control}
                name="playerBId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Player B</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-muted border-green-500/20">
                          <SelectValue placeholder="Select second player" />
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

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Title</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-muted border-green-500/20" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Generate Poster
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PosterGallery() {
  const { data: posters = [] } = useQuery<GeneratedPoster[]>({
    queryKey: ["/api/posters"],
  });

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <FileImage className="w-5 h-5 mr-2 text-green-400" />
          Generated Posters
        </CardTitle>
      </CardHeader>
      <CardContent>
        {posters.length === 0 ? (
          <div className="text-center py-8">
            <FileImage className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No posters created yet</p>
            <p className="text-gray-500 text-sm mt-1">Generate your first fight night poster above</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {posters.map((poster) => (
              <div key={poster.id} className="border border-gray-600/30 rounded-lg p-4">
                <img src={poster.url} alt={poster.title} className="w-full h-32 object-cover rounded mb-2" />
                <div className="text-sm">
                  <div className="font-semibold text-white">{poster.title}</div>
                  {poster.subtitle && (
                    <div className="text-gray-400">{poster.subtitle}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {poster.playerA.name} vs {poster.playerB.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(poster.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PosterGenerator() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Poster Generator</h1>
          <p className="text-gray-400">Create professional fight night posters instantly</p>
        </div>
        <CreatePosterDialog />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PosterGallery />
        </div>
        
        <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Zap className="w-5 h-5 mr-2 text-green-400" />
              Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Type className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-white">Professional Typography</h4>
                  <p className="text-gray-400 text-sm">Bold, impactful fonts designed for maximum visual appeal</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Palette className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-white">Multiple Themes</h4>
                  <p className="text-gray-400 text-sm">Fight night, championship, grudge match, and custom themes</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Target className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-white">Player Integration</h4>
                  <p className="text-gray-400 text-sm">Automatically pulls player names, ratings, and rankings</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}