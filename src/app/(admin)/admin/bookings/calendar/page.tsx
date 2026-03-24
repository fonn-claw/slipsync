import { db } from '@/db';
import { docks, slips } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getBookingsForDockInMonth } from '@/lib/dal/bookings';
import { BookingCalendar } from '@/components/booking/booking-calendar';

interface PageProps {
  searchParams: Promise<{ dockId?: string; year?: string; month?: string }>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;

  const allDocks = await db.query.docks.findMany({
    orderBy: (d, { asc }) => [asc(d.name)],
  });

  const dockId = params.dockId ? Number(params.dockId) : allDocks[0]?.id ?? 1;

  // Fetch slips and bookings for all docks (needed for dock tabs)
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

      const dockBookings = await getBookingsForDockInMonth(dock.id, year, month);
      bookingsByDock[dock.id] = dockBookings;
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Booking Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Visual overview of bookings across all docks
        </p>
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
