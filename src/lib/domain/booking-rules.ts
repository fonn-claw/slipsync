import { differenceInDays, differenceInMonths } from 'date-fns';

// ── State Machine ─────────────────────────────────────────────────────────
export const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled'],
  checked_in: ['checked_out'],
  checked_out: [],
  cancelled: [],
};

export function canTransition(from: string, to: string): boolean {
  return (VALID_TRANSITIONS[from] ?? []).includes(to);
}

// ── Vessel Fit ────────────────────────────────────────────────────────────
export function vesselFitsSlip(
  vessel: { loa: number; beam: number; draft: number },
  slip: { maxLength: number; maxBeam: number; maxDraft: number },
): { fits: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (vessel.loa > slip.maxLength) {
    reasons.push(`LOA ${vessel.loa}' exceeds max length ${slip.maxLength}'`);
  }
  if (vessel.beam > slip.maxBeam) {
    reasons.push(`Beam ${vessel.beam}' exceeds max beam ${slip.maxBeam}'`);
  }
  if (vessel.draft > slip.maxDraft) {
    reasons.push(`Draft ${vessel.draft}' exceeds max draft ${slip.maxDraft}'`);
  }
  return { fits: reasons.length === 0, reasons };
}

// ── Date Overlap (hotel convention: checkout day is available) ────────────
export function datesOverlap(
  newStart: string,
  newEnd: string,
  existingStart: string,
  existingEnd: string,
): boolean {
  return newStart < existingEnd && newEnd > existingStart;
}

// ── Slip Status Mapping ──────────────────────────────────────────────────
export function slipStatusForBooking(bookingStatus: string): string | null {
  switch (bookingStatus) {
    case 'confirmed':
      return 'reserved';
    case 'checked_in':
      return 'occupied';
    case 'checked_out':
      return 'available';
    case 'cancelled':
      return 'available';
    default:
      return null;
  }
}

// ── Price Calculation ────────────────────────────────────────────────────
export function calculateBookingPrice(
  type: 'transient' | 'seasonal',
  startDate: string,
  endDate: string,
  slip: { priceDaily: number; priceMonthly: number },
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (type === 'transient') {
    const days = differenceInDays(end, start);
    return days * slip.priceDaily;
  }

  // seasonal: minimum 1 month
  const months = Math.max(1, differenceInMonths(end, start));
  return months * slip.priceMonthly;
}
