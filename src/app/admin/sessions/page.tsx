'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSessionLabel, setNewSessionLabel] = useState('');
  const [newSessionSemester, setNewSessionSemester] = useState('First Semester');

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

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionLabel) return;
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newSessionLabel,
          semester: newSessionSemester,
          isActive: false
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      toast.success('Session created');
      setIsAddOpen(false);
      setNewSessionLabel('');
      setNewSessionSemester('First Semester');
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
        <Button onClick={() => setIsAddOpen(true)}>Add Session</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-4">No sessions found.</TableCell></TableRow>}
              {sessions.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.label}</TableCell>
                  <TableCell>{s.semester}</TableCell>
                  <TableCell>{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {s.isActive ? (
                      <Badge className="bg-[#256226] text-white">Active</Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground">Inactive</Badge>
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

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Session</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSession} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label (e.g. 2024/2025)</Label>
              <Input 
                id="label" 
                value={newSessionLabel} 
                onChange={(e) => setNewSessionLabel(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select value={newSessionSemester} onValueChange={(val) => { if (typeof val === 'string') setNewSessionSemester(val); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="First Semester">First Semester</SelectItem>
                  <SelectItem value="Second Semester">Second Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit">Create Session</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
