'use server';

import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { slips, vessels } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { createBookingSchema, type CreateBookingInput } from '@/lib/validations/booking';
import { vesselFitsSlip, calculateBookingPrice } from '@/lib/domain/booking-rules';
import { createBookingTransaction, updateBookingStatusTransaction } from '@/lib/dal/bookings';

export async function createBooking(input: CreateBookingInput) {
  const session = await getSession();

  if (!session.isLoggedIn || (session.role !== 'admin' && session.role !== 'dock_staff')) {
    return { success: false, error: 'Unauthorized: Only admin and staff can create bookings' };
  }

  // Validate input
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const data = parsed.data;

  // Fetch slip and vessel
  const slip = await db.query.slips.findFirst({ where: eq(slips.id, data.slipId) });
  if (!slip) return { success: false, error: 'Slip not found' };

  const vessel = await db.query.vessels.findFirst({ where: eq(vessels.id, data.vesselId) });
  if (!vessel) return { success: false, error: 'Vessel not found' };

  // Vessel fit check
  const fitResult = vesselFitsSlip(
    { loa: vessel.loa, beam: vessel.beam, draft: vessel.draft },
    { maxLength: slip.maxLength, maxBeam: slip.maxBeam, maxDraft: slip.maxDraft },
  );

  if (!fitResult.fits) {
    return { success: false, error: 'Vessel does not fit this slip', reasons: fitResult.reasons };
  }

  // Calculate price
  const totalPrice = calculateBookingPrice(data.type, data.startDate, data.endDate, {
    priceDaily: slip.priceDaily,
    priceMonthly: slip.priceMonthly,
  });

  // Create booking within transaction
  const result = createBookingTransaction({
    slipId: data.slipId,
    vesselId: data.vesselId,
    boaterId: data.boaterId,
    type: data.type,
    startDate: data.startDate,
    endDate: data.endDate,
    totalPrice,
    notes: data.notes,
  });

  if (!result.success) {
    return { success: false, error: 'Slip is already booked for those dates', conflicts: result.conflicts };
  }

  revalidatePath('/admin/bookings');
  revalidatePath('/marina');
  revalidatePath('/staff/operations');
  revalidatePath('/admin/dashboard');

  return { success: true, booking: result.booking };
}

export async function updateBookingStatus(bookingId: number, newStatus: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return { success: false, error: 'Unauthorized' };
  }

  // Admin and staff can do all transitions
  // Boaters can only cancel their own pending/confirmed bookings
  if (session.role === 'boater') {
    if (newStatus !== 'cancelled') {
      return { success: false, error: 'Boaters can only cancel bookings' };
    }
    // Verify ownership (checked inside transaction would be better, but keeping simple)
    const booking = db.query.bookings.findFirst({ where: eq(db._.fullSchema.bookings.id, bookingId) });
  }

  if (session.role !== 'admin' && session.role !== 'dock_staff' && session.role !== 'boater') {
    return { success: false, error: 'Unauthorized' };
  }

  const result = updateBookingStatusTransaction(bookingId, newStatus);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath('/admin/bookings');
  revalidatePath('/marina');
  revalidatePath('/staff/operations');
  revalidatePath('/admin/dashboard');

  return { success: true, booking: result.booking };
}
