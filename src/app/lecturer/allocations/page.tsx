'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Flag, FileText, Loader2, CheckCircle2 } from 'lucide-react';
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

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      setIsLoading(true);
      const res = await fetchWithAuth('/api/allocation/my');
      const data = await res.json();
      if (data.data) {
        setAllocations(data.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch allocations');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin size-8 text-muted-foreground" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Allocations</h1>
        <p className="text-muted-foreground mt-2">View your assigned courses and track your teaching preparation.</p>
      </div>

      {allocations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No allocations found for the current session.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allocations.map(allocation => (
            <AllocationCard 
              key={allocation.id} 
              allocation={allocation} 
              fetchWithAuth={fetchWithAuth} 
              onRefresh={fetchAllocations} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AllocationCard({ allocation, fetchWithAuth, onRefresh }: { allocation: Allocation, fetchWithAuth: any, onRefresh: () => void }) {
  const [checklist, setChecklist] = useState<{items: {label: string, checked: boolean}[]}>({ items: [] });
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(true);
  const [flagReason, setFlagReason] = useState('');
  const [isFlagging, setIsFlagging] = useState(false);
  const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);

  useEffect(() => {
    async function loadChecklist() {
      try {
        const res = await fetchWithAuth(`/api/allocation/${allocation.id}/checklist`);
        const data = await res.json();
        if (data.data) {
          setChecklist(data.data);
        }
      } catch (error) {
        console.error('Failed to load checklist', error);
      } finally {
        setIsLoadingChecklist(false);
      }
    }
    loadChecklist();
  }, [allocation.id, fetchWithAuth]);

  const toggleChecklist = async (index: number) => {
    const newItems = [...checklist.items];
    newItems[index].checked = !newItems[index].checked;
    const newState = { items: newItems };
    setChecklist(newState);

    try {
      await fetchWithAuth(`/api/allocation/${allocation.id}/checklist`, {
        method: 'PATCH',
        body: JSON.stringify(newState),
      });
    } catch (error) {
      toast.error('Failed to save checklist state');
      // Revert on error
      newItems[index].checked = !newItems[index].checked;
      setChecklist({ items: newItems });
    }
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) {
      toast.error('Please provide a reason for flagging');
      return;
    }
    try {
      setIsFlagging(true);
      const res = await fetchWithAuth(`/api/allocation/${allocation.id}/flag`, {
        method: 'POST',
        body: JSON.stringify({ reason: flagReason }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      toast.success('Allocation flagged successfully');
      setIsFlagDialogOpen(false);
      setFlagReason('');
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to flag allocation');
    } finally {
      setIsFlagging(false);
    }
  };

  const handleAccept = () => {
    toast.success(`You have acknowledged your assignment for ${allocation.course.code}`);
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

  return (
    <Card className="flex flex-col h-full relative overflow-hidden border-2" style={{ borderColor: allocation.hasConflict ? '#B3261E' : 'transparent' }}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <Badge style={getStatusColor(allocation.status)} className="border-0">
            {allocation.status}
          </Badge>
          {allocation.hasConflict && (
            <Badge variant="destructive">Conflict</Badge>
          )}
        </div>
        <CardTitle className="text-xl">{allocation.course.code}</CardTitle>
        <CardDescription className="line-clamp-2" title={allocation.course.title}>
          {allocation.course.title}
        </CardDescription>
        <div className="text-sm font-medium mt-2">{allocation.course.units} Units</div>
      </CardHeader>

      <CardContent className="flex-grow flex flex-col gap-4">
        {/* Checklist Section */}
        <div className="bg-muted/30 p-4 rounded-lg border flex-grow">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            Preparation Checklist
          </h4>
          {isLoadingChecklist ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin size-4 text-muted-foreground" /></div>
          ) : (
            <div className="flex flex-col gap-3">
              {checklist.items.map((item, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Checkbox 
                    id={`check-${allocation.id}-${index}`} 
                    checked={item.checked}
                    onCheckedChange={() => toggleChecklist(index)}
                  />
                  <Label 
                    htmlFor={`check-${allocation.id}-${index}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-normal"
                  >
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2 pb-4 flex flex-col gap-2">
        {allocation.status === 'APPROVED' && (
          <Link 
            href={`/lecturer/allocations/${allocation.id}/teaching-guide`}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full !justify-start"
          >
            <FileText className="size-4 mr-2" />
            View Teaching Guide
          </Link>
        )}
        
        <div className="flex gap-2 w-full mt-2">
          {(allocation.status === 'DRAFT' || allocation.status === 'APPROVED') && (
            <Button variant="default" className="flex-1" onClick={handleAccept}>
              Accept
            </Button>
          )}
          
          {(allocation.status === 'DRAFT' || allocation.status === 'APPROVED') && (
            <Dialog open={isFlagDialogOpen} onOpenChange={setIsFlagDialogOpen}>
              <DialogTrigger render={<Button variant="destructive" className="flex-1" />}>
                <Flag className="size-4 mr-2" />
                Flag
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
                  <Button variant="outline" onClick={() => setIsFlagDialogOpen(false)} disabled={isFlagging}>
                    Cancel
                  </Button>
                  <Button onClick={handleFlag} disabled={isFlagging}>
                    {isFlagging && <Loader2 className="size-4 mr-2 animate-spin" />}
                    Submit Flag
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
