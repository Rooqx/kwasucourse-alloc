'use client';

import { CourseForm } from '@/components/forms/course-form';
import { CourseFormData } from '@/lib/validation/course';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function NewCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: CourseFormData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      toast.success('Course created');
      router.push('/admin/courses');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">New Course</h1>
      <CourseForm onSubmit={onSubmit} isLoading={loading} />
    </div>
  );
}
