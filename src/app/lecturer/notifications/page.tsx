'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { fetchWithAuth } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetchWithAuth('/api/notifications');
      const data = await res.json();
      if (data.data) {
        setNotifications(data.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/notifications/${id}/read`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
      toast.success('Notification marked as read');
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as read');
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetchWithAuth('/api/notifications/read-all', {
        method: 'PATCH',
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark all as read');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin size-8 text-muted-foreground" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Stay updated with your course allocations and alerts.</CardDescription>
          </div>
          {notifications.some(n => !n.isRead) && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="size-4 mr-2" />
              Mark all read
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No notifications found.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={cn(
                    "flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 border rounded-lg",
                    !notification.isRead ? "bg-muted/50 border-primary/20" : ""
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{notification.type}</Badge>
                      {!notification.isRead && <Badge className="bg-primary">New</Badge>}
                    </div>
                    <p className="text-sm mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  
                  {!notification.isRead && (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                      <Check className="size-4 mr-2" />
                      Mark as read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
