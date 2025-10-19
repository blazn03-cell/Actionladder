import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Target, Trophy, Brain, Play, StopCircle } from "lucide-react";

type Shot = {
  shotType: string;
  result: "MAKE" | "MISS";
  distanceIn?: number;
  spinType?: "none" | "draw" | "follow" | "left" | "right";
  positionalErrorIn?: number;
};

type Session = {
  id: string;
  playerId: string;
  ladderId: string;
  focusArea: string;
  durationMinutes: number;
  sessionDate: Date;
  shots: Shot[];
};

const focusAreas = [
  "Break",
  "Position Play",
  "Bank Shots",
  "Safety",
  "Speed Control",
  "General Practice"
];

const shotTypes = [
  "break",
  "straight",
  "cut",
  "bank",
  "safety",
  "combo",
  "jump",
  "masse"
];

const spinTypes = [
  "follow",
  "draw",
  "left",
  "right",
  "none"
] as const;

export default function TrainingSession() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [currentShot, setCurrentShot] = useState<Partial<Shot>>({
    shotType: "straight",
    result: "MAKE",
  });
  
  const [sessionForm, setSessionForm] = useState({
    playerId: user?.id || "",
    ladderId: "",
    focusArea: "",
    durationMinutes: 30,
  });

  const { data: hallsData } = useQuery({
    queryKey: ["/api/halls"],
    enabled: !sessionId,
  });

  const startSessionMutation = useMutation({
    mutationFn: async (data: typeof sessionForm) => {
      const response = await fetch("/api/training/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: (session: Session) => {
      setSessionId(session.id);
      toast({
        title: "Session Started! 🎱",
        description: `${session.focusArea} practice - ${session.durationMinutes} minutes`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Starting Session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/training/sessions/${sessionId}/shots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shots }),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: (data: { message: string; count: number }) => {
      toast({
        title: "Session Complete! 🏆",
        description: `${data.count} shots recorded`,
      });
      navigate(`/training/insights/${sessionId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error Ending Session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addShot = () => {
    if (!currentShot.shotType || !currentShot.result) {
      toast({
        title: "Incomplete Shot",
        description: "Please select shot type and result",
        variant: "destructive",
      });
      return;
    }

    if (shots.length >= 200) {
      toast({
        title: "Max Shots Reached",
        description: "200 shots per session maximum",
        variant: "destructive",
      });
      return;
    }

    setShots([...shots, currentShot as Shot]);
    setCurrentShot({
      shotType: currentShot.shotType,
      result: "MAKE",
    });
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!sessionId) return;
      
      if (e.key === " ") {
        e.preventDefault();
        setCurrentShot({ ...currentShot, result: "MAKE" });
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setCurrentShot({ ...currentShot, result: "MISS" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        addShot();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [sessionId, currentShot, shots]);

  const calculateAiPreview = () => {
    if (shots.length < 10) return null;

    const drawShots = shots.filter(s => s.spinType === "draw");
    const avgError = drawShots.reduce((sum, s) => sum + (s.positionalErrorIn || 0), 0) / (drawShots.length || 1);
    const makeRate = (shots.filter(s => s.result === "MAKE").length / shots.length * 100).toFixed(1);

    return {
      message: drawShots.length > 5 && avgError > 5 
        ? `You're drawing too much - ${avgError.toFixed(1)}" avg error. Try Dr. Dave's draw drill`
        : `${makeRate}% make rate - Keep it up! 🔥`,
    };
  };

  const aiPreview = calculateAiPreview();

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="bg-gray-800 border-green-600" data-testid="card-session-start">
            <CardHeader>
              <CardTitle className="text-2xl text-green-400 flex items-center gap-2">
                <Play className="w-6 h-6" />
                Start Training Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ladder" className="text-gray-300">Ladder / Hall</Label>
                <Select 
                  value={sessionForm.ladderId} 
                  onValueChange={(val) => setSessionForm({ ...sessionForm, ladderId: val })}
                  data-testid="select-ladder"
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select a ladder" />
                  </SelectTrigger>
                  <SelectContent>
                    {(hallsData as any)?.halls?.map((hall: any) => (
                      <SelectItem key={hall.id} value={hall.id}>
                        {hall.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="focusArea" className="text-gray-300">Focus Area</Label>
                <Select 
                  value={sessionForm.focusArea} 
                  onValueChange={(val) => setSessionForm({ ...sessionForm, focusArea: val })}
                  data-testid="select-focus-area"
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="What are you practicing?" />
                  </SelectTrigger>
                  <SelectContent>
                    {focusAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration" className="text-gray-300">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={sessionForm.durationMinutes}
                  onChange={(e) => setSessionForm({ ...sessionForm, durationMinutes: parseInt(e.target.value) || 30 })}
                  className="bg-gray-700 border-gray-600 text-white"
                  min={1}
                  max={240}
                  data-testid="input-duration"
                />
              </div>

              <Button
                onClick={() => startSessionMutation.mutate(sessionForm)}
                disabled={!sessionForm.ladderId || !sessionForm.focusArea || startSessionMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
                data-testid="button-start-session"
              >
                {startSessionMutation.isPending ? "Starting..." : "Start Session"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gray-800 border-green-600" data-testid="card-shot-recording">
            <CardHeader>
              <CardTitle className="text-xl text-green-400 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Record Shot
              </CardTitle>
              <p className="text-2xl font-bold text-white" data-testid="text-shot-counter">
                {shots.length} shots recorded 🎱
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Shot Type</Label>
                <Select 
                  value={currentShot.shotType} 
                  onValueChange={(val) => setCurrentShot({ ...currentShot, shotType: val })}
                  data-testid="select-shot-type"
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shotTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Result</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentShot({ ...currentShot, result: "MAKE" })}
                    className={`flex-1 ${currentShot.result === "MAKE" ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                    data-testid="button-success"
                  >
                    ✓ Make
                  </Button>
                  <Button
                    onClick={() => setCurrentShot({ ...currentShot, result: "MISS" })}
                    className={`flex-1 ${currentShot.result === "MISS" ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                    data-testid="button-failure"
                  >
                    ✗ Miss
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Distance (inches)</Label>
                  <Input
                    type="number"
                    value={currentShot.distanceIn || ""}
                    onChange={(e) => setCurrentShot({ ...currentShot, distanceIn: parseFloat(e.target.value) || undefined })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Optional"
                    data-testid="input-distance"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Positional Error (inches)</Label>
                  <Input
                    type="number"
                    value={currentShot.positionalErrorIn || ""}
                    onChange={(e) => setCurrentShot({ ...currentShot, positionalErrorIn: parseFloat(e.target.value) || undefined })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Optional"
                    data-testid="input-positional-error"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Spin Type</Label>
                <Select 
                  value={currentShot.spinType} 
                  onValueChange={(val) => setCurrentShot({ ...currentShot, spinType: val as Shot["spinType"] })}
                  data-testid="select-spin"
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {spinTypes.map((spin) => (
                      <SelectItem key={spin} value={spin}>
                        {spin.charAt(0).toUpperCase() + spin.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={addShot}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
                data-testid="button-add-shot"
              >
                Add Shot (Enter)
              </Button>

              <p className="text-sm text-gray-400 text-center">
                Space = Make | N = Miss | Enter = Add Shot
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {aiPreview && (
              <Card className="bg-green-900/20 border-green-600" data-testid="card-ai-preview">
                <CardHeader>
                  <CardTitle className="text-lg text-green-400 flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Coach Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white" data-testid="text-ai-message">{aiPreview.message}</p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gray-800 border-green-600" data-testid="card-session-controls">
              <CardHeader>
                <CardTitle className="text-xl text-green-400 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Session Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => navigate(`/training/insights/${sessionId}`)}
                  disabled={shots.length < 5}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  data-testid="button-get-insights"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Get AI Insights
                </Button>

                <Button
                  onClick={() => endSessionMutation.mutate()}
                  disabled={shots.length < 5 || endSessionMutation.isPending}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                  data-testid="button-end-session"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  {endSessionMutation.isPending ? "Ending..." : "End Session"}
                </Button>

                {shots.length < 5 && (
                  <p className="text-sm text-yellow-400 text-center" data-testid="text-min-shots-warning">
                    Record at least 5 shots to end session
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-green-600" data-testid="card-shot-list">
              <CardHeader>
                <CardTitle className="text-lg text-green-400">Recent Shots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {shots.slice(-10).reverse().map((shot, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-2 bg-gray-700 rounded"
                      data-testid={`shot-item-${index}`}
                    >
                      <span className="text-white capitalize">{shot.shotType}</span>
                      <span className={`font-bold ${shot.result === "MAKE" ? 'text-green-400' : 'text-red-400'}`}>
                        {shot.result === "MAKE" ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                  {shots.length === 0 && (
                    <p className="text-gray-400 text-center py-4">No shots recorded yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
