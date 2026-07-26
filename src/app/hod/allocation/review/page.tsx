'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { DraftAllocationTable } from '@/components/allocation/draft-allocation-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function ReviewAllocationPage() {
  const { fetchWithAuth } = useAuth();
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllocations();
  }, [fetchWithAuth]);

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/allocation/draft');
      const data = await res.json();
      if (data.data) {
        setAllocations(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch allocations');
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
      
      // Update local state
      setAllocations(allocations.map(a => a.id === id ? { ...a, status: 'APPROVED' } : a));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filterAllocations = (status: string | null) => {
    if (!status) return allocations;
    return allocations.filter(a => a.status === status);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review Allocations</h1>
        <p className="text-muted-foreground mt-1">Review, approve, or resolve conflicts for draft course allocations.</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="DRAFT">Drafts</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="FLAGGED">Flagged</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <DraftAllocationTable allocations={allocations} onApprove={handleApprove} />
        </TabsContent>
        <TabsContent value="DRAFT" className="mt-0">
          <DraftAllocationTable allocations={filterAllocations('DRAFT')} onApprove={handleApprove} />
        </TabsContent>
        <TabsContent value="APPROVED" className="mt-0">
          <DraftAllocationTable allocations={filterAllocations('APPROVED')} onApprove={handleApprove} />
        </TabsContent>
        <TabsContent value="FLAGGED" className="mt-0">
          <DraftAllocationTable allocations={filterAllocations('FLAGGED')} onApprove={handleApprove} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
