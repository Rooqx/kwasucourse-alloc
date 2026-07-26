'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [weights, setWeights] = useState({ w1: 0, w2: 0, w3: 0, w4: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setWeights({
            w1: d.data.allocationWeightSpecialization,
            w2: d.data.allocationWeightSeniority,
            w3: d.data.allocationWeightWorkload,
            w4: d.data.allocationWeightHistory
          });
        }
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const sum = weights.w1 + weights.w2 + weights.w3 + weights.w4;
    if (Math.abs(sum - 1.0) > 0.001) {
      toast.error(`Weights must sum to 1.0 (current sum: ${sum})`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weights)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      toast.success('Settings updated');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">System Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Algorithm Weights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Specialization Weight (w1)</Label>
              <Input type="number" step="0.1" value={weights.w1} onChange={e => setWeights({...weights, w1: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Seniority Weight (w2)</Label>
              <Input type="number" step="0.1" value={weights.w2} onChange={e => setWeights({...weights, w2: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Workload Weight (w3)</Label>
              <Input type="number" step="0.1" value={weights.w3} onChange={e => setWeights({...weights, w3: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>History Weight (w4)</Label>
              <Input type="number" step="0.1" value={weights.w4} onChange={e => setWeights({...weights, w4: parseFloat(e.target.value)})} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
