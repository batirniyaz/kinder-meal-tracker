
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface Notification {
  id: number;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  created_at: string;
  read: boolean;
}

export const NotificationsTab = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    fetchInitialNotifications();
    setupWebSocket();

    return () => {
      // Cleanup WebSocket connection
    };
  }, []);

  const fetchInitialNotifications = async () => {
    try {
      const response = await fetch('/ws/notification/notifications');
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data || []);
      }
    } catch (error) {
      console.error('Error fetching initial notifications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/notifications/alert`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Notifications WebSocket connected');
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          console.log('Received notification:', notification);
          
          // Add new notification to the list
          setNotifications(prev => [notification, ...prev]);
          
          // Show toast notification
          toast({
            title: notification.type,
            description: notification.message,
            variant: notification.severity === 'error' ? 'destructive' : 'default',
          });
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      ws.onclose = () => {
        console.log('Notifications WebSocket disconnected');
        setWsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          setupWebSocket();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('Notifications WebSocket error:', error);
        setWsConnected(false);
      };

    } catch (error) {
      console.error('Error setting up notifications WebSocket:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <div className={`px-3 py-1 rounded-full text-sm ${
          wsConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {wsConnected ? 'Live Notifications Active' : 'Disconnected'}
        </div>
      </div>

      <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
        <p><strong>Real-time Notifications:</strong> This page shows system alerts including low ingredient warnings and misuse alerts. New notifications appear automatically via WebSocket.</p>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card key={notification.id} className={`border-l-4 ${getSeverityColor(notification.severity)}`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span className="text-lg">{notification.type}</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getSeverityColor(notification.severity)}>
                    {notification.severity.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{notification.message}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No notifications yet. You'll receive alerts here when ingredient levels are low or when potential misuse is detected.
        </div>
      )}
    </div>
  );
};
