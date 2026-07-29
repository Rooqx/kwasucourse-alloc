'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AllocationHistoryPage() {
  const { fetchWithAuth } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingAllocations, setLoadingAllocations] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetchWithAuth('/api/sessions');
        const data = await res.json();
        if (data.data) {
          setSessions(data.data);
          const defaultSession = data.data.find((s: any) => s.isActive) || data.data[0];
          if (defaultSession) {
            setSelectedSessionId(defaultSession.id);
          }
        }
      } catch (error) {
        toast.error('Failed to load sessions');
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, [fetchWithAuth]);

  useEffect(() => {
    if (!selectedSessionId) return;
    
    const fetchAllocations = async () => {
      setLoadingAllocations(true);
      try {
        const res = await fetchWithAuth(`/api/allocation/draft?sessionId=${selectedSessionId}&status=APPROVED`);
        const data = await res.json();
        if (data.data) {
          setAllocations(data.data.allocations);
        }
      } catch (error) {
        toast.error('Failed to load allocations for session');
      } finally {
        setLoadingAllocations(false);
      }
    };
    fetchAllocations();
  }, [selectedSessionId, fetchWithAuth]);

  const selectedSessionLabel = sessions.find(s => s.id === selectedSessionId)?.label || '';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Allocation History</h1>
          <p className="text-muted-foreground mt-1">View past course allocations across different academic sessions.</p>
        </div>
        <div className="w-[250px]">
          {loadingSessions ? (
            <div className="h-10 border rounded-md flex items-center justify-center bg-muted">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Select value={selectedSessionId} onValueChange={(v) => setSelectedSessionId(v || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select Session" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {sessions.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.label} - {s.semester}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session: {selectedSessionLabel}</CardTitle>
          <CardDescription>Finalized course allocation records.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAllocations ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : allocations.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg bg-card">
              No approved allocations found for this session.
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Title</TableHead>
                    <TableHead>Lecturer</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Semester</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((alloc) => (
                    <TableRow key={alloc.id}>
                      <TableCell className="font-medium whitespace-nowrap">{alloc.course?.code}</TableCell>
                      <TableCell>{alloc.course?.title}</TableCell>
                      <TableCell>{alloc.lecturer?.user?.fullName}</TableCell>
                      <TableCell>{alloc.course?.units}</TableCell>
                      <TableCell>{alloc.course?.semester}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
