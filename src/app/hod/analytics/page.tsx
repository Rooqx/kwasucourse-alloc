'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Loader2 } from 'lucide-react';

const COLORS = ['#2E7830', '#f59e0b', '#ef4444', '#3b82f6'];

export default function AnalyticsPage() {
  const { fetchWithAuth } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetchWithAuth('/api/analytics');
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
      } catch (error) {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [fetchWithAuth]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin size-8 text-muted-foreground" /></div>;
  }

  if (!data) return <div className="p-8 text-center">No data available</div>;

  // Format Status Breakdown
  const statusData = data.statusBreakdown.map((s: any) => ({
    name: s.status,
    value: s.count
  }));

  // Calculate Average Workload
  const totalUnits = data.workloadDistribution.reduce((sum: number, l: any) => sum + l.units, 0);
  const avgWorkload = data.workloadDistribution.length ? (totalUnits / data.workloadDistribution.length).toFixed(1) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
        <p className="text-muted-foreground mt-1">Data-driven insights into the current academic session allocations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalAllocations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Lecturers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.workloadDistribution.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Units/Lecturer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgWorkload}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Allocation Status</CardTitle>
            <CardDescription>Breakdown of drafts, approved, and flagged.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No allocations found</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Most-Preferred Courses</CardTitle>
            <CardDescription>Courses with the highest number of lecturer preference requests.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {data.top5PreferredCourses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.top5PreferredCourses} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={60} tick={{fontSize: 12}} />
                  <Tooltip />
                  <Bar dataKey="value" name="Requests" fill="#2E7830" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No preference data found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
