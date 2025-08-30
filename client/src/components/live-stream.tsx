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
import { Brain, Mic, BarChart3 } from "lucide-react";
import type { LiveStream, InsertLiveStream, Match, Player } from "@shared/schema";

const liveStreamSchema = z.object({
  platform: z.enum(["twitch", "youtube", "facebook", "tiktok"]),
  url: z.string().url("Must be a valid URL"),
  title: z.string().min(1, "Title is required"),
  matchId: z.string().optional(),
});

type LiveStreamFormData = z.infer<typeof liveStreamSchema>;

const platforms = [
  { value: "twitch", label: "Twitch", color: "text-purple-400" },
  { value: "youtube", label: "YouTube", color: "text-red-400" },
  { value: "facebook", label: "Facebook", color: "text-blue-400" },
  { value: "tiktok", label: "TikTok", color: "text-pink-400" },
];

function CreateStreamDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const form = useForm<LiveStreamFormData>({
    resolver: zodResolver(liveStreamSchema),
    defaultValues: {
      platform: "twitch",
      url: "",
      title: "",
      matchId: "",
    },
  });

  const createStreamMutation = useMutation({
    mutationFn: (data: InsertLiveStream) => apiRequest("POST", "/api/live-streams", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-streams"] });
      toast({
        title: "Stream Added",
        description: "Live stream has been added to the system!",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add stream",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LiveStreamFormData) => {
    const streamData: InsertLiveStream = {
      ...data,
      isLive: true,
      viewerCount: Math.floor(Math.random() * 100) + 20, // Simulate viewer count
    };

    createStreamMutation.mutate(streamData);
  };

  const scheduledMatches = matches.filter(m => m.status === "scheduled");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
          data-testid="button-create-stream"
        >
          Go Live
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border border-neon-green/20">
        <DialogHeader>
          <DialogTitle className="text-white">Start Live Stream</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Platform</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-stream-platform">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
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
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Stream URL</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="https://twitch.tv/your-channel" 
                      data-testid="input-stream-url"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Stream Title</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Friday Night Fights - Table 2"
                      data-testid="input-stream-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="matchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Associated Match (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-stream-match">
                        <SelectValue placeholder="Select match" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No specific match</SelectItem>
                      {scheduledMatches.map((match) => (
                        <SelectItem key={match.id} value={match.id}>
                          {match.challenger} vs {match.opponent} - {match.game}
                        </SelectItem>
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
                data-testid="button-cancel-stream"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createStreamMutation.isPending}
                className="bg-red-500 text-white hover:bg-red-600"
                data-testid="button-submit-stream"
              >
                {createStreamMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  "Go Live"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AIStreamCommentary({ stream }: { stream: LiveStream }) {
  const [commentary, setCommentary] = useState<string | null>(null);
  const [showCommentary, setShowCommentary] = useState(false);
  const { toast } = useToast();

  const generateCommentaryMutation = useMutation({
    mutationFn: () =>
      fetch('/api/ai/match-commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          challengerId: "player1", // Would be actual player from match
          opponentId: "player2" 
        })
      }).then(res => res.json()),
    onSuccess: (data) => {
      setCommentary(data.commentary);
      setShowCommentary(true);
      toast({ 
        title: "AI Commentary Ready!", 
        description: "Live match commentary generated." 
      });
    },
    onError: () => {
      toast({ 
        title: "Commentary Failed", 
        description: "Unable to generate live commentary.",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="border-t border-green-500/20 pt-3 mt-3">
      <Button
        onClick={() => generateCommentaryMutation.mutate()}
        disabled={generateCommentaryMutation.isPending}
        size="sm"
        variant="outline"
        className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10"
        data-testid={`button-ai-commentary-${stream.id}`}
      >
        {generateCommentaryMutation.isPending ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <Brain className="w-4 h-4 mr-2" />
            AI Live Commentary
          </>
        )}
      </Button>

      {/* AI Commentary Display */}
      {showCommentary && commentary && (
        <div className="bg-gray-900/50 border border-green-500/20 rounded-lg p-3 mt-3">
          <h4 className="text-green-400 font-semibold mb-2 flex items-center">
            <Mic className="w-4 h-4 mr-1" />
            AI Match Commentary
          </h4>
          <div className="text-xs text-gray-300 whitespace-pre-wrap">
            {commentary}
          </div>
        </div>
      )}
    </div>
  );
}

function StreamCard({ stream, players }: { stream: LiveStream; players: Player[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleStreamMutation = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/live-streams/${stream.id}`, { isLive: !stream.isLive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-streams"] });
      toast({
        title: stream.isLive ? "Stream Ended" : "Stream Started",
        description: `Stream has been ${stream.isLive ? "taken offline" : "brought online"}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update stream",
        variant: "destructive",
      });
    },
  });

  const updateViewersMutation = useMutation({
    mutationFn: () => {
      const newViewerCount = Math.floor(Math.random() * 150) + 20;
      return apiRequest("PUT", `/api/live-streams/${stream.id}`, { viewerCount: newViewerCount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-streams"] });
    },
  });

  const platform = platforms.find(p => p.value === stream.platform);
  const platformColor = platform?.color || "text-gray-400";

  const handleWatchStream = () => {
    window.open(stream.url, '_blank');
  };

  const handleRefreshViewers = () => {
    updateViewersMutation.mutate();
  };

  return (
    <Card className={`border card-hover ${stream.isLive ? 'border-red-500/30 bg-gradient-to-r from-red-600/20 to-transparent' : 'border-gray-500/30 bg-gradient-to-r from-gray-600/20 to-transparent'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">{stream.title}</CardTitle>
          <div className="flex items-center space-x-2">
            {stream.isLive && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-400 font-semibold">LIVE</span>
              </div>
            )}
            <Badge className={`${platformColor} bg-transparent border`}>
              {platform?.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stream Preview */}
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&h=225&fit=crop&crop=center" 
              alt="Pool table stream" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40"></div>
            {stream.isLive && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/70 rounded-lg p-2">
                  <div className="text-sm font-semibold text-white">{stream.title}</div>
                  <div className="text-xs text-gray-300">
                    {stream.viewerCount} watching • {platform?.label}
                  </div>
                </div>
              </div>
            )}
            <button 
              onClick={handleWatchStream}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-16 h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </button>
          </div>
          
          {/* Stream Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Viewers:</span>
              <span className={`font-semibold ${stream.isLive ? 'text-red-400' : 'text-gray-400'}`}>
                {stream.viewerCount}
              </span>
              {stream.isLive && (
                <Button
                  onClick={handleRefreshViewers}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  data-testid={`button-refresh-viewers-${stream.id}`}
                >
                  🔄
                </Button>
              )}
            </div>
            <Button
              onClick={() => toggleStreamMutation.mutate()}
              disabled={toggleStreamMutation.isPending}
              size="sm"
              className={stream.isLive ? "bg-red-500/20 hover:bg-red-500/40 text-red-400" : "bg-neon-green/20 hover:bg-neon-green/40 text-neon-green"}
              data-testid={`button-toggle-stream-${stream.id}`}
            >
              {stream.isLive ? "End Stream" : "Go Live"}
            </Button>
          </div>
          
          {/* Platform Links */}
          <div className="flex space-x-2">
            <Button 
              onClick={handleWatchStream}
              className={`flex-1 ${platformColor} bg-transparent border`}
              variant="outline"
              data-testid={`button-watch-stream-${stream.id}`}
            >
              Watch on {platform?.label}
            </Button>
          </div>

          {/* AI Commentary Section */}
          {stream.isLive && <AIStreamCommentary stream={stream} />}
        </div>
      </CardContent>
    </Card>
  );
}

function StreamingGuidelines() {
  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">📹 Streaming Guidelines</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-2">
            <span className="text-red-400 font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Professional Conduct:</span> Keep commentary clean and respectful
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-red-400 font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Quality Audio:</span> Clear commentary enhances viewer experience
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-red-400 font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Good Angles:</span> Multiple camera views of table action preferred
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-red-400 font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Community Focus:</span> Highlight player stories and respect achievements
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StreamStats({ streams }: { streams: LiveStream[] }) {
  const liveStreams = streams.filter(s => s.isLive);
  const totalViewers = liveStreams.reduce((sum, stream) => sum + (stream.viewerCount || 0), 0);
  const popularPlatform = streams.reduce((acc, stream) => {
    acc[stream.platform] = (acc[stream.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostUsedPlatform = Object.entries(popularPlatform).sort(([,a], [,b]) => b - a)[0];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{liveStreams.length}</div>
          <div className="text-sm text-gray-400">Live Now</div>
        </CardContent>
      </Card>
      <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-neon-green">{totalViewers}</div>
          <div className="text-sm text-gray-400">Total Viewers</div>
        </CardContent>
      </Card>
      <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{streams.length}</div>
          <div className="text-sm text-gray-400">Total Streams</div>
        </CardContent>
      </Card>
      <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {mostUsedPlatform ? mostUsedPlatform[0] : "N/A"}
          </div>
          <div className="text-sm text-gray-400">Top Platform</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LiveStream() {
  const { data: streams = [], isLoading: streamsLoading } = useQuery<LiveStream[]>({
    queryKey: ["/api/live-streams"],
  });

  const { data: players = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  if (streamsLoading || playersLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" color="neon" />
      </div>
    );
  }

  const liveStreams = streams.filter(s => s.isLive);
  const offlineStreams = streams.filter(s => !s.isLive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">🎥 Live Streams</h1>
          <p className="text-gray-400">Broadcast the action live</p>
        </div>
        <CreateStreamDialog />
      </div>

      {/* Stats */}
      <StreamStats streams={streams} />

      {/* Guidelines */}
      <StreamingGuidelines />

      {/* Live Streams */}
      {liveStreams.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <span>🔴 Live Now</span>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveStreams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} players={players} />
            ))}
          </div>
        </div>
      )}

      {/* Offline Streams */}
      {offlineStreams.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">📺 Offline Streams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offlineStreams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} players={players} />
            ))}
          </div>
        </div>
      )}

      {streams.length === 0 && (
        <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">No streams configured yet</div>
            <CreateStreamDialog />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
