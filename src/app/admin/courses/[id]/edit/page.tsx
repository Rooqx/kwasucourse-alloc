'use client';

import { useEffect, useState } from 'react';
import { CourseForm } from '@/components/forms/course-form';
import { CourseFormData } from '@/lib/validation/course';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<CourseFormData | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${params.id}`)
      .then(r => r.json())
      .then(d => setInitialData(d.data))
      .catch(() => toast.error('Failed to load course'));
  }, [params.id]);

  const onSubmit = async (data: CourseFormData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      toast.success('Course updated');
      router.push('/admin/courses');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!initialData) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Edit Course</h1>
      <CourseForm initialData={initialData} onSubmit={onSubmit} isLoading={loading} />
    </div>
  );
}
