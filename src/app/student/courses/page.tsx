'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';

interface Allocation {
  id: string;
  lecturer: {
    user: {
      fullName: string;
    };
  };
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

export default function StudentCoursesPage() {
  const { user, fetchWithAuth } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.level) {
      fetchCourses(user.level.toString());
    } else {
      setIsLoading(false);
    }
  }, [user?.level]);

  const fetchCourses = async (level: string) => {
    try {
      setIsLoading(true);
      
      const sessRes = await fetchWithAuth('/api/sessions');
      const sessData = await sessRes.json();
      const activeSession = (sessData.data || []).find((s: any) => s.isActive);
      
      if (!activeSession) {
        toast.error('No active academic session found');
        return;
      }

      const res = await fetchWithAuth(`/api/courses?sessionId=${activeSession.id}&level=${level}`);
      const data = await res.json();
      if (data.data) {
        setCourses(data.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (courseId: string) => {
    try {
      setRegisteringId(courseId);
      const res = await fetchWithAuth('/api/student/registrations', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      toast.success('Successfully registered for course');
    } catch (error: any) {
      toast.error(error.message || 'Failed to register course');
    } finally {
      setRegisteringId(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin size-8 text-muted-foreground" /></div>;
  }

  if (!user?.level) {
    return <div className="p-8 text-center text-muted-foreground">Your student level is not set. Please contact an admin.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Available Courses</CardTitle>
          <CardDescription>Browse and register for courses for your level.</CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No courses found matching your level and the active semester.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Lecturer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => {
                  const hasApprovedAllocation = course.allocations && course.allocations.length > 0;
                  const lecturerName = hasApprovedAllocation ? course.allocations![0].lecturer.user.fullName : 'Lecturer TBA';

                  return (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.code}</TableCell>
                      <TableCell>{course.title}</TableCell>
                      <TableCell>{course.units}</TableCell>
                      <TableCell className={!hasApprovedAllocation ? "text-muted-foreground italic" : ""}>
                        {lecturerName}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleRegister(course.id)}
                          disabled={!hasApprovedAllocation || registeringId === course.id}
                          variant={hasApprovedAllocation ? "default" : "secondary"}
                        >
                          {registeringId === course.id ? (
                            <Loader2 className="size-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="size-4 mr-2" />
                          )}
                          Register
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
