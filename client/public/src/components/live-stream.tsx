import { useState, useMemo } from "react";
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
import { Video, MapPin, Users, Eye, Search, Filter, Play, Square, Trash2, RefreshCw, Clock, TrendingUp } from "lucide-react";
import type { LiveStream, InsertLiveStream } from "@shared/schema";

const liveStreamSchema = z.object({
  platform: z.enum(["twitch", "youtube", "facebook", "tiktok", "kick", "other"]),
  url: z.string().url("Must be a valid URL"),
  title: z.string().min(1, "Title is required"),
  poolHallName: z.string().min(1, "Pool hall name is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required").max(2, "Use 2-letter state code"),
  category: z.enum(["tournament", "casual", "practice", "event"]),
  quality: z.enum(["hd", "fhd", "4k"]),
});

type LiveStreamFormData = z.infer<typeof liveStreamSchema>;

const platforms = [
  { value: "twitch", label: "Twitch", color: "text-purple-400", bgColor: "bg-purple-900/20", icon: "🎮" },
  { value: "youtube", label: "YouTube", color: "text-red-400", bgColor: "bg-red-900/20", icon: "📺" },
  { value: "facebook", label: "Facebook", color: "text-blue-400", bgColor: "bg-blue-900/20", icon: "📘" },
  { value: "tiktok", label: "TikTok", color: "text-pink-400", bgColor: "bg-pink-900/20", icon: "🎵" },
  { value: "kick", label: "Kick", color: "text-green-400", bgColor: "bg-green-900/20", icon: "⚡" },
  { value: "other", label: "Other", color: "text-gray-400", bgColor: "bg-gray-900/20", icon: "🌐" },
];

const categories = [
  { value: "tournament", label: "Tournament", icon: "🏆", color: "text-yellow-400" },
  { value: "casual", label: "Casual Play", icon: "🎱", color: "text-emerald-400" },
  { value: "practice", label: "Practice", icon: "🎯", color: "text-blue-400" },
  { value: "event", label: "Special Event", icon: "⭐", color: "text-purple-400" },
];

function CreateStreamDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LiveStreamFormData>({
    resolver: zodResolver(liveStreamSchema),
    defaultValues: {
      platform: "twitch",
      url: "",
      title: "",
      poolHallName: "",
      city: "",
      state: "",
      category: "casual",
      quality: "hd",
    },
  });

  const createStreamMutation = useMutation({
    mutationFn: (data: InsertLiveStream) => apiRequest("POST", "/api/live-streams", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-streams"] });
      toast({
        title: "Stream Created Successfully",
        description: "Your live stream has been added to the ActionLadder network!",
        duration: 5000,
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Stream",
        description: error.message || "Unable to create stream. Please check your details and try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const onSubmit = (data: LiveStreamFormData) => {
    const streamData: InsertLiveStream = {
      ...data,
      isLive: true,
      viewerCount: Math.floor(Math.random() * 50) + 10,
      embedUrl: data.url,
      thumbnailUrl: `https://images.unsplash.com/photo-1574847187621-916885951c64?w=400&h=225&fit=crop&crop=center&q=80`,
      tags: [],
    };
    createStreamMutation.mutate(streamData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700" data-testid="create-stream-button">
          <Video className="w-4 h-4 mr-2" />
          Start Streaming
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-black border-green-500/30">
        <DialogHeader>
          <DialogTitle className="text-white">Start Live Stream</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Stream Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Live Pool Action from..." className="bg-muted border-green-500/20" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Platform</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-muted border-green-500/20">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {platforms.map((platform) => (
                          <SelectItem key={platform.value} value={platform.value}>
                            {platform.icon} {platform.label}
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-muted border-green-500/20">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.icon} {category.label}
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
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Stream URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://twitch.tv/your-channel" className="bg-muted border-green-500/20" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">
                Start Stream
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function StreamCard({ stream }: { stream: LiveStream }) {
  const { toast } = useToast();
  const platform = platforms.find(p => p.value === stream.platform);
  const category = categories.find(c => c.value === stream.category);

  const handleWatch = () => {
    window.open(stream.url, '_blank');
  };

  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-green-500/30 hover:border-green-400/50 transition-all">
      <CardContent className="p-4">
        <div className="aspect-video bg-gray-900 rounded-lg mb-4 relative overflow-hidden">
          {stream.thumbnailUrl && (
            <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover" />
          )}
          <div className="absolute top-2 left-2">
            {stream.isLive ? (
              <Badge className="bg-red-600 text-white border-0">
                <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                LIVE
              </Badge>
            ) : (
              <Badge className="bg-gray-600 text-white border-0">
                OFFLINE
              </Badge>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <Badge className={platform?.bgColor + " " + platform?.color}>
              {platform?.icon} {platform?.label}
            </Badge>
          </div>
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {stream.quality?.toUpperCase()}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-white line-clamp-2">{stream.title}</h3>
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span className="flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {stream.poolHallName}
            </span>
            <span className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {stream.viewerCount || 0} viewers
            </span>
          </div>
          <div className="flex items-center justify-between">
            <Badge className={category?.color + " bg-opacity-20"}>
              {category?.icon} {category?.label}
            </Badge>
            <Button size="sm" onClick={handleWatch} className="bg-green-600 hover:bg-green-700">
              <Play className="w-3 h-3 mr-1" />
              Watch
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LiveStream() {
  const { data: streams = [], isLoading } = useQuery<LiveStream[]>({
    queryKey: ["/api/live-streams"],
    refetchInterval: 30000,
  });

  const [filters, setFilters] = useState({
    search: "",
    platform: "",
    category: "",
    status: "",
  });

  const filteredStreams = useMemo(() => {
    return streams.filter(stream => {
      const matchesSearch = !filters.search || 
        stream.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        stream.poolHallName?.toLowerCase().includes(filters.search.toLowerCase());
      const matchesPlatform = !filters.platform || stream.platform === filters.platform;
      const matchesCategory = !filters.category || stream.category === filters.category;
      const matchesStatus = !filters.status || 
        (filters.status === "live" && stream.isLive) ||
        (filters.status === "offline" && !stream.isLive);

      return matchesSearch && matchesPlatform && matchesCategory && matchesStatus;
    });
  }, [streams, filters]);

  const liveStreams = filteredStreams.filter(s => s.isLive);
  const offlineStreams = filteredStreams.filter(s => !s.isLive);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-400 flex items-center gap-3">
            <Video className="w-8 h-8" />
            ActionLadder Live Streams
          </h1>
          <p className="text-gray-400 mt-1">
            Watch live pool action from halls across the country
          </p>
        </div>
        <CreateStreamDialog />
      </div>

      {/* Live Streams */}
      {liveStreams.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span>Live Now ({liveStreams.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveStreams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        </div>
      )}

      {/* Offline Streams */}
      {offlineStreams.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <span>Offline Streams ({offlineStreams.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offlineStreams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredStreams.length === 0 && (
        <Card className="bg-card/30 border-emerald-500/20">
          <CardContent className="p-12 text-center">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Streams Yet
            </h3>
            <p className="text-gray-400 mb-6">
              Be the first to start streaming on the ActionLadder network!
            </p>
            <CreateStreamDialog />
          </CardContent>
        </Card>
      )}
    </div>
  );
}