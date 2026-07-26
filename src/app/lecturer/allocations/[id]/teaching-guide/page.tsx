'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface TeachingGuide {
  id: string;
  allocationId: string;
  content: string;
  createdAt: string;
}

export default function TeachingGuidePage() {
  const params = useParams();
  const allocationId = params.id as string;
  const { fetchWithAuth } = useAuth();
  const [guide, setGuide] = useState<TeachingGuide | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (allocationId) {
      fetchGuide();
    }
  }, [allocationId]);

  const fetchGuide = async () => {
    try {
      setIsLoading(true);
      const res = await fetchWithAuth(`/api/teaching-guide/${allocationId}`);
      const data = await res.json();
      if (data.data) {
        setGuide(data.data);
      } else {
        toast.error('Teaching guide not found');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch teaching guide');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin size-8 text-muted-foreground" /></div>;
  }

  if (!guide) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <p className="text-muted-foreground">Teaching guide not available for this allocation.</p>
        
<Button variant="outline">
          <Link href="/lecturer/allocations">Go Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        
<Button variant="ghost" className="print:hidden">
          <Link href="/lecturer/allocations">
            <ArrowLeft className="size-4 mr-2" />
            Back to Allocations
          </Link>
        </Button>
        <Button onClick={handlePrint} className="print:hidden">
          <Printer className="size-4 mr-2" />
          Print Guide
        </Button>
      </div>
      
      <Card className="print:border-none print:shadow-none">
        <CardHeader>
          <CardTitle>Teaching Guide</CardTitle>
          <CardDescription>Generated for allocation {allocationId}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            {guide.content.split('\n').map((line, i) => (
              <p key={i} className="mb-2">
                {line}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
