'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api/fetch';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpen, ListOrdered, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function LecturerDashboardPage() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    preferencesSubmitted: 0,
    allocationsReceived: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [coursesReq, prefsReq, allocReq] = await Promise.all([
          fetchWithAuth('/api/courses'),
          fetchWithAuth('/api/preferences'),
          fetchWithAuth('/api/allocations/my') // assuming this endpoint or similar exists
        ]);
        
        const coursesRes = await coursesReq.json();
        const prefsRes = await prefsReq.json();
        const allocRes = await allocReq.json();
        
        setStats({
          totalCourses: coursesRes.data?.length || 0,
          preferencesSubmitted: prefsRes.data?.length || 0,
          allocationsReceived: allocRes.data?.length || 0,
        });
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
    </div>
  );
}
