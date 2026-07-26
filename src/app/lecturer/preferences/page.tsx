'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fetchWithAuth } from '@/lib/api/fetch';
import { preferenceSchema, PreferenceInput } from '@/lib/validation/preference';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Save } from 'lucide-react';

interface Course {
  id: string;
  code: string;
  title: string;
  units: number;
  level: number;
  specializationTag?: string | null;
}

interface LecturerProfile {
  id: string;
  specialization?: string | null;
}

export default function LecturerPreferencesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [profile, setProfile] = useState<LecturerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<PreferenceInput>({
    resolver: zodResolver(preferenceSchema) as any,
    defaultValues: { preferences: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'preferences',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const authData = localStorage.getItem('auth_user');
        const user = authData ? JSON.parse(authData) : null;
        
        const [coursesReq, prefsReq, profileReq] = await Promise.all([
          fetchWithAuth('/api/courses'),
          fetchWithAuth('/api/preferences'),
          user ? fetchWithAuth(`/api/users/${user.id}`) : Promise.resolve({ json: () => ({ data: null }) } as any)
        ]);

        const coursesRes = await coursesReq.json();
        const prefsRes = await prefsReq.json();
        const profileRes = await profileReq.json();

        if (coursesRes.data) setCourses(coursesRes.data);
        if (profileRes.data?.lecturerProfile) setProfile(profileRes.data.lecturerProfile);

        if (prefsRes.data && prefsRes.data.length > 0) {
          reset({
            preferences: prefsRes.data.map((p: any) => ({
              courseId: p.courseId,
              rank: p.rank,
            })),
          });
        }
      } catch (error) {
        toast.error('Failed to load data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [reset]);

  const onSubmit = async (data: PreferenceInput) => {
    try {
      const res = await fetchWithAuth('/api/preferences', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const resJson = await res.json();
      if (resJson.error) {
        toast.error(resJson.error.message || 'Failed to save preferences');
      } else {
        toast.success('Preferences saved successfully');
        reset({ preferences: resJson.data.map((p: any) => ({ courseId: p.courseId, rank: p.rank })) });
      }
    } catch (error) {
      toast.error('An error occurred while saving');
    }
  };

  const isMatchedSpecialization = (courseTag?: string | null) => {
    if (!courseTag || !profile?.specialization) return false;
    return profile.specialization.toLowerCase().includes(courseTag.toLowerCase()) || 
           courseTag.toLowerCase().includes(profile.specialization.toLowerCase());
  };

  if (loading) {
    return <div className="p-6">Loading preferences...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Course Preferences</h1>
        <p className="text-muted-foreground mt-2">Rank the courses you would like to teach for the current session.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Available Courses</CardTitle>
            <CardDescription>Select courses to add to your preferences</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 max-h-[600px] overflow-y-auto">
            {courses.map((course) => {
              const isSelected = fields.some(f => f.courseId === course.id);
              const matched = isMatchedSpecialization(course.specializationTag);
              
              return (
                <div key={course.id} className={cn("flex flex-col gap-2 p-4 border rounded-lg", isSelected ? "opacity-50" : "bg-card")}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{course.code}</h4>
                      <p className="text-sm text-muted-foreground">{course.title}</p>
                    </div>
                    {matched && <Badge className="bg-primary text-primary-foreground">Match</Badge>}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">Level {course.level} • {course.units} Units</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={isSelected}
                      onClick={() => append({ courseId: course.id, rank: fields.length + 1 })}
                    >
                      {isSelected ? 'Added' : 'Add to Preferences'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Ranked Preferences</CardTitle>
            <CardDescription>Drag or manually edit ranks (1 = highest preference)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No preferences added yet.
                </div>
              ) : (
                fields.map((field, index) => {
                  const course = courses.find(c => c.id === field.courseId);
                  if (!course) return null;
                  
                  const matched = isMatchedSpecialization(course.specializationTag);

                  return (
                    <div key={field.id} className="flex items-center gap-4 p-3 border rounded-lg bg-card">
                      <div className="w-16">
                        <Input
                          type="number"
                          min={1}
                          {...register(`preferences.${index}.rank` as const)}
                          className="text-center"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{course.code}</span>
                          {matched && <span className="size-2 rounded-full bg-primary" title="Matches your specialization" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate" title={course.title}>
                          {course.title}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => remove(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })
              )}

              {errors.preferences?.root && (
                <p className="text-sm text-destructive">{errors.preferences.root.message}</p>
              )}

              <Button type="submit" disabled={isSubmitting || fields.length === 0} className="mt-4">
                <Save className="mr-2" data-icon />
                Save Preferences
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
