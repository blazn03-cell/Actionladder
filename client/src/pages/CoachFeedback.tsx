import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ExternalLink, 
  Target, 
  RotateCw, 
  Wind, 
  ArrowLeft, 
  Trophy, 
  Share2,
  AlertTriangle,
  Zap,
  Activity,
  TrendingUp,
  Shield
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

// Dr. Dave resource links mapping
const drDaveLinks = {
  overdraw: "https://billiards.colostate.edu/faq/draw/technique/",
  spinBias: "https://billiards.colostate.edu/faq/english/basics/",
  break: "https://billiards.colostate.edu/faq/break/power/",
  cutShots: "https://billiards.colostate.edu/faq/aiming/30-degree-rule/",
  follow: "https://billiards.colostate.edu/faq/follow/basics/",
  safety: "https://billiards.colostate.edu/faq/safety/fundamentals/",
  speed: "https://billiards.colostate.edu/faq/speed/optimal-tip-height/",
  sidespin: "https://billiards.colostate.edu/faq/sidespin/aim/effects/",
  fundamentals: "https://billiards.colostate.edu/tutorial/fundamentals/",
};

interface CoachTip {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'focus' | 'fix';
  links: { label: string; url: string }[];
  tags: string[];
}

interface SessionData {
  id: string;
  playerId: string;
  ladderId: string;
  focusArea: string;
  durationMinutes: number;
  sessionDate: string;
}

interface InsightsResponse {
  tips: CoachTip[];
  insights: string[];
  coachScore: number;
  sessionStats: {
    shots: any[];
    makePercentage?: number;
  };
}

export default function CoachFeedback() {
  const { sessionId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Redirect if no sessionId
  useEffect(() => {
    if (!sessionId) {
      navigate("/training/session");
    }
  }, [sessionId, navigate]);

  // Fetch session details
  const { data: sessionData, isLoading: sessionLoading } = useQuery<SessionData>({
    queryKey: ["/api/training/sessions", sessionId],
    enabled: !!sessionId,
  });

  // Fetch AI insights
  const { data: insightsData, isLoading: insightsLoading, error } = useQuery<InsightsResponse>({
    queryKey: ["/api/training/sessions", sessionId, "insights"],
    enabled: !!sessionId,
  });

  if (error) {
    toast({
      title: "Error Loading Insights",
      description: "Failed to fetch coaching insights. Please try again.",
      variant: "destructive",
    });
  }

  const getInsightIcon = (tip: CoachTip) => {
    const title = tip.title.toLowerCase();
    const tags = tip.tags.join(" ");
    
    if (title.includes("overdraw") || title.includes("draw")) return <Target className="w-5 h-5" />;
    if (title.includes("spin") || title.includes("english") || tags.includes("sidespin")) return <RotateCw className="w-5 h-5" />;
    if (title.includes("break")) return <Zap className="w-5 h-5" />;
    if (title.includes("follow")) return <TrendingUp className="w-5 h-5" />;
    if (title.includes("speed")) return <Wind className="w-5 h-5" />;
    if (title.includes("safety")) return <Shield className="w-5 h-5" />;
    return <Activity className="w-5 h-5" />;
  };

  const getResourceLink = (tip: CoachTip): string => {
    const title = tip.title.toLowerCase();
    const tags = tip.tags.join(" ");
    
    if (title.includes("overdraw") || title.includes("draw")) return drDaveLinks.overdraw;
    if (title.includes("spin bias") || tags.includes("sidespin")) return drDaveLinks.spinBias;
    if (title.includes("break")) return drDaveLinks.break;
    if (title.includes("follow")) return drDaveLinks.follow;
    if (title.includes("safety")) return drDaveLinks.safety;
    if (title.includes("speed")) return drDaveLinks.speed;
    if (tags.includes("left-english") || tags.includes("right-english")) return drDaveLinks.sidespin;
    
    // Use link from tip if available
    if (tip.links && tip.links.length > 0 && tip.links[0].url) {
      return tip.links[0].url;
    }
    
    return drDaveLinks.fundamentals;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'fix': return 'bg-red-900/20 border-red-600 text-red-400';
      case 'focus': return 'bg-yellow-900/20 border-yellow-600 text-yellow-400';
      case 'info': return 'bg-blue-900/20 border-blue-600 text-blue-400';
      default: return 'bg-gray-900/20 border-gray-600 text-gray-400';
    }
  };

  const getCoachScoreColor = (score: number) => {
    if (score >= 71) return 'text-green-400';
    if (score >= 41) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getDrillSuggestion = (tip: CoachTip): string => {
    const title = tip.title.toLowerCase();
    
    if (title.includes("overdraw")) return "Practice draw shots from 4 feet with controlled tip height";
    if (title.includes("spin bias")) return "Drill mirrored cut shots with left/right english alternating";
    if (title.includes("break")) return "Reduce power and focus on square contact at 70% speed";
    if (title.includes("follow")) return "Practice follow shots at varied distances with consistent tempo";
    if (title.includes("safety")) return "Practice two-rail safeties with fuller contact points";
    if (title.includes("speed")) return "Place object balls at different distances and practice speed control";
    
    return "Focus on fundamentals and consistent pre-shot routine";
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Pool Training Session',
          text: `Check out my AI coaching insights! Score: ${insightsData?.coachScore}/100`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied!",
        description: "Share link copied to clipboard",
      });
    }
  };

  const isLoading = sessionLoading || insightsLoading;

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-400 mb-2" data-testid="text-page-title">
            AI Coaching Insights
          </h1>
          <p className="text-gray-400">Personalized feedback from Dr. Dave's coaching principles</p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full bg-gray-800" />
            <Skeleton className="h-64 w-full bg-gray-800" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-48 bg-gray-800" />
              <Skeleton className="h-48 bg-gray-800" />
              <Skeleton className="h-48 bg-gray-800" />
            </div>
          </div>
        ) : (
          <>
            {/* Session Summary Card */}
            <Card className="bg-gray-800 border-green-600 mb-8" data-testid="card-session-summary">
              <CardHeader>
                <CardTitle className="text-2xl text-green-400">Session Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-400">Focus Area</p>
                    <p className="text-lg font-semibold text-white" data-testid="text-focus-area">
                      {sessionData?.focusArea || "General Practice"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Duration</p>
                    <p className="text-lg font-semibold text-white" data-testid="text-duration">
                      {sessionData?.durationMinutes || 0} minutes
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Shots</p>
                    <p className="text-lg font-semibold text-white" data-testid="text-total-shots">
                      {insightsData?.sessionStats?.shots?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Make %</p>
                    <p className="text-lg font-semibold text-white" data-testid="text-make-percentage">
                      {insightsData?.sessionStats?.makePercentage?.toFixed(1) || "0"}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coach Score Display */}
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-green-600 mb-8" data-testid="card-coach-score">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold text-green-400 mb-2">AI Coach Score</h3>
                    <p className="text-gray-400 mb-4">Based on technique improvement potential</p>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <div className={`text-6xl font-black ${getCoachScoreColor(insightsData?.coachScore || 0)}`} data-testid="text-coach-score">
                        {insightsData?.coachScore || 0}
                      </div>
                      <span className="text-2xl text-gray-500">/100</span>
                    </div>
                  </div>
                  
                  <div className="relative w-48 h-48">
                    <svg className="transform -rotate-90 w-48 h-48">
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-gray-700"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={552}
                        strokeDashoffset={552 - (552 * (insightsData?.coachScore || 0)) / 100}
                        className={`${getCoachScoreColor(insightsData?.coachScore || 0)} transition-all duration-1000 ease-out`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Trophy className={`w-16 h-16 ${getCoachScoreColor(insightsData?.coachScore || 0)}`} />
                    </div>
                  </div>
                </div>
                
                <Progress 
                  value={insightsData?.coachScore || 0} 
                  className="mt-6 h-3"
                  data-testid="progress-coach-score"
                />
              </CardContent>
            </Card>

            {/* AI Insights Grid */}
            {insightsData?.tips && insightsData.tips.length > 0 ? (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-green-400 mb-4">Coaching Insights</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {insightsData.tips.map((tip, index) => (
                    <Card 
                      key={tip.id}
                      className={`${getSeverityColor(tip.severity)} border-2 transition-all hover:scale-105 hover:shadow-lg hover:shadow-green-900/50`}
                      data-testid={`card-insight-${index}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {getInsightIcon(tip)}
                            <CardTitle className="text-lg">{tip.title}</CardTitle>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${getSeverityColor(tip.severity)} text-xs`}
                            data-testid={`badge-severity-${index}`}
                          >
                            {tip.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-300" data-testid={`text-insight-${index}`}>
                          {tip.body}
                        </p>
                        
                        <div className="pt-3 border-t border-gray-700">
                          <p className="text-xs text-gray-500 mb-2">Recommended Drill:</p>
                          <p className="text-sm text-green-400 italic" data-testid={`text-drill-${index}`}>
                            {getDrillSuggestion(tip)}
                          </p>
                        </div>

                        <a
                          href={getResourceLink(tip)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors mt-4"
                          data-testid={`link-resource-${index}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Learn More - Dr. Dave
                        </a>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="bg-gray-800 border-yellow-600 mb-8" data-testid="card-empty-state">
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">Need More Data</h3>
                  <p className="text-gray-400">
                    Record more shots with detailed metrics (distance, spin, positional error) to receive personalized coaching insights.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => navigate("/training/session")}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3"
                data-testid="button-back-training"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Training
              </Button>
              
              <Button
                onClick={() => navigate(`/training/leaderboard/${sessionData?.ladderId || ""}`)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
                disabled={!sessionData?.ladderId}
                data-testid="button-view-leaderboard"
              >
                <Trophy className="w-4 h-4 mr-2" />
                View Leaderboard
              </Button>
              
              <Button
                onClick={handleShare}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3"
                data-testid="button-share-progress"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Progress
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
