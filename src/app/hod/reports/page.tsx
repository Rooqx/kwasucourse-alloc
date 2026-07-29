'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { Printer, Download, Loader2 } from 'lucide-react';

export default function ReportsPage() {
  const { fetchWithAuth } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetchWithAuth('/api/sessions');
        const data = await res.json();
        if (data.data) {
          setSessions(data.data);
          const defaultSession = data.data.find((s: any) => s.isActive) || data.data[0];
          if (defaultSession) {
            setSelectedSessionId(defaultSession.id);
          }
        }
      } catch (error) {
        toast.error('Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [fetchWithAuth]);

  useEffect(() => {
    if (!selectedSessionId) return;
    
    const fetchReportData = async () => {
      try {
        const res = await fetchWithAuth(`/api/reports/export?sessionId=${selectedSessionId}`);
        const data = await res.json();
        if (data.data) {
          setReportData(data.data);
        }
      } catch (error) {
        toast.error('Failed to load report data');
      }
    };
    fetchReportData();
  }, [selectedSessionId, fetchWithAuth]);

  const handleExportReport = async (format: 'pdf' | 'csv') => {
    if (!reportData) return;
    setIsExporting(true);
    try {
      if (format === 'pdf') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const rows = reportData.allocations.map((a: any) => `
            <tr>
              <td>${a.course.code}</td>
              <td>${a.course.title}</td>
              <td>${a.lecturer.user.fullName}</td>
              <td>${a.status}</td>
            </tr>
          `).join('');

          printWindow.document.write(`
            <html>
              <head>
                <title>Course Allocation Report</title>
                <style>
                  body { font-family: sans-serif; padding: 2rem; color: #171913; }
                  h1 { color: #2E7830; }
                  table { width: 100%; border-collapse: collapse; margin-top: 2rem; }
                  th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; }
                  th { background-color: #F7F8F5; }
                </style>
              </head>
              <body>
                <h1>KWASU Course Allocation Report</h1>
                <p>Session: ${reportData.session.label} - ${reportData.session.semester}</p>
                <p>Generated on: ${new Date(reportData.generatedAt).toLocaleString()}</p>
                <table>
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Title</th>
                      <th>Lecturer</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows}
                  </tbody>
                </table>
                <script>window.print();</script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      } else if (format === 'csv') {
        // Simple CSV generation
        const headers = 'Course Code,Course Title,Lecturer,Status\n';
        const rows = reportData.allocations.map((a: any) => `"${a.course.code}","${a.course.title}","${a.lecturer.user.fullName}","${a.status}"`).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `allocations-${reportData.session.label.replace('/', '-')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success('Report generated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error exporting report');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedSessionLabel = sessions.find(s => s.id === selectedSessionId)?.label || '';
  const uniqueLecturers = new Set(reportData?.allocations.map((a: any) => a.lecturerId)).size;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">Generate and export official course allocation reports.</p>
        </div>
        <div className="w-[250px]">
          {loading ? (
            <div className="h-10 border rounded-md flex items-center justify-center bg-muted">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Select value={selectedSessionId} onValueChange={(v) => setSelectedSessionId(v || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select Session" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {sessions.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.label} - {s.semester}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Master Allocation Report</CardTitle>
          <CardDescription>
            Comprehensive report containing all APPROVED course allocations for {selectedSessionLabel}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col p-3 bg-muted rounded-md border">
              <span className="font-medium">Academic Session</span>
              <span>{reportData?.session?.label || '--'}</span>
            </div>
            <div className="flex flex-col p-3 bg-muted rounded-md border">
              <span className="font-medium">Semester</span>
              <span>{reportData?.session?.semester || '--'}</span>
            </div>
            <div className="flex flex-col p-3 bg-muted rounded-md border">
              <span className="font-medium">Total Courses</span>
              <span>{reportData?.allocations?.length || 0}</span>
            </div>
            <div className="flex flex-col p-3 bg-muted rounded-md border">
              <span className="font-medium">Total Lecturers Assigned</span>
              <span>{uniqueLecturers || 0}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t p-6">
          <Button variant="outline" onClick={() => handleExportReport('csv')} disabled={isExporting || !reportData || reportData.allocations.length === 0}>
            <Download className="size-4 mr-2" />
            Download CSV
          </Button>
          <Button onClick={() => handleExportReport('pdf')} disabled={isExporting || !reportData || reportData.allocations.length === 0}>
            <Printer className="size-4 mr-2" />
            Print PDF
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
