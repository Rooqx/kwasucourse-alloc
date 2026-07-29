'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Allocation {
  id: string;
  lecturer: { user: { fullName: string } };
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
  courseId: string;
  course: Course;
}

export default function StudentRegisterPage() {
  const { user, fetchWithAuth } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  // Clash Dialog state
  const [clashDialogOpen, setClashDialogOpen] = useState(false);
  const [clashingCourse, setClashingCourse] = useState<Course | null>(null);
  const [clashDetails, setClashDetails] = useState<string>('');

  useEffect(() => {
    if (user?.level) {
      fetchData(user.level.toString());
    } else {
      setIsLoading(false);
    }
  }, [user?.level]);

  const fetchData = async (level: string) => {
    try {
      setIsLoading(true);
      
      const sessRes = await fetchWithAuth('/api/sessions');
      const sessData = await sessRes.json();
      const activeSession = (sessData.data || []).find((s: any) => s.isActive);
      
      if (!activeSession) {
        toast.error('No active academic session found');
        return;
      }

      const [coursesRes, regRes] = await Promise.all([
        fetchWithAuth(`/api/courses?sessionId=${activeSession.id}&level=${level}`),
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

  const checkForClash = (newCourse: Course) => {
    if (!newCourse.timeSlot) return null;
    
    // Basic day match or overlap checking (for string mock data e.g. "Mon 10:00-12:00")
    // If we simply do a naive string inclusion check or exact match
    const newDay = newCourse.timeSlot.split(' ')[0]; // Extract "Mon"
    
    for (const reg of registrations) {
      if (reg.course.timeSlot) {
        // If exact time slots match or share the same day and have string overlap
        if (reg.course.timeSlot === newCourse.timeSlot || 
           (newDay && reg.course.timeSlot.startsWith(newDay))) {
          return reg.course;
        }
      }
    }
    return null;
  };

  const handleRegisterClick = (course: Course) => {
    const clashing = checkForClash(course);
    if (clashing) {
      setClashingCourse(course);
      setClashDetails(`This course overlaps with ${clashing.code} (${clashing.timeSlot}).`);
      setClashDialogOpen(true);
    } else {
      submitRegistration(course.id);
    }
  };

  const submitRegistration = async (courseId: string) => {
    try {
      setClashDialogOpen(false);
      setActionId(courseId);
      const res = await fetchWithAuth('/api/student/registrations', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      toast.success('Successfully registered for course');
      if (user?.level) fetchData(user.level.toString()); // Refresh list
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
      if (user?.level) fetchData(user.level.toString()); // Refresh list
    } catch (error: any) {
      toast.error(error.message || 'Failed to unregister course');
    } finally {
      setActionId(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin size-8 text-muted-foreground" /></div>;
  }

  if (!user?.level) {
    return <div className="p-8 text-center text-muted-foreground">Your student level is not set. Please contact an admin.</div>;
  }

  const registeredCourseIds = new Set(registrations.map(r => r.courseId));
  const totalUnits = registrations.reduce((sum, r) => sum + r.course.units, 0);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Course Registration</CardTitle>
            <CardDescription>Add or drop courses for your level.</CardDescription>
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
                <TableHead>Lecturer</TableHead>
                <TableHead>Time Slot</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => {
                const isRegistered = registeredCourseIds.has(course.id);
                const registration = registrations.find(r => r.courseId === course.id);
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
                    <TableCell>{course.timeSlot || '-'}</TableCell>
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
                          variant={hasApprovedAllocation ? "default" : "secondary"}
                          onClick={() => handleRegisterClick(course)}
                          disabled={!hasApprovedAllocation || actionId === course.id}
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
              {courses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No courses found matching your level.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={clashDialogOpen} onOpenChange={setClashDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="size-5" />
              Time Slot Clash Detected
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              {clashDetails}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You are allowed to register despite the clash, but please consult your department advisor. Do you want to proceed?
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setClashDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => clashingCourse && submitRegistration(clashingCourse.id)}>
              Register Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
