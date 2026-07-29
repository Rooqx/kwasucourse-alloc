'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { DraftAllocationTable } from '@/components/allocation/draft-allocation-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { WorkloadBarChart } from '@/components/allocation/workload-bar-chart';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function ReviewAllocationPage() {
  const { fetchWithAuth } = useAuth();
  const [allocations, setAllocations] = useState<any[]>([]);
  const [unallocatedCourses, setUnallocatedCourses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [fetchWithAuth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/allocation/draft');
      const data = await res.json();
      if (data.data) {
        setAllocations(data.data.allocations);
        setUnallocatedCourses(data.data.unallocatedCourses);
        setLecturers(data.data.lecturers);
      }
    } catch (error) {
      toast.error('Failed to fetch allocation data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/allocation/${id}/approve`, { method: 'POST' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to approve');
      }
      toast.success('Allocation approved');
      setAllocations(allocations.map(a => a.id === id ? { ...a, status: 'APPROVED' } : a));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReassign = async (id: string, newLecturerId: string) => {
    try {
      const res = await fetchWithAuth(`/api/allocation/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ lecturerId: newLecturerId })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to reassign');
      }
      toast.success('Lecturer reassigned');
      fetchData(); // Reload to get fresh workload and updated flags
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAssignUnallocated = async (courseId: string, lecturerId: string) => {
    try {
      const res = await fetchWithAuth(`/api/allocation`, {
        method: 'POST',
        body: JSON.stringify({ courseId, lecturerId })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to assign');
      }
      toast.success('Course assigned successfully');
      fetchData(); // Reload to move course to allocations
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const res = await fetchWithAuth(`/api/allocation/publish`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to publish');
      }
      const data = await res.json();
      toast.success(`Successfully published ${data.data.publishedCount} draft allocations!`);
      fetchData(); // Refresh the data to reflect APPROVED statuses
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const mapToTableData = (allocs: any[]) => {
    return allocs.map(a => ({
      id: a.id,
      courseCode: a.course?.code,
      courseTitle: a.course?.title,
      lecturerId: a.lecturer?.id,
      lecturerName: a.lecturer?.user?.fullName,
      status: a.status,
      hasConflict: a.hasConflict,
      flagReason: a.flags?.[0]?.reason
    }));
  };

  const filterAllocations = (status: string | null) => {
    if (!status) return mapToTableData(allocations);
    return mapToTableData(allocations.filter(a => a.status === status));
  };

  // Compute workload for chart
  const workloadData = lecturers.map(l => {
    const units = allocations
      .filter(a => a.lecturerId === l.id)
      .reduce((sum, a) => sum + (a.course?.units || 0), 0);
    return { name: l.name, units, maxUnits: l.maxLoad };
  });

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin size-8 text-muted-foreground" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Allocations</h1>
          <p className="text-muted-foreground mt-1">Review, approve, or resolve conflicts for draft course allocations.</p>
        </div>
        <Button 
          onClick={handlePublish} 
          disabled={isPublishing || !allocations.some(a => a.status === 'DRAFT')}
        >
          {isPublishing && <Loader2 className="mr-2 size-4 animate-spin" />}
          Publish Allocations
        </Button>
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Lecturer Workload Distribution</h2>
        <WorkloadBarChart data={workloadData} />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Allocations</TabsTrigger>
          <TabsTrigger value="DRAFT">Drafts</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="FLAGGED" className="relative">
            Flagged 
            {allocations.some(a => a.status === 'FLAGGED') && (
              <span className="absolute top-1 right-1 size-2 rounded-full bg-amber-500"></span>
            )}
          </TabsTrigger>
          <TabsTrigger value="UNALLOCATED" className="relative">
            Unallocated
            {unallocatedCourses.length > 0 && (
              <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500"></span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <DraftAllocationTable 
            allocations={filterAllocations(null)} 
            lecturers={lecturers}
            onApprove={handleApprove} 
            onReassign={handleReassign}
          />
        </TabsContent>
        <TabsContent value="DRAFT" className="mt-0">
          <DraftAllocationTable 
            allocations={filterAllocations('DRAFT')} 
            lecturers={lecturers}
            onApprove={handleApprove} 
            onReassign={handleReassign}
          />
        </TabsContent>
        <TabsContent value="APPROVED" className="mt-0">
          <DraftAllocationTable 
            allocations={filterAllocations('APPROVED')} 
            lecturers={lecturers}
            onApprove={handleApprove} 
            onReassign={handleReassign}
          />
        </TabsContent>
        <TabsContent value="FLAGGED" className="mt-0">
          <div className="mb-4 bg-amber-50 text-amber-800 p-4 rounded-md border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="size-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Review Flagged Allocations</h3>
              <p className="text-sm mt-1">Lecturers have flagged these allocations. You can resolve the flag by reassigning the course to another lecturer, or by communicating with the lecturer and approving it manually.</p>
            </div>
          </div>
          <DraftAllocationTable 
            allocations={filterAllocations('FLAGGED')} 
            lecturers={lecturers}
            onApprove={handleApprove} 
            onReassign={handleReassign}
            showResolveAction={true}
          />
        </TabsContent>
        
        <TabsContent value="UNALLOCATED" className="mt-0">
          {unallocatedCourses.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg bg-card">All courses are currently assigned.</div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Title</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Assign Lecturer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unallocatedCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.code}</TableCell>
                      <TableCell>{course.title}</TableCell>
                      <TableCell>{course.units}</TableCell>
                      <TableCell>
                        <Select onValueChange={(val) => { if (typeof val === 'string') handleAssignUnallocated(course.id, val); }}>
                          <SelectTrigger className="h-8 w-full min-w-[200px]">
                            <SelectValue placeholder="Select Lecturer..." />
                          </SelectTrigger>
                          <SelectContent>
                            {lecturers.map(l => (
                              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
