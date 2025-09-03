import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CharityEvent, InsertCharityEvent } from "@shared/schema";

const charityEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().min(1, "Description is required"),
  goal: z.number().min(1, "Goal must be at least $1"),
  percentage: z.number().min(0.01, "Percentage must be at least 1%").max(1, "Percentage cannot exceed 100%"),
});

type CharityEventFormData = z.infer<typeof charityEventSchema>;

function CreateCharityEventDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CharityEventFormData>({
    resolver: zodResolver(charityEventSchema),
    defaultValues: {
      name: "",
      description: "",
      goal: 500,
      percentage: 0.1, // 10%
    },
  });

  const createCharityEventMutation = useMutation({
    mutationFn: (data: InsertCharityEvent) => apiRequest("/api/charity-events", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/charity-events"] });
      toast({
        title: "Charity Event Created",
        description: "New charity event has been started!",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create charity event",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CharityEventFormData) => {
    const charityEventData: InsertCharityEvent = {
      ...data,
      raised: 0,
      active: true,
    };
    createCharityEventMutation.mutate(charityEventData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 border border-pink-500/50"
          data-testid="button-create-charity"
        >
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border border-neon-green/20">
        <DialogHeader>
          <DialogTitle className="text-white">Create Charity Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Event Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Local Youth Center Support"
                      data-testid="input-charity-name"
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
                      placeholder="Help support local youth programs..."
                      data-testid="textarea-charity-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Goal ($)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-charity-goal"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Prize Fund %</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="1"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-charity-percentage"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={createCharityEventMutation.isPending}
              data-testid="button-submit-charity"
            >
              {createCharityEventMutation.isPending ? <LoadingSpinner /> : "Create Event"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CharityEventCard({ event }: { event: CharityEvent }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const donateToEventMutation = useMutation({
    mutationFn: async ({ amount, email }: { amount: number; email?: string }) => {
      const response = await apiRequest("/api/charity/donate", {
        method: "POST",
        body: JSON.stringify({
          charityEventId: event.id,
          amount,
          donorEmail: email
        })
      });
      return response;
    },
    onSuccess: (data: any) => {
      // Redirect to Stripe checkout
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process donation",
        variant: "destructive",
      });
    },
  });

  const toggleEventMutation = useMutation({
    mutationFn: () => apiRequest(`/api/charity-events/${event.id}`, { method: "PUT", body: JSON.stringify({ active: !event.active }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/charity-events"] });
      toast({
        title: event.active ? "Event Paused" : "Event Activated",
        description: `Charity event has been ${event.active ? "paused" : "activated"}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    },
  });

  const progressPercentage = event.goal > 0 ? ((event.raised || 0) / event.goal) * 100 : 0;
  const isCompleted = (event.raised || 0) >= event.goal;

  const handleDonate = (amount: number = 25) => {
    toast({
      title: "Processing Donation",
      description: "Redirecting to secure payment...",
    });
    donateToEventMutation.mutate({ amount });
  };

  return (
    <Card className={`border card-hover ${event.active ? 'border-pink-500/30 bg-gradient-to-r from-pink-600/20 to-transparent' : 'border-gray-500/30 bg-gradient-to-r from-gray-600/20 to-transparent'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">{event.name}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className={event.active ? "bg-pink-500/20 text-pink-400" : "bg-gray-500/20 text-gray-400"}>
              {event.active ? "Active" : "Paused"}
            </Badge>
            {isCompleted && (
              <Badge className="bg-neon-green/20 text-neon-green">
                Goal Reached! 🎉
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">{event.description}</p>
          
          {/* Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm">
                <span className="text-gray-400">Raised:</span>
                <span className="text-pink-400 font-semibold ml-1">${event.raised || 0}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Goal:</span>
                <span className="text-white font-semibold ml-1">${event.goal}</span>
              </div>
            </div>
            <Progress value={Math.min(progressPercentage, 100)} className="h-3" />
            <div className="text-xs text-gray-400 mt-1">
              {progressPercentage.toFixed(1)}% complete
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-black/40 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Prize Fund Contribution</div>
            <div className="text-sm text-pink-400 font-semibold">
              {((event.percentage || 0) * 100).toFixed(1)}% of tournament entries
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            {event.active && !isCompleted && (
              <Button
                onClick={() => handleDonate()}
                disabled={donateToEventMutation.isPending}
                className="flex-1 bg-pink-500/20 hover:bg-pink-500/40 text-pink-400"
                data-testid={`button-donate-${event.id}`}
              >
                Donate Now
              </Button>
            )}
            <Button
              onClick={() => toggleEventMutation.mutate()}
              disabled={toggleEventMutation.isPending}
              variant="outline"
              size="sm"
              className="text-gray-300"
              data-testid={`button-toggle-${event.id}`}
            >
              {event.active ? "Pause" : "Activate"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CharityStats({ events }: { events: CharityEvent[] }) {
  const totalRaised = events.reduce((sum, event) => sum + (event.raised || 0), 0);
  const totalGoal = events.reduce((sum, event) => sum + event.goal, 0);
  const activeEvents = events.filter(event => event.active).length;
  const completedEvents = events.filter(event => (event.raised || 0) >= event.goal).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-pink-400">${totalRaised}</div>
          <div className="text-sm text-gray-400">Total Raised</div>
        </CardContent>
      </Card>
      <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-neon-green">{activeEvents}</div>
          <div className="text-sm text-gray-400">Active Events</div>
        </CardContent>
      </Card>
      <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{completedEvents}</div>
          <div className="text-sm text-gray-400">Goals Reached</div>
        </CardContent>
      </Card>
      <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-dollar-green">
            {totalGoal > 0 ? ((totalRaised / totalGoal) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-sm text-gray-400">Overall Progress</div>
        </CardContent>
      </Card>
    </div>
  );
}

function CharityInfo() {
  return (
    <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">❤️ Community Impact</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-2">
            <span className="text-pink-400 font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Auto-Donation:</span> Percentage of tournament prize fund automatically contributed
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-pink-400 font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">House Matching:</span> ActionLadder matches community donations dollar-for-dollar
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-pink-400 font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Local Focus:</span> All events benefit Seguin, New Braunfels, and San Marcos communities
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-pink-400 font-bold">•</span>
            <span className="text-gray-300">
              <span className="text-white font-semibold">Transparency:</span> Full reporting on fund usage and community impact
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Charity() {
  const { data: charityEvents = [], isLoading } = useQuery<CharityEvent[]>({
    queryKey: ["/api/charity-events"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" color="neon" />
      </div>
    );
  }

  const activeEvents = charityEvents.filter(event => event.active);
  const completedEvents = charityEvents.filter(event => (event.raised || 0) >= event.goal);
  const pausedEvents = charityEvents.filter(event => !event.active && (event.raised || 0) < event.goal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">❤️ Charity Events</h1>
          <p className="text-gray-400">Supporting our tri-city community</p>
        </div>
        <CreateCharityEventDialog />
      </div>

      {/* Stats */}
      <CharityStats events={charityEvents} />

      {/* Info */}
      <CharityInfo />

      {/* Active Events */}
      {activeEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">🔥 Active Campaigns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEvents.map((event) => (
              <CharityEventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Events */}
      {completedEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">🎉 Goals Reached</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedEvents.slice(0, 6).map((event) => (
              <CharityEventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Paused Events */}
      {pausedEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">⏸️ Paused Campaigns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pausedEvents.map((event) => (
              <CharityEventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {charityEvents.length === 0 && (
        <Card className="bg-black/60 backdrop-blur-sm border border-neon-green/20 shadow-felt">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">No charity events yet</div>
            <CreateCharityEventDialog />
          </CardContent>
        </Card>
      )}
    </div>
  );
}