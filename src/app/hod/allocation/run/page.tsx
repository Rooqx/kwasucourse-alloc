'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import Link from 'next/link';
import { Play, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function RunAllocationPage() {
  const { fetchWithAuth } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{ total: number; conflicts: number; unallocatedCourses: number; unallocatedLecturers: number } | null>(null);

  const handleRunAllocation = async () => {
    setIsRunning(true);
    try {
      const res = await fetchWithAuth('/api/allocation/run', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error?.message || 'Failed to run allocation');
      
      setResults(data.data);
      toast.success('Allocation algorithm completed successfully');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while running the allocation');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Run Allocation</h1>
        <p className="text-muted-foreground mt-1">Execute the automated course allocation algorithm for the current session.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Algorithm Execution</CardTitle>
          <CardDescription>
            This will process lecturer preferences, course requirements, and workload limits to generate a draft allocation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Session</span>
              <span className="text-sm">2023/2024</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Semester</span>
              <span className="text-sm">Harmattan</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
          
<Button variant="outline">
            <Link href="/hod/dashboard">Cancel</Link>
          </Button>
          <Button onClick={handleRunAllocation} disabled={isRunning}>
            {isRunning ? 'Running...' : (
              <>
                <Play className="size-4 mr-2" />
                Start Allocation
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {results && (
        <Card className="border-green-200">
          <CardHeader className="bg-green-50/50 pb-4">
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="size-5" />
              Allocation Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col p-3 bg-muted rounded-md border">
                <span className="text-sm text-muted-foreground">Total Allocations</span>
                <span className="text-2xl font-bold">{results.total}</span>
              </div>
              <div className="flex flex-col p-3 bg-red-50 rounded-md border border-red-100">
                <span className="text-sm text-red-600">Conflicts Detected</span>
                <span className="text-2xl font-bold text-red-700">{results.conflicts}</span>
              </div>
              <div className="flex flex-col p-3 bg-muted rounded-md border">
                <span className="text-sm text-muted-foreground">Unallocated Courses</span>
                <span className="text-2xl font-bold">{results.unallocatedCourses}</span>
              </div>
              <div className="flex flex-col p-3 bg-muted rounded-md border">
                <span className="text-sm text-muted-foreground">Unallocated Lecturers</span>
                <span className="text-2xl font-bold">{results.unallocatedLecturers}</span>
              </div>
            </div>
            {results.conflicts > 0 && (
              <div className="mt-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
                <AlertTriangle className="size-4" />
                Conflicts require manual resolution in the review step.
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end border-t p-6">
            
<Button>
              <Link href="/hod/allocation/review">
                <FileText className="size-4 mr-2" />
                Review Draft
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
