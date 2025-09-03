import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Shield, Users, Clock } from "lucide-react";
import VoteBanner from "@/components/sportsmanship/VoteBanner";
import VoteModal from "@/components/sportsmanship/VoteModal";
import OperatorPanel from "@/components/sportsmanship/OperatorPanel";

// Mock current session data (in real app, this would come from context/auth)
const MOCK_SESSION = {
  sessionId: "session-2025-01-03",
  venueId: "venue-actionladder-main",
  userId: "user-current",
  userName: "Current User",
  role: "player" as const, // player, attendee, operator
  operatorId: "operator-main",
};

export default function SportsmanshipSystem() {
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [activeVoteId, setActiveVoteId] = useState<string | null>(null);

  // Fetch active votes for this session/venue
  const { data: activeVotes = [] } = useQuery({
    queryKey: [`/api/attitude-votes/active/${MOCK_SESSION.sessionId}/${MOCK_SESSION.venueId}`],
    refetchInterval: 3000, // Poll every 3 seconds for live updates
  });

  // Check if there's an active vote this user can participate in
  const currentVote = activeVotes.find((vote: any) => 
    vote.status === "open" && vote.remainingSeconds > 0
  );

  // Auto-open vote modal when a new vote starts (if user hasn't voted)
  useEffect(() => {
    if (currentVote && !currentVote.youVoted && activeVoteId !== currentVote.id) {
      setActiveVoteId(currentVote.id);
      // Optionally auto-open modal for important votes
      // setIsVoteModalOpen(true);
    }
  }, [currentVote, activeVoteId]);

  const handleVoteBannerClick = () => {
    if (currentVote) {
      setActiveVoteId(currentVote.id);
      setIsVoteModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Vote Banner - Appears at top when vote is active */}
      {currentVote && (
        <VoteBanner
          vote={{
            id: currentVote.id,
            targetUserId: currentVote.targetUserId,
            remainingSeconds: currentVote.remainingSeconds,
            youVoted: currentVote.youVoted || false,
          }}
          targetUserName="Problem Player" // In real app, resolve from targetUserId
          onVoteClick={handleVoteBannerClick}
        />
      )}

      {/* Vote Modal */}
      {activeVoteId && currentVote && (
        <VoteModal
          isOpen={isVoteModalOpen}
          onClose={() => setIsVoteModalOpen(false)}
          vote={{
            id: currentVote.id,
            targetUserId: currentVote.targetUserId,
            remainingSeconds: currentVote.remainingSeconds,
          }}
          targetUserName="Problem Player"
          voterUserId={MOCK_SESSION.userId}
          voterRole={MOCK_SESSION.role}
        />
      )}

      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Sportsmanship System</h1>
        <p className="text-gray-300">
          Community-driven behavior management with transparent voting
        </p>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
            <CardTitle className="text-yellow-400">Community Voting</CardTitle>
            <CardDescription className="text-gray-300">
              Real-time voting system for behavior issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-300">
              <div>• 90-second voting window</div>
              <div>• Anonymous ballots</div>
              <div>• Weighted by role (operators: 2x, players: 1x, attendees: 0.5x)</div>
              <div>• 65% threshold to pass</div>
              <div>• Quorum protection</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-green-400 mx-auto mb-2" />
            <CardTitle className="text-green-400">Safeguards</CardTitle>
            <CardDescription className="text-gray-300">
              Protection against abuse and false accusations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-300">
              <div>• Shooter immunity during turn</div>
              <div>• 15-minute cooldown between votes</div>
              <div>• One ejection per user per night</div>
              <div>• Appeal system available</div>
              <div>• Operator override for safety</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <Users className="h-12 w-12 text-purple-400 mx-auto mb-2" />
            <CardTitle className="text-purple-400">Consequences</CardTitle>
            <CardDescription className="text-gray-300">
              Progressive penalties for behavior violations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-300">
              <div>• 1st: Night ejection + 10 ladder points</div>
              <div>• 2nd: 7-day suspension + 25 points</div>
              <div>• 3rd: 30-day suspension + forfeits</div>
              <div>• Incident log maintained</div>
              <div>• Points and fines tracked</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Violation Categories */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-emerald-400">Violation Categories</CardTitle>
          <CardDescription className="text-gray-300">
            Clear, objective criteria for voting decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="p-3 bg-red-900/30 border border-red-600 rounded">
                <div className="font-semibold text-red-300">A. Unsportsmanlike Talk</div>
                <div className="text-sm text-gray-400">Insults, slurs, threats</div>
              </div>
              <div className="p-3 bg-orange-900/30 border border-orange-600 rounded">
                <div className="font-semibold text-orange-300">B. Disruptive Behavior</div>
                <div className="text-sm text-gray-400">Sharking, banging cues, table interference</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-900/30 border border-yellow-600 rounded">
                <div className="font-semibold text-yellow-300">C. Chronic Stalling</div>
                <div className="text-sm text-gray-400">Beyond posted shot clock</div>
              </div>
              <div className="p-3 bg-purple-900/30 border border-purple-600 rounded">
                <div className="font-semibold text-purple-300">D. Harassment</div>
                <div className="text-sm text-gray-400">Targeted, repeated behavior</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-Based Interface */}
      <Tabs defaultValue="player" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="player" className="data-[state=active]:bg-emerald-600">
            Player/Attendee View
          </TabsTrigger>
          <TabsTrigger value="operator" className="data-[state=active]:bg-red-600">
            Operator Panel
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="player" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-emerald-400 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Player Interface
              </CardTitle>
              <CardDescription className="text-gray-300">
                Your role: {MOCK_SESSION.role} (vote weight: {
                  MOCK_SESSION.role === 'operator' ? '2x' : 
                  MOCK_SESSION.role === 'player' ? '1x' : '0.5x'
                })
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentVote ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-900/30 border border-yellow-600 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-yellow-300">Active Vote in Progress</div>
                        <div className="text-sm text-gray-300">
                          Community is voting on behavior issue
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-yellow-300">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono">
                          {Math.floor(currentVote.remainingSeconds / 60)}:
                          {(currentVote.remainingSeconds % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {currentVote.youVoted ? (
                    <div className="text-center p-4 bg-green-900/30 border border-green-600 rounded text-green-300">
                      ✓ You have voted. Thank you for participating.
                    </div>
                  ) : (
                    <Button
                      onClick={handleVoteBannerClick}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      Cast Your Vote
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 text-gray-400">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                  <div className="font-medium">No Active Votes</div>
                  <div className="text-sm">The community will be notified when a vote begins</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="operator">
          <OperatorPanel
            sessionId={MOCK_SESSION.sessionId}
            venueId={MOCK_SESSION.venueId}
            operatorId={MOCK_SESSION.operatorId}
          />
        </TabsContent>
      </Tabs>

      {/* Help Text */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-blue-400">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-300">
          <div><strong>1. Warning First:</strong> Operators should give a direct warning before opening a vote (unless severe violation)</div>
          <div><strong>2. Vote Opens:</strong> 90-second voting window with community notification</div>
          <div><strong>3. Community Decides:</strong> Anonymous voting with objective violation categories</div>
          <div><strong>4. Result Applied:</strong> If vote passes (65% threshold + quorum), consequences are automatic</div>
          <div><strong>5. Appeal Available:</strong> Ejected players can appeal once to operators</div>
        </CardContent>
      </Card>
    </div>
  );
}