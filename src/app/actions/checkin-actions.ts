'use server';

import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { bookings, slips } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function checkInByCode(code: string) {
  const session = await getSession();

  if (!session.isLoggedIn || (session.role !== 'admin' && session.role !== 'dock_staff')) {
    return { success: false, error: 'Unauthorized: Only admin and staff can check in boaters' };
  }

  const trimmed = code.trim().toUpperCase();
  if (!trimmed) {
    return { success: false, error: 'Please enter a booking code' };
  }

  // Find booking by check-in code
  const booking = await db.query.bookings.findFirst({
    where: and(
      eq(bookings.checkInCode, trimmed),
      eq(bookings.status, 'confirmed'),
    ),
    with: {
      slip: { with: { dock: true } },
      vessel: true,
      boater: true,
    },
  });

  if (!booking) {
    return { success: false, error: 'No confirmed booking found with this code. It may already be checked in or the code is invalid.' };
  }

  // Update booking to checked_in
  const now = new Date().toISOString();
  await db.update(bookings).set({
    status: 'checked_in',
    checkedInAt: now,
    updatedAt: now,
  }).where(eq(bookings.id, booking.id));

  // Update slip status to occupied
  await db.update(slips).set({ status: 'occupied' }).where(eq(slips.id, booking.slipId));

  revalidatePath('/staff/check-in');
  revalidatePath('/staff/operations');
  revalidatePath('/admin/marina');
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/bookings');

  return {
    success: true,
    booking: {
      id: booking.id,
      slipNumber: booking.slip?.number,
      dockName: booking.slip?.dock?.name,
      vesselName: booking.vessel?.name,
      boaterName: booking.boater?.name,
      checkedInAt: now,
    },
  };
}
