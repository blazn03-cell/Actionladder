import { useState } from "react";
import { AlertTriangle, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface VoteBannerProps {
  vote: {
    id: string;
    targetUserId: string;
    remainingSeconds: number;
    youVoted: boolean;
  };
  targetUserName?: string;
  onVoteClick: () => void;
}

export default function VoteBanner({ vote, targetUserName, onVoteClick }: VoteBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const minutes = Math.floor(vote.remainingSeconds / 60);
  const seconds = vote.remainingSeconds % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const isUrgent = vote.remainingSeconds <= 30;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <Card className={`w-full max-w-4xl mx-auto border-2 transition-all duration-300 ${
        isUrgent ? 'border-red-500 bg-red-950/90' : 'border-yellow-500 bg-yellow-950/90'
      } backdrop-blur-sm`}>
        <div className="p-4 flex items-center justify-between gap-4">
          {/* Icon and Main Message */}
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-6 w-6 ${isUrgent ? 'text-red-400' : 'text-yellow-400'} animate-pulse`} />
            <div>
              <div className="font-semibold text-white">
                Sportsmanship Vote in Progress
              </div>
              <div className="text-sm text-gray-300">
                Community voting on behavior of {targetUserName || 'player'}
              </div>
            </div>
          </div>

          {/* Timer and Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <Clock className="h-4 w-4" />
              <span className={`font-mono text-lg font-bold ${isUrgent ? 'text-red-300' : 'text-yellow-300'}`}>
                {timeDisplay}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-300">
              <Users className="h-4 w-4" />
              <span className="text-sm">Community Decision</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {vote.youVoted ? (
              <div className="px-4 py-2 bg-green-900/50 border border-green-600 rounded-lg text-green-300 text-sm font-medium">
                ✓ Voted
              </div>
            ) : (
              <Button
                data-testid="button-open-vote-modal"
                onClick={onVoteClick}
                className={`px-6 py-2 font-semibold transition-all ${
                  isUrgent 
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                Tap to Vote
              </Button>
            )}
            
            <Button
              data-testid="button-dismiss-banner"
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Progress bar showing time remaining */}
        <div className="h-1 bg-gray-700">
          <div 
            className={`h-full transition-all duration-1000 ${
              isUrgent ? 'bg-red-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.max(0, (vote.remainingSeconds / 90) * 100)}%` }}
          />
        </div>
      </Card>
    </div>
  );
}