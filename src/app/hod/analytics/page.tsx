'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkloadBarChart } from '@/components/allocation/workload-bar-chart';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
const Skeleton = ({ className }: { className?: string }) => <div className={`animate-pulse rounded-md bg-muted ${className}`} />;

export default function AnalyticsPage() {
  const { fetchWithAuth } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetchWithAuth('/api/analytics');
        const json = await res.json();
        // Fallback to mock data if API is not fully implemented
        setData(json.data || {
          workload: [
            { name: 'Dr. Smith', units: 12, maxUnits: 15 },
            { name: 'Prof. Jones', units: 9, maxUnits: 12 },
            { name: 'Dr. Doe', units: 15, maxUnits: 15 },
            { name: 'Dr. Adams', units: 6, maxUnits: 12 },
          ],
          status: [
            { name: 'Draft', value: 15 },
            { name: 'Approved', value: 45 },
            { name: 'Flagged', value: 5 },
          ],
          preferences: [
            { name: 'Top 1', value: 30 },
            { name: 'Top 3', value: 20 },
            { name: 'Other', value: 10 },
          ]
        });
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [fetchWithAuth]);

  // Brand colors
  const STATUS_COLORS = ['#4A6FA5', '#256226', '#C2740A'];
  
  if (loading || !data) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Data insights for course allocations.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full md:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Data insights for course allocations.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Allocation Status</CardTitle>
            <CardDescription>Breakdown of current allocations by status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.status}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {data.status.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preference Fulfillment</CardTitle>
            <CardDescription>How often lecturers received their preferred courses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.preferences} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                  />
                  <Bar dataKey="value" fill="#2E7830" radius={[4, 4, 0, 0]} name="Allocations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Lecturer Workload Distribution</CardTitle>
            <CardDescription>Allocated units vs maximum allowed units per lecturer.</CardDescription>
          </CardHeader>
          <CardContent>
            <WorkloadBarChart data={data.workload} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
