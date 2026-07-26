'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Flag, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Allocation {
  id: string;
  status: string;
  hasConflict: boolean;
  course: {
    code: string;
    title: string;
    units: number;
  };
  lecturerId: string;
}

export default function LecturerAllocationsPage() {
  const { user, fetchWithAuth } = useAuth();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [flagReason, setFlagReason] = useState('');
  const [flaggingId, setFlaggingId] = useState<string | null>(null);
  const [isFlagging, setIsFlagging] = useState(false);

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      setIsLoading(true);
      const res = await fetchWithAuth('/api/allocation/draft');
      const data = await res.json();
      if (data.data) {
        // Filter by logged in lecturer
        const myAllocations = data.data.filter((a: Allocation) => a.lecturerId === user?.id);
        setAllocations(myAllocations);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch allocations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlag = async (allocationId: string) => {
    if (!flagReason.trim()) {
      toast.error('Please provide a reason for flagging');
      return;
    }
    
    try {
      setIsFlagging(true);
      const res = await fetchWithAuth(`/api/allocation/${allocationId}/flag`, {
        method: 'POST',
        body: JSON.stringify({ reason: flagReason }),
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      toast.success('Allocation flagged successfully');
      setFlaggingId(null);
      setFlagReason('');
      fetchAllocations();
    } catch (error: any) {
      toast.error(error.message || 'Failed to flag allocation');
    } finally {
      setIsFlagging(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return { backgroundColor: 'var(--status-draft, #4A6FA5)', color: 'white' };
      case 'APPROVED': return { backgroundColor: 'var(--status-approved, #256226)', color: 'white' };
      case 'FLAGGED': return { backgroundColor: 'var(--status-flagged, #C2740A)', color: 'white' };
      case 'CONFLICT': return { backgroundColor: 'var(--status-conflict, #B3261E)', color: 'white' };
      default: return {};
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin size-8 text-muted-foreground" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>My Course Allocations</CardTitle>
          <CardDescription>View and manage your assigned courses for the current session.</CardDescription>
        </CardHeader>
        <CardContent>
          {allocations.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No allocations found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Conflict</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell className="font-medium">{allocation.course.code}</TableCell>
                    <TableCell>{allocation.course.title}</TableCell>
                    <TableCell>{allocation.course.units}</TableCell>
                    <TableCell>
                      <Badge style={getStatusColor(allocation.status)} className="border-0">
                        {allocation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {allocation.hasConflict ? (
                        <Badge variant="destructive">Yes</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {allocation.status === 'APPROVED' && (
                          
<Button variant="outline" size="sm">
                            <Link href={`/lecturer/allocations/${allocation.id}/teaching-guide`}>
                              <FileText className="size-4 mr-2" />
                              Guide
                            </Link>
                          </Button>
                        )}
                        {(allocation.status === 'DRAFT' || allocation.status === 'APPROVED') && (
                          <Dialog open={flaggingId === allocation.id} onOpenChange={(open) => !open && setFlaggingId(null)}>
                            
<DialogTrigger>
                              <Button variant="outline" size="sm" onClick={() => setFlaggingId(allocation.id)}>
                                <Flag className="size-4 mr-2" />
                                Flag
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Flag Allocation</DialogTitle>
                                <DialogDescription>
                                  Please provide a reason for flagging this allocation (e.g., schedule conflict, incorrect course).
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <Textarea
                                  placeholder="Enter your reason here..."
                                  value={flagReason}
                                  onChange={(e) => setFlagReason(e.target.value)}
                                  rows={4}
                                />
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setFlaggingId(null)} disabled={isFlagging}>
                                  Cancel
                                </Button>
                                <Button onClick={() => handleFlag(allocation.id)} disabled={isFlagging}>
                                  {isFlagging && <Loader2 className="size-4 mr-2 animate-spin" />}
                                  Submit Flag
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
