import { db } from '@/db';
import { bookings, slips, docks, vessels, users, waitlist, maintenanceRequests } from '@/db/schema';
import { eq, and, count, sum, gte, lte, not, inArray, desc, asc, sql } from 'drizzle-orm';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export async function getDashboardStats() {
  const allSlips = await db.query.slips.findMany();
  const total = allSlips.length;
  const occupied = allSlips.filter((s) => s.status === 'occupied').length;
  const available = allSlips.filter((s) => s.status === 'available').length;
  const reserved = allSlips.filter((s) => s.status === 'reserved').length;
  const maintenance = allSlips.filter((s) => s.status === 'maintenance').length;
  const occupancyRate = total > 0 ? Math.round(((occupied + reserved) / total) * 100) : 0;

  return { total, occupied, available, reserved, maintenance, occupancyRate };
}

export async function getRevenueOverview() {
  const now = new Date();
  const months: { label: string; revenue: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = format(startOfMonth(monthDate), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd');

    const result = await db
      .select({ total: sum(bookings.totalPrice) })
      .from(bookings)
      .where(
        and(
          gte(bookings.startDate, monthStart),
          lte(bookings.startDate, monthEnd),
          not(eq(bookings.status, 'cancelled')),
        ),
      )
      .get();

    months.push({
      label: format(monthDate, 'MMM yyyy'),
      revenue: Number(result?.total ?? 0),
    });
  }

  // Revenue by dock
  const allDocks = await db.query.docks.findMany();
  const byDock: { dock: string; revenue: number }[] = [];

  for (const dock of allDocks) {
    const dockSlips = await db.query.slips.findMany({ where: eq(slips.dockId, dock.id) });
    const slipIds = dockSlips.map((s) => s.id);
    if (slipIds.length === 0) { byDock.push({ dock: dock.name, revenue: 0 }); continue; }

    const result = await db
      .select({ total: sum(bookings.totalPrice) })
      .from(bookings)
      .where(
        and(
          inArray(bookings.slipId, slipIds),
          not(eq(bookings.status, 'cancelled')),
        ),
      )
      .get();

    byDock.push({ dock: dock.name, revenue: Number(result?.total ?? 0) });
  }

  const totalRevenue = months.reduce((sum, m) => sum + m.revenue, 0);

  return { months, byDock, totalRevenue };
}

export async function getWaitlistEntries() {
  return db.query.waitlist.findMany({
    with: { boater: true, vessel: true },
    orderBy: [desc(waitlist.priority), asc(waitlist.createdAt)],
  });
}

export async function getAllBoaters() {
  return db.query.users.findMany({
    where: eq(users.role, 'boater'),
    with: { vessels: true, bookings: true },
    orderBy: [asc(users.name)],
  });
}

export async function getMaintenanceRequests() {
  return db.query.maintenanceRequests.findMany({
    with: {
      slip: { with: { dock: true } },
      reporter: true,
    },
    orderBy: [desc(maintenanceRequests.createdAt)],
  });
}
