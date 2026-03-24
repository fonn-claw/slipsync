import { db } from '@/db';
import { getBookingsForDockInMonth } from '@/lib/dal/bookings';
import { slips, docks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BookingCalendar } from '@/components/booking/booking-calendar';

export default async function SchedulePage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const allDocks = await db.query.docks.findMany({
    orderBy: (d, { asc }) => [asc(d.name)],
  });

  const dockId = allDocks[0]?.id ?? 1;

  const slipsByDock: Record<number, any[]> = {};
  const bookingsByDock: Record<number, any[]> = {};

  await Promise.all(
    allDocks.map(async (dock) => {
      const dockSlips = await db.query.slips.findMany({
        where: eq(slips.dockId, dock.id),
        orderBy: (s, { asc }) => [asc(s.number)],
      });
      slipsByDock[dock.id] = dockSlips.map((s) => ({
        id: s.id,
        number: s.number,
        dockId: s.dockId,
      }));
      bookingsByDock[dock.id] = await getBookingsForDockInMonth(dock.id, year, month);
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Schedule</h1>
        <p className="text-sm text-muted-foreground">Booking overview across all docks</p>
      </div>
      <BookingCalendar
        docks={allDocks}
        slipsByDock={slipsByDock}
        bookingsByDock={bookingsByDock}
        initialDockId={dockId}
        initialYear={year}
        initialMonth={month}
      />
    </div>
  );
}
