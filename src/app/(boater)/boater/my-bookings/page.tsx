import { db } from '@/db';
import { bookings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Anchor, Ship, CalendarDays, QrCode } from 'lucide-react';

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/25',
  confirmed: 'bg-blue-500/15 text-blue-700 border-blue-500/25',
  checked_in: 'bg-green-500/15 text-green-700 border-green-500/25',
  checked_out: 'bg-gray-500/15 text-gray-600 border-gray-500/25',
  cancelled: 'bg-red-500/15 text-red-700 border-red-500/25',
};

export default async function MyBookingsPage() {
  const session = await getSession();

  const myBookings = await db.query.bookings.findMany({
    where: eq(bookings.boaterId, session.userId),
    with: {
      slip: { with: { dock: true } },
      vessel: true,
    },
    orderBy: [desc(bookings.startDate)],
  });

  const active = myBookings.filter((b) => ['pending', 'confirmed', 'checked_in'].includes(b.status));
  const past = myBookings.filter((b) => ['checked_out', 'cancelled'].includes(b.status));

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Bookings</h1>
        <p className="mt-1 text-muted-foreground">View and manage your marina reservations</p>
      </div>

      {/* Active Bookings */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Active Reservations ({active.length})</h2>
        {active.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              <Calendar className="mx-auto mb-2 h-8 w-8 opacity-30" />
              No active reservations
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Anchor className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Slip {b.slip?.number}</span>
                        <span className="text-sm text-muted-foreground">{b.slip?.dock?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Ship className="h-3.5 w-3.5 text-muted-foreground" />
                        {b.vessel?.name} ({b.vessel?.type})
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(b.startDate)} &ndash; {formatDate(b.endDate)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={statusStyles[b.status]}>
                        {b.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="secondary" className="text-xs capitalize">{b.type}</Badge>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">
                      ${b.totalPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    {b.checkInCode && b.status === 'confirmed' && (
                      <div className="flex flex-col items-center gap-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/qr?code=${encodeURIComponent(b.checkInCode)}`}
                          alt="Check-in QR Code"
                          width={80}
                          height={80}
                          className="rounded border"
                        />
                        <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                          <QrCode className="h-3 w-3" />
                          {b.checkInCode}
                        </span>
                      </div>
                    )}
                    {b.checkedInAt && b.status === 'checked_in' && (
                      <span className="text-xs text-green-600">
                        Checked in {new Date(b.checkedInAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Bookings */}
      {past.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-muted-foreground">Past Reservations ({past.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {past.map((b) => (
              <Card key={b.id} className="opacity-70">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Anchor className="h-3.5 w-3.5 text-muted-foreground" />
                        Slip {b.slip?.number} &middot; {b.vessel?.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(b.startDate)} &ndash; {formatDate(b.endDate)}
                      </div>
                    </div>
                    <Badge variant="outline" className={statusStyles[b.status]}>
                      {b.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
