'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LecturerInfo {
  user: { fullName: string };
}

interface Allocation {
  status: string;
  lecturer: LecturerInfo;
}

interface Course {
  id: string;
  code: string;
  title: string;
  units: number;
  level: string;
  timeSlot?: string;
  allocations?: Allocation[];
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

  const checkClash = (currentCourse: Course): Course[] => {
    if (!currentCourse.timeSlot) return [];
    
    const day = currentCourse.timeSlot.split(' ')[0];
    const clashes = registrations
      .map(r => r.course)
      .filter(c => c.id !== currentCourse.id && c.timeSlot)
      .filter(c => c.timeSlot === currentCourse.timeSlot || (day && c.timeSlot!.startsWith(day)));
      
    return clashes;
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
                  <TableHead>Lecturer</TableHead>
                  <TableHead>Time Slot</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration) => {
                  const hasApprovedAllocation = registration.course.allocations && registration.course.allocations.length > 0;
                  const lecturerName = hasApprovedAllocation ? registration.course.allocations![0].lecturer.user.fullName : 'Lecturer TBA';
                  
                  const clashes = checkClash(registration.course);
                  const isClashing = clashes.length > 0;

                  return (
                    <TableRow key={registration.id} className={isClashing ? "bg-amber-50/50" : ""}>
                      <TableCell className="font-medium">
                        {registration.course.code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {registration.course.title}
                          {isClashing && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertTriangle className="size-4 text-amber-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Time slot clashes with:</p>
                                  <ul className="list-disc pl-4 text-xs mt-1">
                                    {clashes.map(c => <li key={c.id}>{c.code}</li>)}
                                  </ul>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{registration.course.units}</TableCell>
                      <TableCell className={!hasApprovedAllocation ? "text-muted-foreground italic" : ""}>
                        {lecturerName}
                      </TableCell>
                      <TableCell className={isClashing ? "text-amber-700 font-medium" : ""}>
                        {registration.course.timeSlot || '-'}
                      </TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
