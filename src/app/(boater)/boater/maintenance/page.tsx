import { db } from '@/db';
import { maintenanceRequests, bookings, slips } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, Anchor } from 'lucide-react';
import { BoaterMaintenanceClient } from './maintenance-client';

const priorityColors: Record<string, string> = {
  low: 'bg-blue-500/15 text-blue-700',
  medium: 'bg-yellow-500/15 text-yellow-700',
  high: 'bg-orange-500/15 text-orange-700',
  urgent: 'bg-red-500/15 text-red-700',
};

const statusColors: Record<string, string> = {
  open: 'bg-yellow-500/15 text-yellow-700',
  in_progress: 'bg-blue-500/15 text-blue-700',
  completed: 'bg-green-500/15 text-green-700',
  cancelled: 'bg-gray-500/15 text-gray-600',
};

export default async function BoaterMaintenancePage() {
  const session = await getSession();

  // Get boater's currently occupied slips
  const myActiveBookings = await db.query.bookings.findMany({
    where: and(
      eq(bookings.boaterId, session.userId),
      eq(bookings.status, 'checked_in'),
    ),
    with: { slip: { with: { dock: true } } },
  });

  const mySlipIds = myActiveBookings.map((b) => b.slipId);

  // Get boater's maintenance requests
  const myRequests = await db.query.maintenanceRequests.findMany({
    where: eq(maintenanceRequests.reportedBy, session.userId),
    with: { slip: { with: { dock: true } } },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });

  const occupiedSlips = myActiveBookings.map((b) => ({
    id: b.slipId,
    number: b.slip.number,
    dockName: b.slip.dock.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Maintenance</h1>
        <p className="mt-1 text-muted-foreground">Submit and track maintenance requests</p>
      </div>

      <BoaterMaintenanceClient occupiedSlips={occupiedSlips} />

      <div>
        <h2 className="mb-3 text-lg font-semibold">My Requests ({myRequests.length})</h2>
        {myRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              <Wrench className="mx-auto mb-2 h-8 w-8 opacity-30" />
              No maintenance requests submitted
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myRequests.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{r.title}</div>
                      <div className="text-sm text-muted-foreground">{r.description}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Anchor className="h-3 w-3" />
                        Slip {r.slip?.number} &middot; {r.slip?.dock?.name}
                        <span>&middot; {new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={statusColors[r.status]}>{r.status.replace('_', ' ')}</Badge>
                      <Badge variant="outline" className={priorityColors[r.priority]}>{r.priority}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
