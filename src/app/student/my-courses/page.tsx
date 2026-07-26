'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';

interface Course {
  id: string;
  code: string;
  title: string;
  units: number;
  level: string;
}

interface Registration {
  id: string;
  course: Course;
  status: string;
}

export default function MyCoursesPage() {
  const { fetchWithAuth } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [droppingId, setDroppingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setIsLoading(true);
      const res = await fetchWithAuth('/api/student/registrations');
      const data = await res.json();
      if (data.data) {
        setRegistrations(data.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch registered courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (regId: string) => {
    try {
      setDroppingId(regId);
      const res = await fetchWithAuth(`/api/student/registrations/${regId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      toast.success('Course dropped successfully');
      fetchRegistrations();
    } catch (error: any) {
      toast.error(error.message || 'Failed to drop course');
    } finally {
      setDroppingId(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin size-8 text-muted-foreground" /></div>;
  }

  const totalUnits = registrations.reduce((sum, r) => sum + r.course.units, 0);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>Manage your registered courses.</CardDescription>
          </div>
          <div className="text-sm font-medium text-muted-foreground bg-muted px-4 py-2 rounded-lg">
            Total Units: <span className="text-foreground">{totalUnits}</span>
          </div>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">You haven't registered for any courses yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">{registration.course.code}</TableCell>
                    <TableCell>{registration.course.title}</TableCell>
                    <TableCell>{registration.course.units}</TableCell>
                    <TableCell>{registration.course.level}L</TableCell>
                    <TableCell>{registration.status}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDrop(registration.id)}
                        disabled={droppingId === registration.id}
                      >
                        {droppingId === registration.id ? (
                          <Loader2 className="size-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="size-4 mr-2" />
                        )}
                        Drop
                      </Button>
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
