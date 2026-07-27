'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingDep, setEditingDep] = useState<any>(null);
  const [formData, setFormData] = useState({ code: '', name: '' });

  const fetchDeps = () => {
    fetch('/api/departments')
      .then(r => r.json())
      .then(d => setDepartments(d.data || []))
      .catch(() => toast.error('Failed to load departments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => fetchDeps(), []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      toast.success('Department deleted');
      fetchDeps();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingDep ? `/api/departments/${editingDep.id}` : '/api/departments';
      const method = editingDep ? 'PUT' : 'POST';
      const res = await fetch(url, { 
        method, 
        body: JSON.stringify(formData), 
        headers: { 'Content-Type': 'application/json' } 
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'Validation failed');
      toast.success(editingDep ? 'Department updated' : 'Department added');
      setIsOpen(false);
      fetchDeps();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openDialog = (dep?: any) => {
    if (dep) {
      setEditingDep(dep);
      setFormData({ code: dep.code, name: dep.name });
    } else {
      setEditingDep(null);
      setFormData({ code: '', name: '' });
    }
    setIsOpen(true);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Departments</h1>
        <Button onClick={() => openDialog()}>Add Department</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-4">No departments found.</TableCell></TableRow>}
              {departments.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.code}</TableCell>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>{d._count?.users || 0}</TableCell>
                  <TableCell>{d._count?.courses || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openDialog(d)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(d.id)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDep ? 'Edit Department' : 'Add Department'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Department Code</Label>
              <Input id="code" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Department Name</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit">{editingDep ? 'Save Changes' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
