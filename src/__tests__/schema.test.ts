import { describe, it, expect } from 'vitest';
import { slips, docks, users, vessels, bookings, waitlist, maintenanceRequests } from '@/db/schema';

describe('schema', () => {
  it('slip dimensions - slips table has maxLength, maxBeam, maxDraft columns', () => {
    // Verify the column definitions exist on the slips table
    expect(slips.maxLength).toBeDefined();
    expect(slips.maxLength.name).toBe('max_length');
    expect(slips.maxBeam).toBeDefined();
    expect(slips.maxBeam.name).toBe('max_beam');
    expect(slips.maxDraft).toBeDefined();
    expect(slips.maxDraft.name).toBe('max_draft');
  });

  it('dock categories - docks table has sizeCategory with correct enum values', () => {
    expect(docks.sizeCategory).toBeDefined();
    expect(docks.sizeCategory.name).toBe('size_category');
    // Check the enum values are defined
    const enumValues = docks.sizeCategory.enumValues;
    expect(enumValues).toContain('small');
    expect(enumValues).toContain('medium');
    expect(enumValues).toContain('large');
    expect(enumValues).toContain('extra_large');
  });

  it('all tables are exported', () => {
    expect(users).toBeDefined();
    expect(docks).toBeDefined();
    expect(slips).toBeDefined();
    expect(vessels).toBeDefined();
    expect(bookings).toBeDefined();
    expect(waitlist).toBeDefined();
    expect(maintenanceRequests).toBeDefined();
  });

  it('users table has role enum with correct values', () => {
    const enumValues = users.role.enumValues;
    expect(enumValues).toContain('admin');
    expect(enumValues).toContain('dock_staff');
    expect(enumValues).toContain('boater');
  });

  it('bookings table has status enum with lifecycle states', () => {
    const enumValues = bookings.status.enumValues;
    expect(enumValues).toContain('pending');
    expect(enumValues).toContain('confirmed');
    expect(enumValues).toContain('checked_in');
    expect(enumValues).toContain('checked_out');
    expect(enumValues).toContain('cancelled');
  });
});
