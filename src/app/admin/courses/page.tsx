'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  useEffect(() => {
    fetch('/api/departments').then(r => r.json()).then(d => setDepartments(d.data || []));
  }, []);

  const fetchCourses = () => {
    const params = new URLSearchParams();
    if (filterDept !== 'ALL') params.set('departmentId', filterDept);
    if (filterLevel !== 'ALL') params.set('level', filterLevel);
    
    fetch(`/api/courses?${params.toString()}`)
      .then(r => r.json())
      .then(d => setCourses(d.data || []))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => fetchCourses(), [filterDept, filterLevel]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      toast.success('Course deleted');
      fetchCourses();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Courses</h1>
        <div className="flex items-center gap-2">
          <select 
            className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select 
            className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
          >
            <option value="ALL">All Levels</option>
            {[100, 200, 300, 400, 500].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
          </select>
          <Button><Link href="/admin/courses/new">Add Course</Link></Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Cap</TableHead>
                <TableHead>Time Slot</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 && <TableRow><TableCell colSpan={10} className="text-center py-4">No courses found.</TableCell></TableRow>}
              {courses.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.code}</TableCell>
                  <TableCell>{c.title}</TableCell>
                  <TableCell>{c.units}</TableCell>
                  <TableCell>{c.level}</TableCell>
                  <TableCell>{c.semester}</TableCell>
                  <TableCell>{c.specializationTag}</TableCell>
                  <TableCell>{c.department?.code}</TableCell>
                  <TableCell>{c.capacity}</TableCell>
                  <TableCell>{c.timeSlot || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Link href={`/admin/courses/${c.id}/edit`}>Edit</Link>
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(c.id)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
