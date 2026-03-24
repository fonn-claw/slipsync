'use client';

import { useState, useTransition } from 'react';
import { createMaintenanceRequest } from '@/app/actions/maintenance-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface Props {
  occupiedSlips: { id: number; number: string; dockName: string }[];
}

export function BoaterMaintenanceClient({ occupiedSlips }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [slipId, setSlipId] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createMaintenanceRequest({
        slipId: Number(slipId),
        title: form.get('title') as string,
        description: form.get('description') as string,
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
      });

      if (result.success) {
        setShowForm(false);
        setSlipId('');
      } else {
        setError(result.error || 'Failed to submit request');
      }
    });
  };

  if (occupiedSlips.length === 0 && !showForm) {
    return (
      <Card>
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          You can submit maintenance requests for slips where you are currently checked in.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'default'}>
        <Plus className="mr-2 h-4 w-4" />
        {showForm ? 'Cancel' : 'New Maintenance Request'}
      </Button>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Slip</Label>
                  <Select value={slipId} onValueChange={(v) => setSlipId(v ?? '')}>
                    <SelectTrigger><SelectValue placeholder="Select slip..." /></SelectTrigger>
                    <SelectContent>
                      {occupiedSlips.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.number} ({s.dockName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v ?? 'medium')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="Brief description of the issue" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="Detailed description of the maintenance issue..."
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={isPending || !slipId}>
                {isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
