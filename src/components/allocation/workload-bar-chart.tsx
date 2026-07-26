'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface WorkloadData {
  name: string;
  units: number;
  maxUnits: number;
}

interface WorkloadBarChartProps {
  data: WorkloadData[];
}

export function WorkloadBarChart({ data }: WorkloadBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <RechartsTooltip 
          cursor={{ fill: 'hsl(var(--muted))' }} 
          contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }} 
        />
        <Bar dataKey="units" fill="#2E7830" radius={[4, 4, 0, 0]} name="Allocated Units" />
        <Bar dataKey="maxUnits" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="Max Units" />
      </BarChart>
    </ResponsiveContainer>
  );
}
