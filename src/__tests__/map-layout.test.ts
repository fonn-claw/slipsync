import { describe, it, expect } from 'vitest';
import { computeMarinaLayout, type SlipLayout, type DockLayout, type MarinaLayout } from '@/components/marina-map/map-layout';
import { VIEWBOX } from '@/components/marina-map/map-constants';
import type { SlipWithDetails } from '@/lib/dal/slips';

// Helper to create mock slip data matching SlipWithDetails shape
function createMockSlip(overrides: {
  id: number;
  dockId: number;
  dockName: string;
  dockSizeCategory: string;
  number: string;
  status?: string;
  maxLength?: number;
  bookings?: any[];
}): SlipWithDetails {
  return {
    id: overrides.id,
    dockId: overrides.dockId,
    number: overrides.number,
    maxLength: overrides.maxLength ?? 25,
    maxBeam: 10,
    maxDraft: 5,
    status: (overrides.status ?? 'available') as any,
    priceDaily: 50,
    priceMonthly: 800,
    hasElectric: true,
    hasWater: true,
    notes: null,
    dock: {
      id: overrides.dockId,
      name: overrides.dockName,
      description: null,
      sizeCategory: overrides.dockSizeCategory as any,
      minLength: 20,
      maxLength: 30,
    },
    bookings: overrides.bookings ?? [],
  } as SlipWithDetails;
}

function createMockMarinaSlips(): SlipWithDetails[] {
  const slips: SlipWithDetails[] = [];
  let slipId = 1;

  // Dock A: 20 small slips
  for (let i = 1; i <= 20; i++) {
    slips.push(createMockSlip({
      id: slipId++,
      dockId: 1,
      dockName: 'Dock A',
      dockSizeCategory: 'small',
      number: `A-${String(i).padStart(2, '0')}`,
      maxLength: 25,
    }));
  }

  // Dock B: 15 medium slips
  for (let i = 1; i <= 15; i++) {
    slips.push(createMockSlip({
      id: slipId++,
      dockId: 2,
      dockName: 'Dock B',
      dockSizeCategory: 'medium',
      number: `B-${String(i).padStart(2, '0')}`,
      maxLength: 35,
    }));
  }

  // Dock C: 15 large slips
  for (let i = 1; i <= 15; i++) {
    slips.push(createMockSlip({
      id: slipId++,
      dockId: 3,
      dockName: 'Dock C',
      dockSizeCategory: 'large',
      number: `C-${String(i).padStart(2, '0')}`,
      maxLength: 55,
    }));
  }

  // Dock D: 10 extra-large slips
  for (let i = 1; i <= 10; i++) {
    slips.push(createMockSlip({
      id: slipId++,
      dockId: 4,
      dockName: 'Dock D',
      dockSizeCategory: 'extra_large',
      number: `D-${String(i).padStart(2, '0')}`,
      maxLength: 80,
    }));
  }

  return slips;
}

describe('computeMarinaLayout', () => {
  it('computes layout for 4 docks with correct slip counts', () => {
    const slips = createMockMarinaSlips();
    const layout = computeMarinaLayout(slips);

    expect(layout.docks.length).toBe(4);
    const totalSlips = layout.docks.reduce((sum, d) => sum + d.slips.length, 0);
    expect(totalSlips).toBe(60);
  });

  it('positions Dock A and B on left half', () => {
    const slips = createMockMarinaSlips();
    const layout = computeMarinaLayout(slips);

    const dockA = layout.docks.find((d) => d.name === 'Dock A')!;
    const dockB = layout.docks.find((d) => d.name === 'Dock B')!;

    expect(dockA.x).toBeLessThan(VIEWBOX.width / 2);
    expect(dockB.x).toBeLessThan(VIEWBOX.width / 2);
  });

  it('positions Dock C and D on right half', () => {
    const slips = createMockMarinaSlips();
    const layout = computeMarinaLayout(slips);

    const dockC = layout.docks.find((d) => d.name === 'Dock C')!;
    const dockD = layout.docks.find((d) => d.name === 'Dock D')!;

    expect(dockC.x).toBeGreaterThan(VIEWBOX.width / 2);
    expect(dockD.x).toBeGreaterThan(VIEWBOX.width / 2);
  });

  it('all slips have positive coordinates and dimensions', () => {
    const slips = createMockMarinaSlips();
    const layout = computeMarinaLayout(slips);

    for (const dock of layout.docks) {
      for (const slip of dock.slips) {
        expect(slip.x).toBeGreaterThan(0);
        expect(slip.y).toBeGreaterThan(0);
        expect(slip.width).toBeGreaterThan(0);
        expect(slip.height).toBeGreaterThan(0);
      }
    }
  });

  it('slip status is preserved from input data', () => {
    const slips = [
      createMockSlip({ id: 1, dockId: 1, dockName: 'Dock A', dockSizeCategory: 'small', number: 'A-01', status: 'occupied' }),
      createMockSlip({ id: 2, dockId: 1, dockName: 'Dock A', dockSizeCategory: 'small', number: 'A-02', status: 'maintenance' }),
      createMockSlip({ id: 3, dockId: 1, dockName: 'Dock A', dockSizeCategory: 'small', number: 'A-03', status: 'available' }),
    ];
    const layout = computeMarinaLayout(slips);

    const dockSlips = layout.docks[0].slips;
    expect(dockSlips.find((s) => s.number === 'A-01')!.status).toBe('occupied');
    expect(dockSlips.find((s) => s.number === 'A-02')!.status).toBe('maintenance');
    expect(dockSlips.find((s) => s.number === 'A-03')!.status).toBe('available');
  });

  it('handles empty input', () => {
    const layout = computeMarinaLayout([]);
    expect(layout.viewBox).toEqual(VIEWBOX);
    expect(layout.docks).toEqual([]);
  });

  it('vesselName populated for occupied slips with active booking', () => {
    const slips = [
      createMockSlip({
        id: 1,
        dockId: 1,
        dockName: 'Dock A',
        dockSizeCategory: 'small',
        number: 'A-01',
        status: 'occupied',
        bookings: [
          {
            id: 1,
            slipId: 1,
            vesselId: 1,
            boaterId: 1,
            type: 'transient',
            status: 'checked_in',
            startDate: '2026-03-20',
            endDate: '2026-03-27',
            totalPrice: 350,
            notes: null,
            createdAt: '2026-03-20',
            updatedAt: '2026-03-20',
            vessel: { id: 1, ownerId: 1, name: 'Sea Breeze', type: 'Sailboat', loa: 24, beam: 8, draft: 4, registrationNumber: null, year: null, createdAt: '2026-03-20' },
            boater: { id: 1, email: 'boater@test.com', passwordHash: 'hash', name: 'Test Boater', role: 'boater', phone: null, createdAt: '2026-03-20' },
          },
        ],
      }),
      createMockSlip({
        id: 2,
        dockId: 1,
        dockName: 'Dock A',
        dockSizeCategory: 'small',
        number: 'A-02',
        status: 'available',
      }),
    ];
    const layout = computeMarinaLayout(slips);

    const occupiedSlip = layout.docks[0].slips.find((s) => s.number === 'A-01')!;
    const availableSlip = layout.docks[0].slips.find((s) => s.number === 'A-02')!;

    expect(occupiedSlip.vesselName).toBe('Sea Breeze');
    expect(availableSlip.vesselName).toBeNull();
  });

  it('viewBox matches constants', () => {
    const slips = createMockMarinaSlips();
    const layout = computeMarinaLayout(slips);
    expect(layout.viewBox).toEqual(VIEWBOX);
  });
});
