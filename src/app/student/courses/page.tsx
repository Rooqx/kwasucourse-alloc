'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Course {
  id: string;
  code: string;
  title: string;
  units: number;
  level: string;
  timeSlot?: string;
}

export default function StudentCoursesPage() {
  const { fetchWithAuth } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const res = await fetchWithAuth('/api/courses');
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

  const filteredCourses = courses.filter(c => levelFilter === 'ALL' || c.level === levelFilter);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin size-8 text-muted-foreground" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Available Courses</CardTitle>
            <CardDescription>Browse and register for courses.</CardDescription>
          </div>
          <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v || '')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by level" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL">All Levels</SelectItem>
                <SelectItem value="100">100 Level</SelectItem>
                <SelectItem value="200">200 Level</SelectItem>
                <SelectItem value="300">300 Level</SelectItem>
                <SelectItem value="400">400 Level</SelectItem>
                <SelectItem value="500">500 Level</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filteredCourses.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No courses found.</p>
          ) : (
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
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.code}</TableCell>
                    <TableCell>{course.title}</TableCell>
                    <TableCell>{course.units}</TableCell>
                    <TableCell>{course.level}L</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleRegister(course.id)}
                        disabled={registeringId === course.id}
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
