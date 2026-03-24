import { db } from '@/db';
import { fuelSales, slips, bookings as bookingsTable } from '@/db/schema';
import { eq, and, gte, lte, sum, desc } from 'drizzle-orm';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export async function getFuelSales(limit = 50) {
  return db.query.fuelSales.findMany({
    with: {
      slip: { with: { dock: true } },
      boater: true,
      recorder: true,
    },
    orderBy: [desc(fuelSales.createdAt)],
    limit,
  });
}

export async function getFuelSalesByBoater(boaterId: number) {
  return db.query.fuelSales.findMany({
    where: eq(fuelSales.boaterId, boaterId),
    with: {
      slip: { with: { dock: true } },
      recorder: true,
    },
    orderBy: [desc(fuelSales.createdAt)],
  });
}

export async function getFuelRevenueSummary() {
  const now = new Date();

  // Monthly totals (last 6 months)
  const months: { label: string; diesel: number; gas: number; total: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = format(startOfMonth(monthDate), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd');

    const results = await db
      .select({
        fuelType: fuelSales.fuelType,
        total: sum(fuelSales.totalPrice),
        gallons: sum(fuelSales.gallons),
      })
      .from(fuelSales)
      .where(
        and(
          gte(fuelSales.createdAt, monthStart),
          lte(fuelSales.createdAt, monthEnd + 'T23:59:59'),
        ),
      )
      .groupBy(fuelSales.fuelType);

    const diesel = results.find((r) => r.fuelType === 'diesel');
    const gas = results.find((r) => r.fuelType === 'gas');
    const dieselTotal = Number(diesel?.total ?? 0);
    const gasTotal = Number(gas?.total ?? 0);

    months.push({
      label: format(monthDate, 'MMM yyyy'),
      diesel: dieselTotal,
      gas: gasTotal,
      total: dieselTotal + gasTotal,
    });
  }

  // Today's fuel revenue
  const today = format(now, 'yyyy-MM-dd');
  const [todayResult] = await db
    .select({ total: sum(fuelSales.totalPrice), gallons: sum(fuelSales.gallons) })
    .from(fuelSales)
    .where(gte(fuelSales.createdAt, today));

  // Total all-time
  const [allTimeResult] = await db
    .select({ total: sum(fuelSales.totalPrice), gallons: sum(fuelSales.gallons) })
    .from(fuelSales);

  return {
    months,
    todayRevenue: Number(todayResult?.total ?? 0),
    todayGallons: Number(todayResult?.gallons ?? 0),
    totalRevenue: Number(allTimeResult?.total ?? 0),
    totalGallons: Number(allTimeResult?.gallons ?? 0),
  };
}

export async function getOccupiedSlipsWithBoaters() {
  // Get slips that are occupied with their current checked-in booking
  const occupiedSlips = await db.query.slips.findMany({
    where: eq(slips.status, 'occupied'),
    with: {
      dock: true,
      bookings: {
        with: { boater: true, vessel: true },
        limit: 1,
        orderBy: [desc(bookingsTable.createdAt)],
      },
    },
  });

  return occupiedSlips
    .filter((s) => s.bookings.length > 0)
    .map((s) => ({
      slipId: s.id,
      slipNumber: s.number,
      dockName: s.dock?.name ?? '',
      boaterId: s.bookings[0].boaterId,
      boaterName: s.bookings[0].boater?.name ?? 'Unknown',
      vesselName: s.bookings[0].vessel?.name ?? 'Unknown',
    }));
}
