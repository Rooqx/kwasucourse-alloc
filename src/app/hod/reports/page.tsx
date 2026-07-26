'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { Printer, Download } from 'lucide-react';

export default function ReportsPage() {
  const { fetchWithAuth } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      // In a real app, this would fetch PDF or CSV data
      const res = await fetchWithAuth('/api/reports/export');
      if (!res.ok) throw new Error('Failed to generate report');
      
      toast.success('Report generated successfully');
      
      // Open printable window with mock content
      const printWindow = window.open('', '_blank');
      if (printWindow) {
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
              <p>Session: 2023/2024</p>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
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
                  <tr><td>CSC101</td><td>Introduction to Computer Science</td><td>Dr. John Doe</td><td>APPROVED</td></tr>
                  <tr><td>CSC102</td><td>Introduction to Problem Solving</td><td>Dr. Jane Smith</td><td>APPROVED</td></tr>
                </tbody>
              </table>
              <script>window.print();</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error exporting report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">Generate and export official course allocation reports.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Master Allocation Report</CardTitle>
          <CardDescription>
            Comprehensive report containing all course allocations for the current academic session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col p-3 bg-muted rounded-md border">
              <span className="font-medium">Academic Session</span>
              <span>2023/2024</span>
            </div>
            <div className="flex flex-col p-3 bg-muted rounded-md border">
              <span className="font-medium">Semester</span>
              <span>Harmattan & Rain</span>
            </div>
            <div className="flex flex-col p-3 bg-muted rounded-md border">
              <span className="font-medium">Total Courses</span>
              <span>45</span>
            </div>
            <div className="flex flex-col p-3 bg-muted rounded-md border">
              <span className="font-medium">Total Lecturers</span>
              <span>18</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t p-6">
          <Button variant="outline" onClick={handleExportReport} disabled={isExporting}>
            <Download className="size-4 mr-2" />
            Download CSV
          </Button>
          <Button onClick={handleExportReport} disabled={isExporting}>
            <Printer className="size-4 mr-2" />
            Print Report
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
