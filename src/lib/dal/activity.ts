import { db } from '@/db';
import { bookings, fuelSales } from '@/db/schema';
import { desc, gte, eq } from 'drizzle-orm';
import { format, subDays } from 'date-fns';

export interface ActivityItem {
  id: string;
  type: 'check_in' | 'check_out' | 'fuel_sale' | 'new_booking';
  description: string;
  detail: string;
  timestamp: string;
}

export async function getTodayActivity(): Promise<ActivityItem[]> {
  const today = format(new Date(), 'yyyy-MM-dd');
  const items: ActivityItem[] = [];

  // Recent bookings (created today)
  const recentBookings = await db.query.bookings.findMany({
    where: gte(bookings.createdAt, today),
    with: {
      slip: { with: { dock: true } },
      vessel: true,
      boater: true,
    },
    orderBy: [desc(bookings.createdAt)],
    limit: 20,
  });

  for (const b of recentBookings) {
    if (b.status === 'checked_in' && b.checkedInAt && b.checkedInAt >= today) {
      items.push({
        id: `checkin-${b.id}`,
        type: 'check_in',
        description: `${b.boater?.name} checked in`,
        detail: `Slip ${b.slip?.number} · ${b.vessel?.name}`,
        timestamp: b.checkedInAt,
      });
    }

    if (b.status === 'checked_out' && b.updatedAt >= today) {
      items.push({
        id: `checkout-${b.id}`,
        type: 'check_out',
        description: `${b.boater?.name} checked out`,
        detail: `Slip ${b.slip?.number} · ${b.vessel?.name}`,
        timestamp: b.updatedAt,
      });
    }

    if (b.createdAt >= today && (b.status === 'pending' || b.status === 'confirmed')) {
      items.push({
        id: `booking-${b.id}`,
        type: 'new_booking',
        description: `New booking: ${b.boater?.name}`,
        detail: `Slip ${b.slip?.number} · ${format(new Date(b.startDate), 'MMM d')} - ${format(new Date(b.endDate), 'MMM d')}`,
        timestamp: b.createdAt,
      });
    }
  }

  // Today's fuel sales
  const recentFuel = await db.query.fuelSales.findMany({
    where: gte(fuelSales.createdAt, today),
    with: {
      slip: true,
      boater: true,
    },
    orderBy: [desc(fuelSales.createdAt)],
    limit: 20,
  });

  for (const f of recentFuel) {
    items.push({
      id: `fuel-${f.id}`,
      type: 'fuel_sale',
      description: `Fuel: ${f.gallons.toFixed(1)} gal ${f.fuelType}`,
      detail: `Slip ${f.slip?.number} · $${f.totalPrice.toFixed(2)}`,
      timestamp: f.createdAt,
    });
  }

  // Sort by timestamp descending
  items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return items.slice(0, 15);
}
