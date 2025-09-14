import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, Clock, Users, MapPin, QrCode, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ChallengeDialog } from '../components/ChallengeDialog';
import { QRCodeModal } from '../components/QRCodeModal';
import { PosterGenerationModal } from '../components/PosterGenerationModal';
import { io, Socket } from 'socket.io-client';

interface Challenge {
  id: string;
  title: string;
  description?: string;
  aPlayerId: string;
  bPlayerId: string;
  hallId: string;
  scheduledAt: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  checkedInAt?: string;
  completedAt?: string;
  winnerId?: string;
  posterImageUrl?: string;
  updatedAt?: string;
}

interface CheckInStatus {
  challengeId: string;
  status: string;
  aPlayerCheckedIn: boolean;
  bPlayerCheckedIn: boolean;
  bothPlayersCheckedIn: boolean;
  checkIns: Array<{
    playerId: string;
    checkedInAt: string;
    method: string;
  }>;
}

export function ChallengeCalendar() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [qrModalChallenge, setQrModalChallenge] = useState<Challenge | null>(null);
  const [posterModalChallenge, setPosterModalChallenge] = useState<Challenge | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize Socket.IO connection
  useEffect(() => {
    const socketConnection = io(window.location.origin, {
      path: '/socket.io'
    });

    socketConnection.on('connect', () => {
      console.log('Connected to Challenge Calendar socket');
      // Join global calendar room for real-time updates
      socketConnection.emit('join-calendar');
    });

    socketConnection.on('challenge-updated', (data) => {
      console.log('Challenge updated:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      toast({
        title: 'Challenge Updated',
        description: `Challenge status changed to ${data.status}`,
      });
    });

    socketConnection.on('player-checked-in', (data) => {
      console.log('Player checked in:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      toast({
        title: 'Player Checked In',
        description: data.message,
      });
    });

    socketConnection.on('challenge-started', (data) => {
      console.log('Challenge started:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      toast({
        title: 'Challenge Started!',
        description: data.message,
        variant: 'default',
      });
    });

    socketConnection.on('fee-applied', (data) => {
      console.log('Fee applied:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      toast({
        title: 'Fee Applied',
        description: data.message || `${data.feeType.replace('_', ' ').toUpperCase()} fee of $${(data.amount / 100).toFixed(2)} applied`,
        variant: 'destructive',
      });
    });

    // Handle global calendar updates
    socketConnection.on('calendar-update', (update) => {
      console.log('Calendar update received:', update);
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      
      // Handle different event types
      switch (update.eventType) {
        case 'challenge-updated':
          toast({
            title: 'Challenge Updated',
            description: `Challenge status changed to ${update.data.status}`,
          });
          break;
        case 'player-checked-in':
          toast({
            title: 'Player Checked In',
            description: update.data.message,
          });
          break;
        case 'challenge-started':
          toast({
            title: 'Challenge Started!',
            description: update.data.message,
            variant: 'default',
          });
          break;
        case 'fee-applied':
          toast({
            title: 'Fee Applied',
            description: update.data.message,
            variant: 'destructive',
          });
          break;
        case 'challenge-cancelled':
          toast({
            title: 'Challenge Cancelled',
            description: update.data.reason,
            variant: 'destructive',
          });
          break;
      }
    });

    setSocket(socketConnection);

    return () => {
      // Leave calendar room before disconnect
      socketConnection.emit('leave-calendar');
      socketConnection.disconnect();
    };
  }, [queryClient, toast]);

  // Fetch challenges
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['/api/challenges'],
    queryFn: () => apiRequest('/api/challenges'),
  });

  // Create challenge mutation
  const createChallengeMutation = useMutation({
    mutationFn: (challengeData: any) => apiRequest('/api/challenges', {
      method: 'POST',
      body: JSON.stringify(challengeData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      setIsDialogOpen(false);
      toast({
        title: 'Challenge Created',
        description: 'New challenge has been scheduled successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create challenge',
        variant: 'destructive',
      });
    },
  });

  // Update challenge mutation
  const updateChallengeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/challenges/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      setIsDialogOpen(false);
      setSelectedChallenge(null);
      toast({
        title: 'Challenge Updated',
        description: 'Challenge has been updated successfully.',
      });
    },
  });

  // Generate poster mutation
  const generatePosterMutation = useMutation({
    mutationFn: ({ challengeId, template = 'fight-night', theme = 'dark' }: 
      { challengeId: string; template?: string; theme?: string }) => 
      apiRequest(`/api/poster/challenge/${challengeId}?template=${template}&theme=${theme}`),
    onSuccess: (data) => {
      toast({
        title: 'Poster Generated',
        description: 'Challenge poster has been generated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Poster Generation Failed',
        description: error.message || 'Failed to generate poster',
        variant: 'destructive',
      });
    },
  });

  // Handle date click for new challenge
  const handleDateClick = useCallback((info: any) => {
    setSelectedDate(info.dateStr);
    setSelectedChallenge(null);
    setIsDialogOpen(true);
  }, []);

  // Handle event click for editing challenge
  const handleEventClick = useCallback((info: any) => {
    const challenge = challenges.find((c: Challenge) => c.id === info.event.id);
    if (challenge) {
      setSelectedChallenge(challenge);
      setSelectedDate('');
      setIsDialogOpen(true);
    }
  }, [challenges]);

  // Handle QR code generation
  const handleGenerateQR = useCallback((challenge: Challenge) => {
    setQrModalChallenge(challenge);
    
    // Join specific challenge room for detailed updates (optional)
    if (socket) {
      socket.emit('join-challenge', challenge.id);
    }
  }, [socket]);

  // Handle poster generation
  const handleGeneratePoster = useCallback((challenge: Challenge) => {
    setPosterModalChallenge(challenge);
  }, []);

  // Format challenges for FullCalendar
  const calendarEvents = challenges.map((challenge: Challenge) => ({
    id: challenge.id,
    title: challenge.title,
    start: challenge.scheduledAt,
    backgroundColor: getStatusColor(challenge.status),
    borderColor: getStatusColor(challenge.status),
    extendedProps: {
      status: challenge.status,
      description: challenge.description,
      aPlayerId: challenge.aPlayerId,
      bPlayerId: challenge.bPlayerId,
      hallId: challenge.hallId,
    },
  }));

  // Get upcoming challenges (next 7 days)
  const upcomingChallenges = challenges
    .filter((challenge: Challenge) => {
      const challengeDate = new Date(challenge.scheduledAt);
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return challengeDate >= now && challengeDate <= sevenDaysFromNow;
    })
    .sort((a: Challenge, b: Challenge) => 
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )
    .slice(0, 5); // Show only next 5 challenges

  return (
    <div className="min-h-screen bg-black text-green-400">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Main Calendar */}
          <div className="flex-1">
            <Card className="bg-gray-900 border-green-500/20">
              <CardHeader className="border-b border-green-500/20">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-green-400 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Challenge Calendar
                  </CardTitle>
                  <Button
                    onClick={() => {
                      setSelectedDate('');
                      setSelectedChallenge(null);
                      setIsDialogOpen(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-black"
                    data-testid="button-create-challenge"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Challenge
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="text-center py-8 text-green-400">Loading challenges...</div>
                ) : (
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={calendarEvents}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    height="auto"
                    themeSystem="standard"
                    eventTextColor="#000"
                    eventDisplay="block"
                    dayMaxEvents={3}
                    eventTimeFormat={{
                      hour: 'numeric',
                      minute: '2-digit',
                      meridiem: 'short'
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Challenges Sidebar */}
          <div className="lg:w-80">
            <Card className="bg-gray-900 border-green-500/20">
              <CardHeader className="border-b border-green-500/20">
                <CardTitle className="text-green-400 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Challenges
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3" data-testid="upcoming-challenges-list">
                {upcomingChallenges.length === 0 ? (
                  <div className="text-center py-8 text-green-400/60">
                    No upcoming challenges
                  </div>
                ) : (
                  upcomingChallenges.map((challenge: Challenge) => (
                    <UpcomingChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onGenerateQR={() => handleGenerateQR(challenge)}
                      onGeneratePoster={() => handleGeneratePoster(challenge)}
                      onEdit={() => {
                        setSelectedChallenge(challenge);
                        setIsDialogOpen(true);
                      }}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Challenge Stats */}
            <Card className="bg-gray-900 border-green-500/20 mt-6">
              <CardHeader className="border-b border-green-500/20">
                <CardTitle className="text-green-400 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-green-400/80">Total Challenges</span>
                    <span className="text-green-400 font-semibold">{challenges.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400/80">Scheduled</span>
                    <span className="text-yellow-400 font-semibold">
                      {challenges.filter((c: Challenge) => c.status === 'scheduled').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400/80">In Progress</span>
                    <span className="text-blue-400 font-semibold">
                      {challenges.filter((c: Challenge) => c.status === 'in_progress').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400/80">Completed</span>
                    <span className="text-green-400 font-semibold">
                      {challenges.filter((c: Challenge) => c.status === 'completed').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Challenge Creation/Edit Dialog */}
      <ChallengeDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedChallenge(null);
          setSelectedDate('');
        }}
        challenge={selectedChallenge}
        selectedDate={selectedDate}
        onSubmit={(data: any) => {
          if (selectedChallenge) {
            updateChallengeMutation.mutate({ id: selectedChallenge.id, data });
          } else {
            createChallengeMutation.mutate(data);
          }
        }}
        isLoading={createChallengeMutation.isPending || updateChallengeMutation.isPending}
      />

      {/* QR Code Modal */}
      {qrModalChallenge && (
        <QRCodeModal
          challenge={qrModalChallenge}
          onClose={() => setQrModalChallenge(null)}
        />
      )}

      {/* Poster Generation Modal */}
      {posterModalChallenge && (
        <PosterGenerationModal
          challenge={posterModalChallenge}
          onClose={() => setPosterModalChallenge(null)}
          onGenerate={(template, theme) => {
            generatePosterMutation.mutate({
              challengeId: posterModalChallenge.id,
              template,
              theme
            });
          }}
          isGenerating={generatePosterMutation.isPending}
        />
      )}
    </div>
  );
}

// Upcoming Challenge Card Component
interface UpcomingChallengeCardProps {
  challenge: Challenge;
  onGenerateQR: () => void;
  onGeneratePoster: () => void;
  onEdit: () => void;
}

function UpcomingChallengeCard({ challenge, onGenerateQR, onGeneratePoster, onEdit }: UpcomingChallengeCardProps) {
  const challengeDate = new Date(challenge.scheduledAt);
  const isToday = challengeDate.toDateString() === new Date().toDateString();
  
  return (
    <div
      className="p-3 border border-green-500/30 rounded-lg bg-gray-800/50 hover:bg-gray-800/80 transition-colors cursor-pointer"
      onClick={onEdit}
      data-testid={`challenge-card-${challenge.id}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-green-400 font-semibold text-sm truncate">
          {challenge.title}
        </h4>
        <Badge 
          variant="outline" 
          className={`text-xs ${getStatusBadgeClass(challenge.status)}`}
        >
          {challenge.status}
        </Badge>
      </div>
      
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-1 text-green-400/70">
          <Clock className="h-3 w-3" />
          {challengeDate.toLocaleDateString()} at {challengeDate.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
          {isToday && <Badge className="ml-2 text-xs bg-orange-600">Today</Badge>}
        </div>
        
        <div className="flex items-center gap-1 text-green-400/70">
          <MapPin className="h-3 w-3" />
          Hall: {challenge.hallId}
        </div>
        
        <div className="flex items-center gap-1 text-green-400/70">
          <Users className="h-3 w-3" />
          {challenge.aPlayerId} vs {challenge.bPlayerId}
        </div>
      </div>

      <Separator className="my-2 bg-green-500/20" />
      
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs border-green-500/30 text-green-400 hover:bg-green-500/10"
          onClick={(e) => {
            e.stopPropagation();
            onGenerateQR();
          }}
          data-testid={`button-qr-${challenge.id}`}
        >
          <QrCode className="h-3 w-3 mr-1" />
          QR Code
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs border-green-500/30 text-green-400 hover:bg-green-500/10"
          onClick={(e) => {
            e.stopPropagation();
            onGeneratePoster();
          }}
          data-testid={`button-poster-${challenge.id}`}
        >
          <Image className="h-3 w-3 mr-1" />
          Poster
        </Button>
      </div>
    </div>
  );
}

// Helper functions
function getStatusColor(status: string): string {
  switch (status) {
    case 'scheduled':
      return '#eab308'; // yellow
    case 'in_progress':
      return '#3b82f6'; // blue
    case 'completed':
      return '#22c55e'; // green
    case 'cancelled':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'scheduled':
      return 'border-yellow-500 text-yellow-400';
    case 'in_progress':
      return 'border-blue-500 text-blue-400';
    case 'completed':
      return 'border-green-500 text-green-400';
    case 'cancelled':
      return 'border-red-500 text-red-400';
    default:
      return 'border-gray-500 text-gray-400';
  }
}