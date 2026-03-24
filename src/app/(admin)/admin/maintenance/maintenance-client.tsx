'use client';

import { useState, useTransition } from 'react';
import { updateMaintenanceStatus } from '@/app/actions/maintenance-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wrench, Anchor, User } from 'lucide-react';

const priorityColors: Record<string, string> = {
  low: 'bg-blue-500/15 text-blue-700 border-blue-500/25',
  medium: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/25',
  high: 'bg-orange-500/15 text-orange-700 border-orange-500/25',
  urgent: 'bg-red-500/15 text-red-700 border-red-500/25',
};

const statusColors: Record<string, string> = {
  open: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/25',
  in_progress: 'bg-blue-500/15 text-blue-700 border-blue-500/25',
  completed: 'bg-green-500/15 text-green-700 border-green-500/25',
  cancelled: 'bg-gray-500/15 text-gray-600 border-gray-500/25',
};

interface Props {
  requests: any[];
}

export function MaintenanceListClient({ requests }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (requestId: number, newStatus: string) => {
    startTransition(async () => {
      await updateMaintenanceStatus(
        requestId,
        newStatus as 'open' | 'in_progress' | 'completed' | 'cancelled',
      );
    });
  };

  const open = requests.filter((r) => r.status === 'open');
  const inProgress = requests.filter((r) => r.status === 'in_progress');
  const completed = requests.filter((r) => ['completed', 'cancelled'].includes(r.status));

  const renderRequest = (r: any) => (
    <Card key={r.id}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="font-medium">{r.title}</div>
            <div className="text-sm text-muted-foreground line-clamp-2">{r.description}</div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Anchor className="h-3 w-3" /> {r.slip?.number}</span>
              <span>&middot;</span>
              <span className="flex items-center gap-1"><User className="h-3 w-3" /> {r.reporter?.name}</span>
              <span>&middot;</span>
              <span>{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge variant="outline" className={priorityColors[r.priority]}>{r.priority}</Badge>
            <Select
              value={r.status}
              onValueChange={(v) => v && handleStatusChange(r.id, v)}
              disabled={isPending}
            >
              <SelectTrigger className="h-7 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {open.length > 0 && (
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-yellow-600">
            <Wrench className="h-4 w-4" /> Open ({open.length})
          </h2>
          <div className="space-y-2">{open.map(renderRequest)}</div>
        </div>
      )}

      {inProgress.length > 0 && (
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
            <Wrench className="h-4 w-4" /> In Progress ({inProgress.length})
          </h2>
          <div className="space-y-2">{inProgress.map(renderRequest)}</div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Wrench className="h-4 w-4" /> Resolved ({completed.length})
          </h2>
          <div className="space-y-2 opacity-60">{completed.map(renderRequest)}</div>
        </div>
      )}

      {requests.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <Wrench className="mx-auto mb-2 h-8 w-8 opacity-30" />
            No maintenance requests
          </CardContent>
        </Card>
      )}
    </div>
  );
}
