import { describe, it, expect } from 'vitest';
import {
  canTransition,
  VALID_TRANSITIONS,
  vesselFitsSlip,
  datesOverlap,
  slipStatusForBooking,
  calculateBookingPrice,
} from '@/lib/domain/booking-rules';
import { createBookingSchema } from '@/lib/validations/booking';

describe('Booking Domain Rules', () => {
  describe('canTransition', () => {
    it('pending -> confirmed is valid', () => {
      expect(canTransition('pending', 'confirmed')).toBe(true);
    });

    it('pending -> cancelled is valid', () => {
      expect(canTransition('pending', 'cancelled')).toBe(true);
    });

    it('confirmed -> checked_in is valid', () => {
      expect(canTransition('confirmed', 'checked_in')).toBe(true);
    });

    it('confirmed -> cancelled is valid', () => {
      expect(canTransition('confirmed', 'cancelled')).toBe(true);
    });

    it('checked_in -> checked_out is valid', () => {
      expect(canTransition('checked_in', 'checked_out')).toBe(true);
    });

    it('pending -> checked_in is invalid (must go through confirmed)', () => {
      expect(canTransition('pending', 'checked_in')).toBe(false);
    });

    it('checked_out -> anything is invalid (terminal state)', () => {
      expect(canTransition('checked_out', 'pending')).toBe(false);
      expect(canTransition('checked_out', 'confirmed')).toBe(false);
      expect(canTransition('checked_out', 'checked_in')).toBe(false);
    });

    it('cancelled -> anything is invalid (terminal state)', () => {
      expect(canTransition('cancelled', 'pending')).toBe(false);
      expect(canTransition('cancelled', 'confirmed')).toBe(false);
    });

    it('unknown status returns false', () => {
      expect(canTransition('unknown', 'confirmed')).toBe(false);
    });
  });

  describe('vesselFitsSlip', () => {
    it('vessel that fits returns fits: true with empty reasons', () => {
      const result = vesselFitsSlip(
        { loa: 24, beam: 8, draft: 4 },
        { maxLength: 25, maxBeam: 10, maxDraft: 5 },
      );
      expect(result.fits).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('oversized vessel returns fits: false with reasons for each dimension', () => {
      const result = vesselFitsSlip(
        { loa: 30, beam: 12, draft: 6 },
        { maxLength: 25, maxBeam: 10, maxDraft: 5 },
      );
      expect(result.fits).toBe(false);
      expect(result.reasons).toHaveLength(3);
      expect(result.reasons[0]).toContain('LOA');
      expect(result.reasons[1]).toContain('Beam');
      expect(result.reasons[2]).toContain('Draft');
    });

    it('vessel at exact dimensions fits', () => {
      const result = vesselFitsSlip(
        { loa: 25, beam: 10, draft: 5 },
        { maxLength: 25, maxBeam: 10, maxDraft: 5 },
      );
      expect(result.fits).toBe(true);
    });

    it('vessel exceeding only one dimension fails with one reason', () => {
      const result = vesselFitsSlip(
        { loa: 30, beam: 8, draft: 4 },
        { maxLength: 25, maxBeam: 10, maxDraft: 5 },
      );
      expect(result.fits).toBe(false);
      expect(result.reasons).toHaveLength(1);
    });
  });

  describe('datesOverlap', () => {
    it('overlapping dates return true', () => {
      expect(datesOverlap('2026-03-10', '2026-03-15', '2026-03-12', '2026-03-20')).toBe(true);
    });

    it('checkout day is available (hotel convention) - end equals start', () => {
      expect(datesOverlap('2026-03-15', '2026-03-20', '2026-03-10', '2026-03-15')).toBe(false);
    });

    it('checkout day available - start equals existing end', () => {
      expect(datesOverlap('2026-03-10', '2026-03-15', '2026-03-15', '2026-03-20')).toBe(false);
    });

    it('completely separate ranges do not overlap', () => {
      expect(datesOverlap('2026-03-01', '2026-03-05', '2026-03-10', '2026-03-15')).toBe(false);
    });

    it('one range contained within another overlaps', () => {
      expect(datesOverlap('2026-03-05', '2026-03-20', '2026-03-10', '2026-03-15')).toBe(true);
    });
  });

  describe('slipStatusForBooking', () => {
    it('confirmed -> reserved', () => {
      expect(slipStatusForBooking('confirmed')).toBe('reserved');
    });

    it('checked_in -> occupied', () => {
      expect(slipStatusForBooking('checked_in')).toBe('occupied');
    });

    it('checked_out -> available', () => {
      expect(slipStatusForBooking('checked_out')).toBe('available');
    });

    it('cancelled -> available', () => {
      expect(slipStatusForBooking('cancelled')).toBe('available');
    });

    it('pending -> null (no slip change)', () => {
      expect(slipStatusForBooking('pending')).toBeNull();
    });
  });

  describe('calculateBookingPrice', () => {
    const slip = { priceDaily: 50, priceMonthly: 800 };

    it('transient: 5 days at $50/day = $250', () => {
      expect(calculateBookingPrice('transient', '2026-03-10', '2026-03-15', slip)).toBe(250);
    });

    it('transient: 1 day at $50/day = $50', () => {
      expect(calculateBookingPrice('transient', '2026-03-10', '2026-03-11', slip)).toBe(50);
    });

    it('seasonal: 3 months at $800/mo = $2400', () => {
      expect(calculateBookingPrice('seasonal', '2026-03-01', '2026-06-01', slip)).toBe(2400);
    });

    it('seasonal: minimum 1 month', () => {
      expect(calculateBookingPrice('seasonal', '2026-03-01', '2026-03-15', slip)).toBe(800);
    });
  });

  describe('createBookingSchema', () => {
    const validInput = {
      slipId: 1,
      vesselId: 1,
      boaterId: 1,
      type: 'transient' as const,
      startDate: '2026-03-10',
      endDate: '2026-03-15',
    };

    it('accepts valid transient booking input', () => {
      const result = createBookingSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('accepts valid seasonal booking input', () => {
      const result = createBookingSchema.safeParse({ ...validInput, type: 'seasonal', endDate: '2026-06-01' });
      expect(result.success).toBe(true);
    });

    it('accepts input with optional notes', () => {
      const result = createBookingSchema.safeParse({ ...validInput, notes: 'VIP guest' });
      expect(result.success).toBe(true);
    });

    it('rejects endDate <= startDate', () => {
      const result = createBookingSchema.safeParse({ ...validInput, endDate: '2026-03-10' });
      expect(result.success).toBe(false);
    });

    it('rejects endDate before startDate', () => {
      const result = createBookingSchema.safeParse({ ...validInput, endDate: '2026-03-05' });
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const result = createBookingSchema.safeParse({ slipId: 1 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid date format', () => {
      const result = createBookingSchema.safeParse({ ...validInput, startDate: '03/10/2026' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid booking type', () => {
      const result = createBookingSchema.safeParse({ ...validInput, type: 'weekly' });
      expect(result.success).toBe(false);
    });
  });
});
