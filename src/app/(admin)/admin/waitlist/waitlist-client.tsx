'use client';

import { useTransition } from 'react';
import { removeFromWaitlist, updateWaitlistStatus } from '@/app/actions/waitlist-actions';
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
import { ListOrdered, Ship, User, Trash2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  waiting: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/25',
  offered: 'bg-blue-500/15 text-blue-700 border-blue-500/25',
  accepted: 'bg-green-500/15 text-green-700 border-green-500/25',
  expired: 'bg-gray-500/15 text-gray-600 border-gray-500/25',
};

interface Props {
  entries: any[];
}

export function WaitlistClient({ entries }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (id: number, status: string) => {
    startTransition(async () => {
      await updateWaitlistStatus(id, status as any);
    });
  };

  const handleRemove = (id: number) => {
    startTransition(async () => {
      await removeFromWaitlist(id);
    });
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ListOrdered className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">No waitlist entries</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((e) => (
        <Card key={e.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {e.boater?.name ?? 'Unknown'}
                  <span className="text-muted-foreground">{e.boater?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Ship className="h-3 w-3" />
                  {e.vessel?.name} ({e.vessel?.type}) &mdash; {e.vessel?.loa}&apos; LOA
                  {e.preferredDock && <span>&middot; Preferred: Dock {e.preferredDock}</span>}
                </div>
                {(e.requestedStart || e.requestedEnd) && (
                  <div className="text-xs text-muted-foreground">
                    Requested: {e.requestedStart} &ndash; {e.requestedEnd}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Added: {new Date(e.createdAt).toLocaleDateString()} &middot; Priority: {e.priority}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Select
                  value={e.status}
                  onValueChange={(v) => v && handleStatusChange(e.id, v)}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="offered">Offered</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(e.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
