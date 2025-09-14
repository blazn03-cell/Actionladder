import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QrCode, Download, Share, Clock, Users, MapPin, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Challenge {
  id: string;
  title: string;
  description?: string;
  aPlayerId: string;
  bPlayerId: string;
  hallId: string;
  scheduledAt: string;
  status: string;
}

interface QRCodeModalProps {
  challenge: Challenge;
  onClose: () => void;
}

interface QRCodeData {
  challengeId: string;
  qrCodeDataUrl: string;
  checkInUrl: string;
}

export function QRCodeModal({ challenge, onClose }: QRCodeModalProps) {
  const [checkInStatus, setCheckInStatus] = useState<any>(null);
  const { toast } = useToast();

  // Fetch QR code data
  const { data: qrData, isLoading: qrLoading } = useQuery<QRCodeData>({
    queryKey: ['/api/challenges', challenge.id, 'qr-code'],
    queryFn: () => apiRequest(`/api/challenges/${challenge.id}/qr-code`),
  });

  // Fetch check-in status
  const { data: statusData, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/challenges', challenge.id, 'check-in-status'],
    queryFn: () => apiRequest(`/api/challenges/${challenge.id}/check-in-status`),
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
  });

  useEffect(() => {
    if (statusData) {
      setCheckInStatus(statusData);
    }
  }, [statusData]);

  const handleDownloadQR = () => {
    if (!qrData?.qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.href = qrData.qrCodeDataUrl;
    link.download = `challenge-${challenge.id}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'QR Code Downloaded',
      description: 'QR code has been saved to your downloads.',
    });
  };

  const handleShareQR = async () => {
    if (!qrData?.checkInUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Challenge: ${challenge.title}`,
          text: `Join the challenge between ${challenge.aPlayerId} vs ${challenge.bPlayerId}`,
          url: qrData.checkInUrl,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(qrData.checkInUrl);
        toast({
          title: 'Link Copied',
          description: 'Check-in link has been copied to clipboard.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to copy link to clipboard.',
          variant: 'destructive',
        });
      }
    }
  };

  const challengeDate = new Date(challenge.scheduledAt);
  const isToday = challengeDate.toDateString() === new Date().toDateString();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-green-500/20 text-green-400 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-400">
            <QrCode className="h-5 w-5" />
            Challenge Check-In
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          
          {/* Challenge Details */}
          <Card className="bg-gray-800/50 border-green-500/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-green-400 font-semibold">{challenge.title}</h3>
                <Badge 
                  variant="outline" 
                  className={getStatusBadgeClass(challenge.status)}
                >
                  {challenge.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-green-400/70">
                  <Clock className="h-4 w-4" />
                  {challengeDate.toLocaleDateString()} at {challengeDate.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                  {isToday && <Badge className="ml-2 text-xs bg-orange-600">Today</Badge>}
                </div>
                
                <div className="flex items-center gap-2 text-green-400/70">
                  <MapPin className="h-4 w-4" />
                  Hall: {challenge.hallId}
                </div>
                
                <div className="flex items-center gap-2 text-green-400/70">
                  <Users className="h-4 w-4" />
                  {challenge.aPlayerId} vs {challenge.bPlayerId}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <div className="text-center space-y-4">
            {qrLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-green-400">Generating QR code...</div>
              </div>
            ) : qrData ? (
              <>
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img 
                    src={qrData.qrCodeDataUrl} 
                    alt="Challenge Check-in QR Code"
                    className="w-48 h-48"
                  />
                </div>
                
                <div className="space-y-2">
                  <p className="text-green-400/80 text-sm">
                    <Smartphone className="h-4 w-4 inline mr-1" />
                    Scan with your phone to check in
                  </p>
                  <p className="text-green-400/60 text-xs">
                    QR code expires in 15 minutes for security
                  </p>
                </div>
              </>
            ) : (
              <div className="text-red-400">Failed to generate QR code</div>
            )}
          </div>

          {/* Check-in Status */}
          {checkInStatus && (
            <>
              <Separator className="bg-green-500/20" />
              
              <Card className="bg-gray-800/50 border-green-500/20">
                <CardContent className="p-4">
                  <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Check-in Status
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-green-400/80">{challenge.aPlayerId}</span>
                      <Badge 
                        variant={checkInStatus.aPlayerCheckedIn ? "default" : "outline"}
                        className={checkInStatus.aPlayerCheckedIn 
                          ? "bg-green-600 text-black" 
                          : "border-yellow-500 text-yellow-400"
                        }
                      >
                        {checkInStatus.aPlayerCheckedIn ? "Checked In" : "Waiting"}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-green-400/80">{challenge.bPlayerId}</span>
                      <Badge 
                        variant={checkInStatus.bPlayerCheckedIn ? "default" : "outline"}
                        className={checkInStatus.bPlayerCheckedIn 
                          ? "bg-green-600 text-black" 
                          : "border-yellow-500 text-yellow-400"
                        }
                      >
                        {checkInStatus.bPlayerCheckedIn ? "Checked In" : "Waiting"}
                      </Badge>
                    </div>
                  </div>

                  {checkInStatus.bothPlayersCheckedIn && (
                    <div className="mt-3 p-2 bg-green-600/20 border border-green-500/30 rounded-md text-center">
                      <span className="text-green-400 font-semibold">
                        🎱 Both players ready! Challenge can begin.
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleDownloadQR}
              disabled={!qrData}
              className="flex-1 bg-green-600 hover:bg-green-700 text-black"
              data-testid="button-download-qr"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            
            <Button
              onClick={handleShareQR}
              disabled={!qrData}
              variant="outline"
              className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10"
              data-testid="button-share-qr"
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10"
            data-testid="button-close-qr-modal"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
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