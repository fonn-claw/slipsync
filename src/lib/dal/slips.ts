import { db } from '@/db';
import { bookings } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function getSlipsWithDetails() {
  return db.query.slips.findMany({
    with: {
      dock: true,
      bookings: {
        with: {
          vessel: true,
          boater: true,
        },
        limit: 5,
        orderBy: [desc(bookings.startDate)],
      },
    },
  });
}

export type SlipWithDetails = Awaited<ReturnType<typeof getSlipsWithDetails>>[number];
