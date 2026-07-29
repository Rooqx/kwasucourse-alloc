'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ACTION_TYPES = [
  'ALL',
  'CREATE',
  'UPDATE',
  'DELETE',
  'ALLOCATION_DRAFT_GENERATED',
  'ALLOCATION_APPROVED'
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [actionFilter, setActionFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter !== 'ALL') params.set('action', actionFilter);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);

    fetch(`/api/audit-logs?${params.toString()}`)
      .then(r => r.json())
      .then(d => setLogs(d.data || []))
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
      </div>
      
      <Card>
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-end">
          <div className="space-y-1.5 flex-1">
            <label className="text-sm font-medium text-muted-foreground">Action Type</label>
            <Select value={actionFilter} onValueChange={(val) => { if (typeof val === 'string') setActionFilter(val); }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map(a => (
                  <SelectItem key={a} value={a}>{a.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 flex-1">
            <label className="text-sm font-medium text-muted-foreground">Date From</label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5 flex-1">
            <label className="text-sm font-medium text-muted-foreground">Date To</label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <Button variant="outline" onClick={() => {
            setActionFilter('ALL');
            setDateFrom('');
            setDateTo('');
          }}>Clear Filters</Button>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">Loading...</TableCell></TableRow>}
              {!loading && logs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-4">No audit logs found.</TableCell></TableRow>}
              {!loading && logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{log.actor?.fullName || log.actor?.name || 'System'}</TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{log.entityType}</TableCell>
                  <TableCell>{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
