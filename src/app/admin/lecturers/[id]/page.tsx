'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

export default function LecturerDetailPage() {
  const params = useParams();
  const [lecturer, setLecturer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchLecturer = () => {
    fetch(`/api/lecturers/${params.id}`)
      .then(r => r.json())
      .then(d => setLecturer(d.data))
      .catch(() => toast.error('Failed to load lecturer'))
      .finally(() => setLoading(false));
  };

  useEffect(() => fetchLecturer(), [params.id]);

  const handleApprove = async () => {
    try {
      const res = await fetch(`/api/lecturers/${params.id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      toast.success('Lecturer approved');
      fetchLecturer();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!lecturer) return <div>Lecturer not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Lecturer Profile</h1>
        {!lecturer.isApproved && (
          <Button onClick={handleApprove}>Approve Lecturer</Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{lecturer.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{lecturer.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              {lecturer.isApproved ? (
                <Badge style={{ backgroundColor: 'var(--status-approved)' }}>Approved</Badge>
              ) : (
                <Badge style={{ backgroundColor: 'var(--status-draft)' }}>Pending</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {lecturer.lecturerProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Academic Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{lecturer.lecturerProfile.department?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Specialization</p>
                <p className="font-medium">{lecturer.lecturerProfile.specialization}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seniority Level</p>
                <p className="font-medium">{lecturer.lecturerProfile.seniorityLevel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Max Units</p>
                <p className="font-medium">{lecturer.lecturerProfile.maxUnits}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sabbatical Status</p>
                <p className="font-medium">{lecturer.lecturerProfile.isSabbatical ? 'On Sabbatical' : 'Active'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
