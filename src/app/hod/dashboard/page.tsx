'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, FileText, CheckCircle, AlertTriangle, Play } from 'lucide-react';
const Skeleton = ({ className }: { className?: string }) => <div className={`animate-pulse rounded-md bg-muted ${className}`} />;

export default function HodDashboard() {
  const { fetchWithAuth } = useAuth();
  const [stats, setStats] = useState({ total: 0, draft: 0, approved: 0, flagged: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetchWithAuth('/api/allocation/draft');
        const data = await res.json();
        if (data.data) {
          const allocations = data.data;
          setStats({
            total: allocations.length,
            draft: allocations.filter((a: any) => a.status === 'DRAFT').length,
            approved: allocations.filter((a: any) => a.status === 'APPROVED').length,
            flagged: allocations.filter((a: any) => a.status === 'FLAGGED').length,
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [fetchWithAuth]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HOD Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of course allocations for the current session.</p>
        </div>
        <div className="flex items-center gap-3">
          
<Button variant="outline">
            <Link href="/hod/allocation/review">
              <FileText className="size-4 mr-2" />
              Review Draft
            </Link>
          </Button>
          
<Button>
            <Link href="/hod/allocation/run">
              <Play className="size-4 mr-2" />
              Run Allocation
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allocations</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{stats.total}</div>}
            <p className="text-xs text-muted-foreground mt-1">Current session</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending (DRAFT)</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{stats.draft}</div>}
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{stats.approved}</div>}
            <p className="text-xs text-muted-foreground mt-1">Finalized allocations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <AlertTriangle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{stats.flagged}</div>}
            <p className="text-xs text-muted-foreground mt-1">Requires review</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
