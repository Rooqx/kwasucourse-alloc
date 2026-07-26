'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LecturersPage() {
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLecturers = () => {
    fetch('/api/lecturers')
      .then(r => r.json())
      .then(d => setLecturers(d.data || []))
      .catch(() => toast.error('Failed to load lecturers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => fetchLecturers(), []);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/lecturers/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      toast.success('Lecturer approved');
      fetchLecturers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Lecturers</h1>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Seniority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lecturers.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-4">No lecturers found.</TableCell></TableRow>}
              {lecturers.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>{l.email}</TableCell>
                  <TableCell>{l.lecturerProfile?.specialization || 'N/A'}</TableCell>
                  <TableCell>{l.lecturerProfile?.seniorityLevel || 'N/A'}</TableCell>
                  <TableCell>
                    {l.isApproved ? (
                      <Badge style={{ backgroundColor: 'var(--status-approved)' }}>Approved</Badge>
                    ) : (
                      <Badge style={{ backgroundColor: 'var(--status-draft)' }}>Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      
<Button variant="outline" size="sm">
                        <Link href={`/admin/lecturers/${l.id}`}>View</Link>
                      </Button>
                      {!l.isApproved && (
                        <Button size="sm" onClick={() => handleApprove(l.id)}>Approve</Button>
                      )}
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
