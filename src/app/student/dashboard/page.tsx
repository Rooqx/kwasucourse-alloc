'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Layers, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboardPage() {
  const { user, fetchWithAuth } = useAuth();
  const [stats, setStats] = useState({
    registeredCourses: 0,
    currentSession: 'Loading...'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [regRes, sessRes] = await Promise.all([
        fetchWithAuth('/api/student/registrations'),
        fetchWithAuth('/api/sessions')
      ]);
      
      const regData = await regRes.json();
      const sessData = await sessRes.json();
      
      const activeSession = (sessData.data || []).find((s: any) => s.isActive);
      
      setStats(prev => ({
        ...prev,
        registeredCourses: regData.data ? regData.data.length : 0,
        currentSession: activeSession ? `${activeSession.label} (${activeSession.semester})` : 'No active session'
      }));
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin size-8 text-muted-foreground" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BookOpen className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Registered Courses</p>
                <h3 className="text-2xl font-bold">{stats.registeredCourses}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Layers className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Current Level</p>
                <h3 className="text-2xl font-bold">{user?.level ? `${user.level}L` : 'N/A'}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Current Session</p>
                <h3 className="text-lg font-bold">{stats.currentSession}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Browse Courses</CardTitle>
            <CardDescription>View all available courses for this session.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Link href="/student/courses" className="flex items-center">
                Browse Courses <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>My Registrations</CardTitle>
            <CardDescription>Manage your currently registered courses.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Link href="/student/my-courses" className="flex items-center">
                View My Courses <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
