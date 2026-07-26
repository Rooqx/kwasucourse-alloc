'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Course {
  id: string;
  code: string;
  title: string;
  units: number;
  level: string;
}

interface Registration {
  id: string;
  courseId: string;
  course: Course;
}

export default function StudentRegisterPage() {
  const { fetchWithAuth } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [coursesRes, regRes] = await Promise.all([
        fetchWithAuth('/api/courses'),
        fetchWithAuth('/api/student/registrations')
      ]);
      
      const coursesData = await coursesRes.json();
      const regData = await regRes.json();
      
      if (coursesData.data) setCourses(coursesData.data);
      if (regData.data) setRegistrations(regData.data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (courseId: string) => {
    try {
      setActionId(courseId);
      const res = await fetchWithAuth('/api/student/registrations', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      toast.success('Successfully registered for course');
      fetchData(); // Refresh list
    } catch (error: any) {
      toast.error(error.message || 'Failed to register course');
    } finally {
      setActionId(null);
    }
  };

  const handleUnregister = async (regId: string) => {
    try {
      setActionId(regId);
      const res = await fetchWithAuth(`/api/student/registrations/${regId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      toast.success('Successfully unregistered from course');
      fetchData(); // Refresh list
    } catch (error: any) {
      toast.error(error.message || 'Failed to unregister course');
    } finally {
      setActionId(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin size-8 text-muted-foreground" /></div>;
  }

  const registeredCourseIds = new Set(registrations.map(r => r.courseId));
  const totalUnits = registrations.reduce((sum, r) => sum + r.course.units, 0);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Course Registration</CardTitle>
            <CardDescription>Add or drop courses for the current session.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-base px-3 py-1">
              Registered: {registrations.length}
            </Badge>
            <Badge variant="outline" className="text-base px-3 py-1">
              Total Units: {totalUnits}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => {
                const isRegistered = registeredCourseIds.has(course.id);
                const registration = registrations.find(r => r.courseId === course.id);
                
                return (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.code}</TableCell>
                    <TableCell>{course.title}</TableCell>
                    <TableCell>{course.units}</TableCell>
                    <TableCell>{course.level}L</TableCell>
                    <TableCell className="text-right">
                      {isRegistered && registration ? (
                        <Button 
                          variant="destructive"
                          size="sm" 
                          onClick={() => handleUnregister(registration.id)}
                          disabled={actionId === registration.id}
                        >
                          {actionId === registration.id ? (
                            <Loader2 className="size-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="size-4 mr-2" />
                          )}
                          Drop
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => handleRegister(course.id)}
                          disabled={actionId === course.id}
                        >
                          {actionId === course.id ? (
                            <Loader2 className="size-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="size-4 mr-2" />
                          )}
                          Add
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
