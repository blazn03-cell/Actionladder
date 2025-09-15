import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Trophy, Target, Crown } from "lucide-react";

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

class NotificationService {
  private listeners: ((notification: Notification) => void)[] = [];
  private interval: NodeJS.Timeout | null = null;

  subscribe(callback: (notification: Notification) => void) {
    this.listeners.push(callback);
    
    if (!this.interval) {
      this.interval = setInterval(() => {
        this.simulateNotification();
      }, 30000);
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
    ];

    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    this.listeners.forEach(listener => listener(randomNotification));
  }

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
      setNotifications(prev => [notification, ...prev].slice(0, 10));

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
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="p-2 space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
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

export { notificationService };