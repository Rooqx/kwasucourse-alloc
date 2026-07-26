'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AllocationHistoryPage() {
  const [session, setSession] = useState('2022/2023');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Allocation History</h1>
          <p className="text-muted-foreground mt-1">View past course allocations across different academic sessions.</p>
        </div>
        <div className="w-[200px]">
          <Select value={session} onValueChange={(v) => setSession(v || '')}>
            <SelectTrigger>
              <SelectValue placeholder="Select Session" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="2022/2023">2022/2023</SelectItem>
                <SelectItem value="2021/2022">2021/2022</SelectItem>
                <SelectItem value="2020/2021">2020/2021</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session: {session}</CardTitle>
          <CardDescription>Historical course allocation records.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Course Title</TableHead>
                  <TableHead>Lecturer</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Semester</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Mock historical data for display */}
                <TableRow>
                  <TableCell className="font-medium">CSC101</TableCell>
                  <TableCell>Introduction to Computer Science</TableCell>
                  <TableCell>Dr. John Doe</TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>Harmattan</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">CSC102</TableCell>
                  <TableCell>Introduction to Problem Solving</TableCell>
                  <TableCell>Dr. Jane Smith</TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>Rain</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">CSC201</TableCell>
                  <TableCell>Computer Programming I</TableCell>
                  <TableCell>Prof. Alan Turing</TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>Harmattan</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
