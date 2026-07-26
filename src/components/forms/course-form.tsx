'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseSchema, CourseFormData } from '@/lib/validation/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CourseFormProps {
  initialData?: CourseFormData;
  onSubmit: (data: CourseFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CourseForm({ initialData, onSubmit, isLoading }: CourseFormProps) {
  const [departments, setDepartments] = useState<any[]>([]);

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema) as any,
    defaultValues: initialData || {
      code: '',
      title: '',
      units: 3,
      level: 100,
      semester: 'FIRST',
      departmentId: '',
      specializationTag: '',
      capacity: 50,
      timeSlot: '',
    },
  });

  useEffect(() => {
    fetch('/api/departments')
      .then(r => r.json())
      .then(d => setDepartments(d.data || []))
      .catch(() => toast.error('Failed to load departments'));
  }, []);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="code">Course Code</Label>
          <Input id="code" {...form.register('code')} />
          {form.formState.errors.code && <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Course Title</Label>
          <Input id="title" {...form.register('title')} />
          {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="units">Units</Label>
          <Input type="number" id="units" {...form.register('units')} />
        </div>
        <div className="space-y-2">
          <Label>Level</Label>
          <Select onValueChange={(v) => { if (v) form.setValue('level', parseInt(v)) }} defaultValue={form.getValues('level')?.toString() || "100"}>
            <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {[100, 200, 300, 400, 500].map(lvl => (
                  <SelectItem key={lvl} value={String(lvl)}>{lvl}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Semester</Label>
          <Select onValueChange={(v) => { if (v) form.setValue('semester', v as 'FIRST'|'SECOND') }} defaultValue={form.getValues('semester')}>
            <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="FIRST">First</SelectItem>
                <SelectItem value="SECOND">Second</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Department</Label>
          <Select onValueChange={(v) => { if (v) form.setValue('departmentId', v) }} defaultValue={form.getValues('departmentId') || undefined}>
            <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
        {isLoading ? 'Saving...' : 'Save Course'}
      </Button>
    </form>
  );
}
