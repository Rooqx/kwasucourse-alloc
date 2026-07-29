'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AllocationStatusBadge } from './allocation-status-badge';
import { ConflictBadge } from './conflict-badge';
import { Check, AlertTriangle, UserCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Lecturer {
  id: string; // LecturerProfile ID
  name: string;
}

interface Allocation {
  id: string;
  courseCode: string;
  courseTitle: string;
  lecturerId: string;
  lecturerName: string;
  status: string;
  hasConflict: boolean;
  flagReason?: string;
}

interface DraftAllocationTableProps {
  allocations: Allocation[];
  lecturers: Lecturer[];
  onApprove: (id: string) => void;
  onReassign: (allocationId: string, newLecturerId: string) => void;
  showResolveAction?: boolean;
}

export function DraftAllocationTable({ allocations, lecturers, onApprove, onReassign, showResolveAction }: DraftAllocationTableProps) {
  if (allocations.length === 0) {
    return <div className="text-center p-8 text-muted-foreground border rounded-lg bg-card">No allocations found in this view.</div>;
  }

  return (
    <TooltipProvider>
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Code</TableHead>
              <TableHead>Course Title</TableHead>
              <TableHead>Assigned Lecturer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Conflict</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allocations.map((alloc) => (
              <TableRow key={alloc.id}>
                <TableCell className="font-medium whitespace-nowrap">{alloc.courseCode}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={alloc.courseTitle}>{alloc.courseTitle}</TableCell>
                <TableCell>
                  <Select 
                    value={alloc.lecturerId} 
                    onValueChange={(val) => { if (val) onReassign(alloc.id, val); }}
                  >
                    <SelectTrigger className="h-8 w-full min-w-[180px]">
                      <SelectValue placeholder="Select Lecturer" />
                    </SelectTrigger>
                    <SelectContent>
                      {lecturers.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 items-start">
                    <AllocationStatusBadge status={alloc.status} />
                    {alloc.status === 'FLAGGED' && alloc.flagReason && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1 max-w-[200px] leading-tight">
                        <AlertTriangle className="size-3 flex-shrink-0 text-amber-500" />
                        <span className="truncate" title={alloc.flagReason}>{alloc.flagReason}</span>
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <ConflictBadge hasConflict={alloc.hasConflict} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {(alloc.status === 'DRAFT' || alloc.status === 'FLAGGED') && (
                      <Tooltip>
                        <TooltipTrigger render={
                          <Button variant="ghost" size="icon" onClick={() => onApprove(alloc.id)} className="text-green-600 hover:text-green-700 hover:bg-green-50 size-8">
                            {showResolveAction ? <UserCheck className="size-4" /> : <Check className="size-4" />}
                          </Button>
                        } />
                        <TooltipContent>{showResolveAction ? 'Resolve & Approve' : 'Approve Allocation'}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
