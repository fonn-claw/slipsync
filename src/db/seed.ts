import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as schema from './schema';
import { daysFromNow, isoNow } from './seed-helpers';

const {
  users, docks, slips, vessels, bookings, waitlist, maintenanceRequests, fuelSales,
} = schema;

function generateCheckInCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SS-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function seed(dbInstance?: ReturnType<typeof drizzle>) {
  let db: ReturnType<typeof drizzle>;

  if (dbInstance) {
    db = dbInstance;
  } else {
    const sql = neon(process.env.DATABASE_URL!);
    db = drizzle(sql, { schema });
  }

  const now = isoNow();
  const passwordHash = bcrypt.hashSync('demo1234', 10);

  // ── Clear tables in reverse FK order ─────────────────────────────────
  await db.delete(fuelSales);
  await db.delete(maintenanceRequests);
  await db.delete(waitlist);
  await db.delete(bookings);
  await db.delete(vessels);
  await db.delete(slips);
  await db.delete(docks);
  await db.delete(users);

  // ── Users ────────────────────────────────────────────────────────────
  const staffUsers = [
    { email: 'admin@slipsync.app', name: 'Harbor Master', role: 'admin' as const, phone: '(555) 100-0001' },
    { email: 'dock@slipsync.app', name: 'Jake Martinez', role: 'dock_staff' as const, phone: '(555) 100-0002' },
    { email: 'boater@slipsync.app', name: 'Sarah Chen', role: 'boater' as const, phone: '(555) 200-0001' },
  ];

  const boaterNames = [
    'Mike Thompson', 'Lisa Rodriguez', 'Tom Wilson', 'Jennifer Park',
    'David Kim', 'Amanda Foster', 'Robert Hayes', 'Emily Watson',
    'James Mitchell', 'Maria Santos', 'Chris Anderson', 'Nicole Taylor',
    'Steven Clark', 'Rachel Green', 'Daniel Brooks',
    'Kevin Murphy', 'Patricia Nguyen', 'Brian Cooper',
  ];

  const allUserInserts = [
    ...staffUsers.map((u) => ({
      ...u,
      passwordHash,
      createdAt: now,
    })),
    ...boaterNames.map((name, i) => ({
      email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
      name,
      role: 'boater' as const,
      passwordHash,
      phone: `(555) 200-${String(i + 2).padStart(4, '0')}`,
      createdAt: now,
    })),
  ];

  for (const u of allUserInserts) {
    await db.insert(users).values(u);
  }

  const allUsers = await db.select().from(users);
  const adminUser = allUsers.find((u) => u.email === 'admin@slipsync.app')!;
  const dockStaff = allUsers.find((u) => u.email === 'dock@slipsync.app')!;
  const sarahChen = allUsers.find((u) => u.email === 'boater@slipsync.app')!;
  const boaterUsers = allUsers.filter((u) => u.role === 'boater');

  // ── Docks ────────────────────────────────────────────────────────────
  const dockData = [
    { name: 'A', description: 'Small craft berths', sizeCategory: 'small' as const, minLength: 20, maxLength: 30 },
    { name: 'B', description: 'Mid-size vessel berths', sizeCategory: 'medium' as const, minLength: 30, maxLength: 45 },
    { name: 'C', description: 'Large vessel berths', sizeCategory: 'large' as const, minLength: 45, maxLength: 65 },
    { name: 'D', description: 'Mega yacht berths', sizeCategory: 'extra_large' as const, minLength: 65, maxLength: 100 },
  ];

  for (const d of dockData) {
    await db.insert(docks).values(d);
  }
  const allDocks = await db.select().from(docks);

  // ── Slips ────────────────────────────────────────────────────────────
  interface SlipConfig {
    dockName: string;
    count: number;
    lengthRange: [number, number];
    beamRange: [number, number];
    draftRange: [number, number];
    dailyRange: [number, number];
    monthlyRange: [number, number];
  }

  const slipConfigs: SlipConfig[] = [
    { dockName: 'A', count: 20, lengthRange: [22, 30], beamRange: [8, 10], draftRange: [3, 5], dailyRange: [45, 65], monthlyRange: [800, 1200] },
    { dockName: 'B', count: 15, lengthRange: [32, 45], beamRange: [12, 14], draftRange: [5, 7], dailyRange: [75, 110], monthlyRange: [1400, 2200] },
    { dockName: 'C', count: 15, lengthRange: [48, 65], beamRange: [16, 18], draftRange: [6, 9], dailyRange: [130, 200], monthlyRange: [2800, 4500] },
    { dockName: 'D', count: 10, lengthRange: [68, 100], beamRange: [20, 26], draftRange: [8, 12], dailyRange: [250, 450], monthlyRange: [5500, 9000] },
  ];

  function lerp(min: number, max: number, t: number): number {
    return Math.round((min + (max - min) * t) * 100) / 100;
  }

  const statusDistribution: Record<string, Array<'occupied' | 'reserved' | 'available' | 'maintenance'>> = {
    A: [
      ...Array(8).fill('occupied' as const),
      ...Array(4).fill('reserved' as const),
      ...Array(6).fill('available' as const),
      ...Array(2).fill('maintenance' as const),
    ],
    B: [
      ...Array(6).fill('occupied' as const),
      ...Array(3).fill('reserved' as const),
      ...Array(4).fill('available' as const),
      ...Array(2).fill('maintenance' as const),
    ],
    C: [
      ...Array(6).fill('occupied' as const),
      ...Array(3).fill('reserved' as const),
      ...Array(5).fill('available' as const),
      ...Array(1).fill('maintenance' as const),
    ],
    D: [
      ...Array(4).fill('occupied' as const),
      ...Array(2).fill('reserved' as const),
      ...Array(3).fill('available' as const),
      ...Array(1).fill('maintenance' as const),
    ],
  };

  for (const cfg of slipConfigs) {
    const dock = allDocks.find((d) => d.name === cfg.dockName)!;
    const statuses = statusDistribution[cfg.dockName];

    for (let i = 0; i < cfg.count; i++) {
      const t = cfg.count === 1 ? 0 : i / (cfg.count - 1);
      await db.insert(slips).values({
        dockId: dock.id,
        number: `${cfg.dockName}-${String(i + 1).padStart(2, '0')}`,
        maxLength: lerp(cfg.lengthRange[0], cfg.lengthRange[1], t),
        maxBeam: lerp(cfg.beamRange[0], cfg.beamRange[1], t),
        maxDraft: lerp(cfg.draftRange[0], cfg.draftRange[1], t),
        status: statuses[i],
        priceDaily: lerp(cfg.dailyRange[0], cfg.dailyRange[1], t),
        priceMonthly: lerp(cfg.monthlyRange[0], cfg.monthlyRange[1], t),
        hasElectric: true,
        hasWater: true,
      });
    }
  }

  const allSlips = await db.select().from(slips);
  const occupiedSlips = allSlips.filter((s) => s.status === 'occupied');
  const reservedSlips = allSlips.filter((s) => s.status === 'reserved');
  const availableSlips = allSlips.filter((s) => s.status === 'available');
  const maintenanceSlips = allSlips.filter((s) => s.status === 'maintenance');

  // ── Vessels ──────────────────────────────────────────────────────────
  const vesselNames = [
    'Windward Spirit', 'Blue Horizon', 'Ocean Pearl', 'Starboard Dream',
    'Tidal Wave', 'Coral Runner', 'Pacific Wanderer', 'Moonlit Bay',
    'Silver Wake', 'Coastal Gem', 'Sunset Chaser', "Anchor's Rest",
    'Deep Current', 'Marina Breeze', 'Wave Dancer', 'Neptune Rising',
    'Saltwater Soul',
  ];
  const vesselTypes = ['sailboat', 'powerboat', 'catamaran', 'trawler', 'center_console'];

  // Sarah Chen's vessels (must be exactly 2)
  await db.insert(vessels).values({
    ownerId: sarahChen.id,
    name: 'Sea Breeze',
    type: 'sailboat',
    loa: 32,
    beam: 11,
    draft: 5.5,
    registrationNumber: 'FL-2019-SB-0001',
    year: 2019,
    createdAt: now,
  });

  await db.insert(vessels).values({
    ownerId: sarahChen.id,
    name: 'Harbor Light',
    type: 'powerboat',
    loa: 24,
    beam: 8.5,
    draft: 3,
    registrationNumber: 'FL-2022-HL-0002',
    year: 2022,
    createdAt: now,
  });

  // Other boaters' vessels -- one per boater, some get a second
  const otherBoaters = boaterUsers.filter((u) => u.id !== sarahChen.id);
  let vesselNameIdx = 0;

  for (let i = 0; i < otherBoaters.length; i++) {
    const boater = otherBoaters[i];
    let loa: number, beam: number, draft: number;
    if (i < 5) {
      loa = 22 + i * 1.5;
      beam = 8 + i * 0.3;
      draft = 3 + i * 0.3;
    } else if (i < 9) {
      loa = 32 + (i - 5) * 3;
      beam = 11 + (i - 5) * 0.5;
      draft = 5 + (i - 5) * 0.4;
    } else if (i < 13) {
      loa = 48 + (i - 9) * 4;
      beam = 15 + (i - 9) * 0.5;
      draft = 6 + (i - 9) * 0.5;
    } else {
      loa = 68 + (i - 13) * 10;
      beam = 20 + (i - 13) * 2;
      draft = 8 + (i - 13) * 1.5;
    }

    await db.insert(vessels).values({
      ownerId: boater.id,
      name: vesselNames[vesselNameIdx % vesselNames.length],
      type: vesselTypes[i % vesselTypes.length],
      loa,
      beam,
      draft,
      registrationNumber: `FL-${2018 + (i % 7)}-VL-${String(i + 3).padStart(4, '0')}`,
      year: 2018 + (i % 7),
      createdAt: now,
    });
    vesselNameIdx++;

    // Give some boaters a second vessel
    if (i === 1 || i === 3 || i === 5 || i === 7 || i === 9 || i === 11 || i === 14) {
      await db.insert(vessels).values({
        ownerId: boater.id,
        name: vesselNames[vesselNameIdx % vesselNames.length],
        type: vesselTypes[(i + 2) % vesselTypes.length],
        loa: loa - 4,
        beam: beam - 1,
        draft: draft - 0.5,
        registrationNumber: `FL-${2020 + (i % 5)}-VL-${String(i + 20).padStart(4, '0')}`,
        year: 2020 + (i % 5),
        createdAt: now,
      });
      vesselNameIdx++;
    }
  }

  const allVessels = await db.select().from(vessels);

  // Helper: find a vessel that fits a given slip
  function findFittingVessel(slip: typeof allSlips[0], excludeOwnerIds: number[] = []) {
    return allVessels.find(
      (v) =>
        !excludeOwnerIds.includes(v.ownerId) &&
        v.loa <= slip.maxLength &&
        v.beam <= slip.maxBeam &&
        v.draft <= slip.maxDraft
    );
  }

  function findAnyFittingVessel(slip: typeof allSlips[0]) {
    return allVessels.find(
      (v) => v.loa <= slip.maxLength && v.beam <= slip.maxBeam && v.draft <= slip.maxDraft
    );
  }

  // ── Bookings ─────────────────────────────────────────────────────────
  let seedCounter = 0;

  // 1) Sarah Chen's active booking (checked_in) with Sea Breeze
  const sarahVessel = allVessels.find((v) => v.name === 'Sea Breeze')!;
  const sarahSlip = occupiedSlips.find(
    (s) => sarahVessel.loa <= s.maxLength && sarahVessel.beam <= s.maxBeam && sarahVessel.draft <= s.maxDraft
  )!;

  await db.insert(bookings).values({
    slipId: sarahSlip.id,
    vesselId: sarahVessel.id,
    boaterId: sarahChen.id,
    type: 'transient',
    status: 'checked_in',
    startDate: daysFromNow(-10),
    endDate: daysFromNow(20),
    totalPrice: sarahSlip.priceDaily * 30,
    checkedInAt: daysFromNow(-10) + 'T09:15:00.000Z',
    createdAt: now,
    updatedAt: now,
  });

  // Sarah's second booking (upcoming, confirmed with QR code)
  const harborLight = allVessels.find((v) => v.name === 'Harbor Light')!;
  const sarahSecondSlip = availableSlips.find(
    (s) => harborLight.loa <= s.maxLength && harborLight.beam <= s.maxBeam && harborLight.draft <= s.maxDraft
  );
  if (sarahSecondSlip) {
    await db.insert(bookings).values({
      slipId: sarahSecondSlip.id,
      vesselId: harborLight.id,
      boaterId: sarahChen.id,
      type: 'transient',
      status: 'confirmed',
      startDate: daysFromNow(5),
      endDate: daysFromNow(12),
      totalPrice: sarahSecondSlip.priceDaily * 7,
      checkInCode: 'SS-DEMO42',
      createdAt: now,
      updatedAt: now,
    });
  }

  // 2) Remaining occupied slips get checked_in bookings
  const remainingOccupied = occupiedSlips.filter((s) => s.id !== sarahSlip.id);
  for (const slip of remainingOccupied) {
    const vessel = findFittingVessel(slip, [sarahChen.id]);
    if (!vessel) {
      const fallback = findAnyFittingVessel(slip);
      if (!fallback) continue;
    }
    const v = findFittingVessel(slip, []) || findAnyFittingVessel(slip);
    if (!v) continue;

    seedCounter++;
    const startOffset = -(3 + (seedCounter * 3) % 28);
    const endOffset = 5 + (seedCounter * 7) % 26;
    const days = endOffset - startOffset;

    await db.insert(bookings).values({
      slipId: slip.id,
      vesselId: v.id,
      boaterId: v.ownerId,
      type: days > 60 ? 'seasonal' : 'transient',
      status: 'checked_in',
      startDate: daysFromNow(startOffset),
      endDate: daysFromNow(endOffset),
      totalPrice: slip.priceDaily * days,
      createdAt: now,
      updatedAt: now,
    });
  }

  // 3) Upcoming reservations for reserved slips (confirmed)
  for (const slip of reservedSlips) {
    const v = findFittingVessel(slip, []) || findAnyFittingVessel(slip);
    if (!v) continue;

    seedCounter++;
    const startOffset = 1 + (seedCounter * 3) % 14;
    const endOffset = startOffset + 14 + (seedCounter * 5) % 31;
    const days = endOffset - startOffset;

    await db.insert(bookings).values({
      slipId: slip.id,
      vesselId: v.id,
      boaterId: v.ownerId,
      type: days > 60 ? 'seasonal' : 'transient',
      status: 'confirmed',
      startDate: daysFromNow(startOffset),
      endDate: daysFromNow(endOffset),
      totalPrice: slip.priceDaily * days,
      checkInCode: generateCheckInCode(),
      createdAt: now,
      updatedAt: now,
    });
  }

  // 4) Historical bookings (checked_out) - 15 past bookings
  for (let i = 0; i < 15; i++) {
    const slip = availableSlips[i % availableSlips.length];
    const v = findFittingVessel(slip, []) || findAnyFittingVessel(slip);
    if (!v) continue;

    const endOffset = -(7 + i * 5);
    const startOffset = endOffset - (5 + (i % 15));
    const days = Math.abs(endOffset - startOffset);

    await db.insert(bookings).values({
      slipId: slip.id,
      vesselId: v.id,
      boaterId: v.ownerId,
      type: i % 3 === 0 ? 'seasonal' : 'transient',
      status: 'checked_out',
      startDate: daysFromNow(startOffset),
      endDate: daysFromNow(endOffset),
      totalPrice: slip.priceDaily * days,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ── Waitlist ─────────────────────────────────────────────────────────
  const waitlistBoaters = boaterUsers.filter((u) => u.id !== sarahChen.id).slice(8, 12);
  const waitlistStatuses: Array<'waiting' | 'offered' | 'expired'> = ['waiting', 'waiting', 'offered', 'expired'];

  for (let i = 0; i < 4; i++) {
    const boater = waitlistBoaters[i];
    const vessel = allVessels.find((v) => v.ownerId === boater.id);
    if (!vessel) continue;

    await db.insert(waitlist).values({
      boaterId: boater.id,
      vesselId: vessel.id,
      preferredDock: ['A', 'B', 'C', 'D'][i],
      minLength: vessel.loa,
      requestedStart: daysFromNow(7 + i * 10),
      requestedEnd: daysFromNow(37 + i * 10),
      status: waitlistStatuses[i],
      priority: i,
      createdAt: now,
    });
  }

  // ── Maintenance Requests ─────────────────────────────────────────────
  const maintenanceData = [
    { title: 'Dock cleat loose', description: 'The port-side cleat on slip is loose and needs re-bolting. Safety concern for moored vessels.', priority: 'high' as const, status: 'open' as const, resolvedAt: null },
    { title: 'Power outlet not working', description: 'Shore power outlet on the starboard pedestal is not providing power. Tested with multimeter, no voltage.', priority: 'urgent' as const, status: 'open' as const, resolvedAt: null },
    { title: 'Water leak at slip', description: 'Fresh water supply line has a slow drip at the connection point. Wasting water and creating a slip hazard on the dock.', priority: 'medium' as const, status: 'in_progress' as const, resolvedAt: null },
    { title: 'Bumper replacement needed', description: 'Two dock bumpers are cracked and need replacement. Vessels are making direct contact with dock edge.', priority: 'medium' as const, status: 'in_progress' as const, resolvedAt: null },
    { title: 'Light fixture broken', description: 'The overhead dock light at the end of the finger pier is burned out. Poor visibility at night.', priority: 'low' as const, status: 'completed' as const, resolvedAt: daysFromNow(-3) },
    { title: 'Dock board cracked', description: 'A section of decking near the slip entrance has a crack and is becoming a trip hazard.', priority: 'high' as const, status: 'cancelled' as const, resolvedAt: null },
  ];

  const maintenanceReporters = boaterUsers.slice(0, 6);

  for (let i = 0; i < maintenanceData.length; i++) {
    const slip = maintenanceSlips[i % maintenanceSlips.length];
    const reporter = maintenanceReporters[i];
    const maint = maintenanceData[i];

    await db.insert(maintenanceRequests).values({
      slipId: slip.id,
      reportedBy: reporter.id,
      assignedTo: maint.status === 'in_progress' || maint.status === 'completed' ? dockStaff.id : null,
      title: maint.title,
      description: maint.description,
      priority: maint.priority,
      status: maint.status,
      createdAt: daysFromNow(-(10 + i * 3)),
      resolvedAt: maint.resolvedAt,
    });
  }

  // ── Fuel Sales (last 30 days) ────────────────────────────────────────
  const fuelTypes: Array<'diesel' | 'gas'> = ['diesel', 'gas'];
  const occupiedBoatersForFuel = occupiedSlips.slice(0, 15);
  const allBookingsList = await db.select().from(bookings);

  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    // 1-4 fuel sales per day
    const salesPerDay = 1 + (dayOffset % 4);
    for (let s = 0; s < salesPerDay; s++) {
      const slipIdx = (dayOffset * 3 + s) % occupiedBoatersForFuel.length;
      const slip = occupiedBoatersForFuel[slipIdx];

      // Find the boater for this slip from bookings
      const booking = allBookingsList.find((b) => b.slipId === slip.id && b.status === 'checked_in');
      if (!booking) continue;

      const ft = fuelTypes[(dayOffset + s) % 2];
      const gallons = Math.round((15 + Math.random() * 85) * 10) / 10;
      const ppg = ft === 'diesel' ? 4.89 : 3.79;
      const total = Math.round(gallons * ppg * 100) / 100;

      await db.insert(fuelSales).values({
        slipId: slip.id,
        boaterId: booking.boaterId,
        recordedBy: dockStaff.id,
        fuelType: ft,
        gallons,
        pricePerGallon: ppg,
        totalPrice: total,
        createdAt: daysFromNow(-dayOffset) + 'T' + String(8 + (s * 3) % 10).padStart(2, '0') + ':' + String((dayOffset * 7 + s * 13) % 60).padStart(2, '0') + ':00.000Z',
      });
    }
  }

  const allFuelSales = await db.select().from(fuelSales);
  const allWaitlist = await db.select().from(waitlist);
  const allMaintenance = await db.select().from(maintenanceRequests);

  console.log('Seed complete!');
  console.log(`  Users: ${allUsers.length}`);
  console.log(`  Docks: ${allDocks.length}`);
  console.log(`  Slips: ${allSlips.length}`);
  console.log(`  Vessels: ${allVessels.length}`);
  console.log(`  Bookings: ${allBookingsList.length}`);
  console.log(`  Waitlist: ${allWaitlist.length}`);
  console.log(`  Maintenance: ${allMaintenance.length}`);
  console.log(`  Fuel Sales: ${allFuelSales.length}`);
}

// Run directly when executed as a script
seed().catch(console.error);
