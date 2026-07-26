'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = () => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => setSessions(d.data || []))
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => fetchSessions(), []);

  const handleActivate = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}/activate`, { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      toast.success('Session activated');
      fetchSessions();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Academic Sessions</h1>
        <Button>Add Session</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-4">No sessions found.</TableCell></TableRow>}
              {sessions.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{new Date(s.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(s.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {s.isActive ? (
                      <Badge style={{ backgroundColor: 'var(--status-approved)' }}>Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!s.isActive && (
                      <Button size="sm" variant="outline" onClick={() => handleActivate(s.id)}>Activate</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
