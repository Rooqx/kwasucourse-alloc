'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AllocationStatusBadge } from './allocation-status-badge';
import { ConflictBadge } from './conflict-badge';
import { Check, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Allocation {
  id: string;
  courseCode: string;
  courseTitle: string;
  lecturerName: string;
  status: string;
  hasConflict: boolean;
  flagReason?: string;
}

interface DraftAllocationTableProps {
  allocations: Allocation[];
  onApprove: (id: string) => void;
}

export function DraftAllocationTable({ allocations, onApprove }: DraftAllocationTableProps) {
  if (allocations.length === 0) {
    return <div className="text-center p-8 text-muted-foreground border rounded-lg">No allocations found.</div>;
  }

  return (
    <TooltipProvider>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Code</TableHead>
              <TableHead>Course Title</TableHead>
              <TableHead>Lecturer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Conflict</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allocations.map((alloc) => (
              <TableRow key={alloc.id}>
                <TableCell className="font-medium">{alloc.courseCode}</TableCell>
                <TableCell>{alloc.courseTitle}</TableCell>
                <TableCell>{alloc.lecturerName}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 items-start">
                    <AllocationStatusBadge status={alloc.status} />
                    {alloc.status === 'FLAGGED' && alloc.flagReason && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="size-3" />
                        {alloc.flagReason}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <ConflictBadge hasConflict={alloc.hasConflict} />
                </TableCell>
                <TableCell className="text-right">
                  {alloc.status === 'DRAFT' && (
                    <Tooltip>
                      
<TooltipTrigger>
                        <Button variant="ghost" size="icon" onClick={() => onApprove(alloc.id)} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                          <Check className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Approve Allocation</TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
