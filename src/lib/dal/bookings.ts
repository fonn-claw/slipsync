import { db } from '@/db';
import { bookings, slips, vessels, users, docks } from '@/db/schema';
import { eq, and, not, inArray, lt, gt, sql, desc } from 'drizzle-orm';
import { canTransition, slipStatusForBooking, datesOverlap } from '@/lib/domain/booking-rules';
import { format } from 'date-fns';

// ── Types ─────────────────────────────────────────────────────────────────
type BookingInsert = {
  slipId: number;
  vesselId: number;
  boaterId: number;
  type: 'transient' | 'seasonal';
  startDate: string;
  endDate: string;
  totalPrice: number;
  notes?: string;
};

// ── Booking Creation ─────────────────────────────────────────────────────
export async function createBookingTransaction(data: BookingInsert) {
  // Check for overlapping active bookings on the same slip
  const conflicts = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.slipId, data.slipId),
        not(inArray(bookings.status, ['cancelled', 'checked_out'])),
        lt(bookings.startDate, data.endDate),
        gt(bookings.endDate, data.startDate),
      ),
    );

  if (conflicts.length > 0) {
    return { success: false as const, conflicts };
  }

  const now = new Date().toISOString();
  const [result] = await db
    .insert(bookings)
    .values({
      ...data,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return { success: true as const, booking: result };
}

// ── Status Update ────────────────────────────────────────────────────────
type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
type SlipStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export async function updateBookingStatusTransaction(bookingId: number, newStatus: string) {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) {
    return { success: false as const, error: 'Booking not found' };
  }

  if (!canTransition(booking.status, newStatus)) {
    return {
      success: false as const,
      error: `Cannot transition from '${booking.status}' to '${newStatus}'`,
    };
  }

  const now = new Date().toISOString();
  const [updated] = await db
    .update(bookings)
    .set({ status: newStatus as BookingStatus, updatedAt: now })
    .where(eq(bookings.id, bookingId))
    .returning();

  // Auto-sync slip status
  const newSlipStatus = slipStatusForBooking(newStatus);
  if (newSlipStatus) {
    await db.update(slips)
      .set({ status: newSlipStatus as SlipStatus })
      .where(eq(slips.id, booking.slipId));
  }

  return { success: true as const, booking: updated };
}

// ── Query Functions ───────────────────────────────────────────────────────
export async function getBookingById(id: number) {
  return db.query.bookings.findFirst({
    where: eq(bookings.id, id),
    with: {
      slip: { with: { dock: true } },
      vessel: true,
      boater: true,
    },
  });
}

export async function getAllBookings() {
  return db.query.bookings.findMany({
    with: {
      slip: { with: { dock: true } },
      vessel: true,
      boater: true,
    },
    orderBy: [desc(bookings.startDate)],
  });
}

export async function getBookingsForSlipInRange(slipId: number, startDate: string, endDate: string) {
  return db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.slipId, slipId),
        not(inArray(bookings.status, ['cancelled', 'checked_out'])),
        lt(bookings.startDate, endDate),
        gt(bookings.endDate, startDate),
      ),
    );
}

export async function getBookingsForDockInMonth(dockId: number, year: number, month: number) {
  // month is 1-indexed
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  // Get slips for this dock
  const dockSlips = await db.query.slips.findMany({
    where: eq(slips.dockId, dockId),
  });

  if (dockSlips.length === 0) return [];

  const slipIds = dockSlips.map((s) => s.id);

  return db.query.bookings.findMany({
    where: and(
      inArray(bookings.slipId, slipIds),
      not(eq(bookings.status, 'cancelled')),
      lt(bookings.startDate, monthEnd),
      gt(bookings.endDate, monthStart),
    ),
    with: {
      slip: { with: { dock: true } },
      vessel: true,
      boater: true,
    },
  });
}

export async function getTodayArrivals() {
  const today = format(new Date(), 'yyyy-MM-dd');
  return db.query.bookings.findMany({
    where: and(
      eq(bookings.startDate, today),
      eq(bookings.status, 'confirmed'),
    ),
    with: {
      slip: { with: { dock: true } },
      vessel: true,
      boater: true,
    },
  });
}

export async function getTodayDepartures() {
  const today = format(new Date(), 'yyyy-MM-dd');
  return db.query.bookings.findMany({
    where: and(
      eq(bookings.endDate, today),
      eq(bookings.status, 'checked_in'),
    ),
    with: {
      slip: { with: { dock: true } },
      vessel: true,
      boater: true,
    },
  });
}

export async function getUpcomingArrivalsAndDepartures(days: number = 7) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const futureDate = format(new Date(Date.now() + days * 86400000), 'yyyy-MM-dd');

  const arrivals = await db.query.bookings.findMany({
    where: and(
      gt(bookings.startDate, today),
      lt(bookings.startDate, futureDate),
      eq(bookings.status, 'confirmed'),
    ),
    with: {
      slip: { with: { dock: true } },
      vessel: true,
      boater: true,
    },
  });

  const departures = await db.query.bookings.findMany({
    where: and(
      gt(bookings.endDate, today),
      lt(bookings.endDate, futureDate),
      eq(bookings.status, 'checked_in'),
    ),
    with: {
      slip: { with: { dock: true } },
      vessel: true,
      boater: true,
    },
  });

  return { arrivals, departures };
}
