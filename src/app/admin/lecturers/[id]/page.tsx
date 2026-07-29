'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

export default function LecturerDetailPage() {
  const params = useParams();
  const [lecturer, setLecturer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ specialization: '', seniorityLevel: 1, maxUnits: 12 });

  const fetchLecturer = () => {
    fetch(`/api/lecturers/${params.id}`)
      .then(r => r.json())
      .then(d => {
        setLecturer(d.data);
        if (d.data?.lecturerProfile) {
          setEditForm({
            specialization: d.data.lecturerProfile.specialization || '',
            seniorityLevel: d.data.lecturerProfile.seniorityRank || 1,
            maxUnits: d.data.lecturerProfile.maxLoadUnits || 12
          });
        }
      })
      .catch(() => toast.error('Failed to load lecturer'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (params.id) fetchLecturer();
  }, [params.id]);

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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/lecturers/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      toast.success('Profile updated');
      setIsEditOpen(false);
      fetchLecturer();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!lecturer) return <div>Lecturer not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
              <p className="font-medium">{lecturer.fullName || lecturer.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{lecturer.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              {lecturer.isApproved ? (
                <Badge className="bg-[#256226] hover:bg-[#256226]/90 text-white border-transparent">Approved</Badge>
              ) : (
                <Badge className="bg-[#4A6FA5] hover:bg-[#4A6FA5]/90 text-white border-transparent">Pending</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {lecturer.lecturerProfile && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Academic Profile</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>Edit Profile</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{lecturer.department?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Specialization</p>
                  <p className="font-medium">{lecturer.lecturerProfile.specialization}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seniority Rank</p>
                  <p className="font-medium">{lecturer.lecturerProfile.seniorityRank}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Units</p>
                  <p className="font-medium">{lecturer.lecturerProfile.maxLoadUnits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allocation History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!lecturer.lecturerProfile.allocations || lecturer.lecturerProfile.allocations.length === 0) && (
                    <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No allocations found.</TableCell></TableRow>
                  )}
                  {lecturer.lecturerProfile.allocations?.map((alloc: any) => (
                    <TableRow key={alloc.id}>
                      <TableCell>{alloc.session?.label || 'N/A'}</TableCell>
                      <TableCell>{alloc.course?.code} - {alloc.course?.title}</TableCell>
                      <TableCell>{alloc.course?.units}</TableCell>
                      <TableCell>
                        {alloc.status === 'APPROVED' ? (
                          <Badge className="bg-[#256226] text-white">Approved</Badge>
                        ) : (
                          <Badge className="bg-[#4A6FA5] text-white">{alloc.status}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lecturer Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input id="specialization" value={editForm.specialization} onChange={e => setEditForm({ ...editForm, specialization: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seniorityLevel">Seniority Rank (1=lowest)</Label>
              <Input type="number" id="seniorityLevel" min="1" value={editForm.seniorityLevel} onChange={e => setEditForm({ ...editForm, seniorityLevel: parseInt(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUnits">Max Load Units</Label>
              <Input type="number" id="maxUnits" min="1" value={editForm.maxUnits} onChange={e => setEditForm({ ...editForm, maxUnits: parseInt(e.target.value) })} required />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
