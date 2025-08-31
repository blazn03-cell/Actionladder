import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Zap, Trophy, Users, Target, Crown, AlertTriangle, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Player, Match, Tournament } from "@shared/schema";

interface Notification {
  id: string;
  type: "challenge" | "match_result" | "tournament" | "ladder_change" | "rookie_graduation" | "hall_battle";
  title: string;
  message: string;
  timestamp: Date;
  urgent: boolean;
  actionUrl?: string;
  icon?: React.ReactNode;
}

// Mock WebSocket for real-time updates (in production, use actual WebSocket)
class NotificationService {
  private listeners: ((notification: Notification) => void)[] = [];
  private interval: NodeJS.Timeout | null = null;

  subscribe(callback: (notification: Notification) => void) {
    this.listeners.push(callback);
    
    // Simulate real-time notifications
    if (!this.interval) {
      this.interval = setInterval(() => {
        this.simulateNotification();
      }, 30000); // Every 30 seconds
    }

    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
      if (this.listeners.length === 0 && this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    };
  }

  private simulateNotification() {
    const notifications = [
      {
        id: `notif-${Date.now()}`,
        type: "challenge" as const,
        title: "New Challenge!",
        message: "Tommy 'The Knife' Rodriguez challenged you to a $50 8-ball match",
        timestamp: new Date(),
        urgent: true,
        icon: <Target className="w-4 h-4" />,
      },
      {
        id: `notif-${Date.now()}-2`,
        type: "ladder_change" as const,
        title: "Ladder Movement",
        message: "You've moved up 2 positions on the ladder!",
        timestamp: new Date(),
        urgent: false,
        icon: <Trophy className="w-4 h-4" />,
      },
      {
        id: `notif-${Date.now()}-3`,
        type: "rookie_graduation" as const,
        title: "Rookie Graduated",
        message: "Sarah 'Rising Star' just graduated to the main ladder!",
        timestamp: new Date(),
        urgent: false,
        icon: <Crown className="w-4 h-4" />,
      },
    ];

    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    this.listeners.forEach(listener => listener(randomNotification));
  }

  // Trigger specific notifications
  challengeReceived(challenger: string, amount: number, gameType: string) {
    const notification: Notification = {
      id: `challenge-${Date.now()}`,
      type: "challenge",
      title: "New Challenge!",
      message: `${challenger} challenged you to a $${amount} ${gameType} match`,
      timestamp: new Date(),
      urgent: true,
      icon: <Target className="w-4 h-4 text-orange-400" />,
    };
    this.listeners.forEach(listener => listener(notification));
  }

  matchResult(winner: string, loser: string, gameType: string) {
    const notification: Notification = {
      id: `match-${Date.now()}`,
      type: "match_result",
      title: "Match Completed",
      message: `${winner} defeated ${loser} in ${gameType}`,
      timestamp: new Date(),
      urgent: false,
      icon: <CheckCircle className="w-4 h-4 text-green-400" />,
    };
    this.listeners.forEach(listener => listener(notification));
  }

  rookieGraduation(playerName: string) {
    const notification: Notification = {
      id: `graduation-${Date.now()}`,
      type: "rookie_graduation",
      title: "Rookie Graduated!",
      message: `${playerName} has graduated to the main ladder`,
      timestamp: new Date(),
      urgent: false,
      icon: <Crown className="w-4 h-4 text-yellow-400" />,
    };
    this.listeners.forEach(listener => listener(notification));
  }

  hallBattleUpdate(homeHall: string, awayHall: string, score: string) {
    const notification: Notification = {
      id: `hall-battle-${Date.now()}`,
      type: "hall_battle",
      title: "Hall Battle Update",
      message: `${homeHall} vs ${awayHall}: ${score}`,
      timestamp: new Date(),
      urgent: false,
      icon: <Users className="w-4 h-4 text-blue-400" />,
    };
    this.listeners.forEach(listener => listener(notification));
  }
}

const notificationService = new NotificationService();

function NotificationCard({ notification, onDismiss }: { 
  notification: Notification; 
  onDismiss: (id: string) => void;
}) {
  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'challenge': return 'border-orange-500/30 bg-orange-900/20';
      case 'match_result': return 'border-green-500/30 bg-green-900/20';
      case 'tournament': return 'border-purple-500/30 bg-purple-900/20';
      case 'ladder_change': return 'border-blue-500/30 bg-blue-900/20';
      case 'rookie_graduation': return 'border-yellow-500/30 bg-yellow-900/20';
      case 'hall_battle': return 'border-cyan-500/30 bg-cyan-900/20';
      default: return 'border-gray-500/30 bg-gray-900/20';
    }
  };

  return (
    <Card className={`${getTypeColor(notification.type)} ${notification.urgent ? 'ring-2 ring-red-500/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="mt-1">
            {notification.icon || <Bell className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">{notification.title}</h4>
              <div className="flex items-center space-x-2">
                {notification.urgent && (
                  <Badge className="bg-red-600/20 text-red-400 border-red-500/30 text-xs">
                    Urgent
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(notification.id)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                >
                  ×
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-2">
              {notification.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 10)); // Keep only 10 most recent
      
      // Show toast for urgent notifications
      if (notification.urgent) {
        toast({
          title: notification.title,
          description: notification.message,
          duration: 5000,
        });
      }
    });

    return unsubscribe;
  }, [toast]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const urgentCount = notifications.filter(n => n.urgent).length;

  return (
    <div className="fixed top-4 right-4 z-50" data-testid="notification-center">
      {/* Notification Bell */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="relative bg-black/80 backdrop-blur-sm border-green-500/30 hover:bg-green-900/20"
        data-testid="notification-bell"
      >
        <Bell className="w-4 h-4 text-green-400" />
        {notifications.length > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-600 text-white text-xs">
            {notifications.length > 9 ? '9+' : notifications.length}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isVisible && (
        <div className="absolute top-12 right-0 w-80 max-h-96 overflow-y-auto bg-black/95 backdrop-blur-md border border-green-500/30 rounded-lg shadow-2xl">
          <div className="p-4 border-b border-green-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Notifications</h3>
              <div className="flex items-center space-x-2">
                {urgentCount > 0 && (
                  <Badge className="bg-red-600/20 text-red-400 border-red-500/30">
                    {urgentCount} urgent
                  </Badge>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllNotifications}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No notifications yet</p>
                <p className="text-gray-500 text-xs mt-1">
                  You'll see challenges, match results, and updates here
                </p>
              </div>
            ) : (
              notifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onDismiss={dismissNotification}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Export the notification service for use in other components
export { notificationService };