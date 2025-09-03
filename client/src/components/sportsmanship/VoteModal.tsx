import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, UserX, UserCheck, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  vote: {
    id: string;
    targetUserId: string;
    remainingSeconds: number;
  };
  targetUserName?: string;
  voterUserId: string;
  voterRole: 'player' | 'attendee' | 'operator';
}

const VIOLATION_CATEGORIES = {
  A: {
    label: "Unsportsmanlike Talk",
    description: "Insults, slurs, threats",
    color: "bg-red-100 text-red-800 border-red-300"
  },
  B: {
    label: "Disruptive Behavior", 
    description: "Sharking, banging cues, table interference",
    color: "bg-orange-100 text-orange-800 border-orange-300"
  },
  C: {
    label: "Chronic Stalling",
    description: "Beyond posted shot clock",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300"
  },
  D: {
    label: "Harassment",
    description: "Targeted, repeated behavior",
    color: "bg-purple-100 text-purple-800 border-purple-300"
  }
};

export default function VoteModal({ 
  isOpen, 
  onClose, 
  vote, 
  targetUserName,
  voterUserId,
  voterRole 
}: VoteModalProps) {
  const [choice, setChoice] = useState<'out' | 'keep' | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  
  const queryClient = useQueryClient();

  const submitVote = useMutation({
    mutationFn: async (voteData: any) => {
      return apiRequest(`/api/attitude-votes/${vote.id}/vote`, {
        method: "POST",
        body: JSON.stringify(voteData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attitude-votes"] });
      onClose();
    },
  });

  const handleCategoryToggle = (category: string) => {
    setSelectedTags(prev => 
      prev.includes(category) 
        ? prev.filter(tag => tag !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = () => {
    if (!choice) return;

    // If voting "out", require at least one category
    if (choice === "out" && selectedTags.length === 0) {
      alert("Please select at least one violation category when voting someone out.");
      return;
    }

    submitVote.mutate({
      choice,
      tags: selectedTags,
      note: note.trim() || undefined,
      voterUserId,
      voterRole,
    });
  };

  const minutes = Math.floor(vote.remainingSeconds / 60);
  const seconds = vote.remainingSeconds % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const getWeightDescription = (role: string) => {
    switch (role) {
      case 'operator': return 'Your vote counts as 2x (operator)';
      case 'player': return 'Your vote counts as 1x (player)';
      case 'attendee': return 'Your vote counts as 0.5x (attendee)';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white">
            <AlertTriangle className="h-6 w-6 text-yellow-400" />
            Sportsmanship Vote
            <div className="ml-auto flex items-center gap-2 text-yellow-300">
              <Clock className="h-4 w-4" />
              <span className="font-mono text-lg">{timeDisplay}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Question */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">
              Does {targetUserName || 'this person'}'s behavior violate our sportsmanship rules right now?
            </h3>
            <p className="text-sm text-gray-400">
              {getWeightDescription(voterRole)}
            </p>
          </div>

          {/* Vote Choice */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              data-testid="button-vote-out"
              onClick={() => setChoice('out')}
              variant={choice === 'out' ? 'default' : 'outline'}
              className={`h-20 text-lg font-bold transition-all ${
                choice === 'out' 
                  ? 'bg-red-600 hover:bg-red-700 text-white border-red-500' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <UserX className="h-8 w-8" />
                Vote Out
              </div>
            </Button>

            <Button
              data-testid="button-vote-keep"
              onClick={() => setChoice('keep')}
              variant={choice === 'keep' ? 'default' : 'outline'}
              className={`h-20 text-lg font-bold transition-all ${
                choice === 'keep' 
                  ? 'bg-green-600 hover:bg-green-700 text-white border-green-500' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <UserCheck className="h-8 w-8" />
                Keep In
              </div>
            </Button>
          </div>

          {/* Violation Categories (only shown when voting out) */}
          {choice === 'out' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-white">
                Select violation category(ies): <span className="text-red-400">*Required</span>
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(VIOLATION_CATEGORIES).map(([key, category]) => (
                  <Button
                    key={key}
                    data-testid={`button-category-${key}`}
                    variant="outline"
                    onClick={() => handleCategoryToggle(key)}
                    className={`justify-start p-4 h-auto transition-all ${
                      selectedTags.includes(key)
                        ? 'bg-red-900/50 border-red-500 text-red-300'
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="min-w-[24px] justify-center">
                          {key}
                        </Badge>
                        <span className="font-semibold">{category.label}</span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1 ml-9">
                        {category.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Optional Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Optional note (max 140 characters)
            </label>
            <Textarea
              data-testid="textarea-vote-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={140}
              placeholder="Brief explanation (optional)"
              className="bg-gray-800 border-gray-600 text-white resize-none"
              rows={3}
            />
            <div className="text-xs text-gray-400 text-right">
              {note.length}/140
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              data-testid="button-cancel-vote"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              data-testid="button-submit-vote"
              onClick={handleSubmit}
              disabled={!choice || (choice === 'out' && selectedTags.length === 0) || submitVote.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
            >
              {submitVote.isPending ? "Submitting..." : "Submit Vote"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}