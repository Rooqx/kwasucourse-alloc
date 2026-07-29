'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api/fetch';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BookOpen, ListOrdered, UserCheck, Bell } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function LecturerDashboardPage() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    preferencesSubmitted: 0,
    allocationsReceived: 0,
    unreadNotifications: 0,
  });
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [coursesReq, prefsReq, allocReq, notifReq] = await Promise.all([
          fetchWithAuth('/api/courses'),
          fetchWithAuth('/api/preferences'),
          fetchWithAuth('/api/allocation/my'),
          fetchWithAuth('/api/notifications')
        ]);
        
        const coursesRes = await coursesReq.json();
        const prefsRes = await prefsReq.json();
        const allocRes = await allocReq.json();
        
        const notifRes = await notifReq.json();
        
        const notifications = notifRes.data || [];
        const unreadCount = notifications.filter((n: any) => !n.isRead).length;

        setStats({
          totalCourses: coursesRes.data?.length || 0,
          preferencesSubmitted: prefsRes.data?.length || 0,
          allocationsReceived: allocRes.data?.length || 0,
          unreadNotifications: unreadCount,
        });

        setRecentNotifications(notifications.slice(0, 3));
      } catch (error) {
        console.error('Failed to load stats', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lecturer Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your courses and allocations.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Courses</CardTitle>
            <BookOpen className="text-muted-foreground" data-icon />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground mt-1">For current session</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Preferences Submitted</CardTitle>
            <ListOrdered className="text-muted-foreground" data-icon />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.preferencesSubmitted}</div>
            <div className="mt-2">
              <Link href="/lecturer/preferences" className="text-xs text-primary hover:underline">
                Manage preferences
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Allocations Received</CardTitle>
            <UserCheck className="text-muted-foreground" data-icon />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.allocationsReceived}</div>
            <div className="mt-2">
              <Link href="/lecturer/allocations" className="text-xs text-primary hover:underline">
                View allocations
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex flex-col gap-1">
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>
                {stats.unreadNotifications > 0 
                  ? `You have ${stats.unreadNotifications} unread notification${stats.unreadNotifications > 1 ? 's' : ''}`
                  : "You're all caught up!"}
              </CardDescription>
            </div>
            <Bell className="text-muted-foreground size-5" data-icon />
          </CardHeader>
          <CardContent>
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg bg-muted/20">
                No notifications found.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentNotifications.map(notification => (
                  <div key={notification.id} className={cn("flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0", !notification.isRead && "font-medium")}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">{notification.type}</Badge>
                      {!notification.isRead && <span className="size-1.5 rounded-full bg-primary" />}
                    </div>
                    <p className="text-sm truncate" title={notification.message}>{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))}
                <div className="pt-2">
                  <Link href="/lecturer/notifications" className="text-sm text-primary hover:underline">
                    View all notifications →
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
