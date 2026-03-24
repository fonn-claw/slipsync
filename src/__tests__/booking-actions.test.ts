import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';

// Mock modules - db mock creates its own in-memory database
vi.mock('@/db', async () => {
  const Database = (await import('better-sqlite3')).default;
  const { drizzle } = await import('drizzle-orm/better-sqlite3');
  const schema = await import('@/db/schema');
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  (db as any).__sqlite = sqlite;
  return { db, sqlite };
});
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { createBooking, updateBookingStatus } from '@/app/actions/booking-actions';
import { getSession } from '@/lib/auth';
import { db, sqlite } from '@/db';
import { getTodayArrivals, getTodayDepartures } from '@/lib/dal/bookings';
import { format } from 'date-fns';

const mockGetSession = vi.mocked(getSession);
const getSqlite = () => (db as any).__sqlite as import('better-sqlite3').Database;

const adminSession = {
  userId: 1,
  email: 'admin@test.com',
  name: 'Admin',
  role: 'admin' as const,
  isLoggedIn: true,
};

const boaterSession = {
  userId: 3,
  email: 'boater@test.com',
  name: 'Boater',
  role: 'boater' as const,
  isLoggedIn: true,
};

describe('Booking Actions', () => {
  beforeAll(() => {
    const sqliteDb = getSqlite();
    sqliteDb.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'dock_staff', 'boater')),
        phone TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE docks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        size_category TEXT NOT NULL CHECK(size_category IN ('small', 'medium', 'large', 'extra_large')),
        min_length REAL NOT NULL,
        max_length REAL NOT NULL
      );
      CREATE TABLE slips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dock_id INTEGER NOT NULL REFERENCES docks(id),
        number TEXT NOT NULL UNIQUE,
        max_length REAL NOT NULL,
        max_beam REAL NOT NULL,
        max_draft REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'reserved', 'maintenance')),
        price_daily REAL NOT NULL,
        price_monthly REAL NOT NULL,
        has_electric INTEGER NOT NULL DEFAULT 1,
        has_water INTEGER NOT NULL DEFAULT 1,
        notes TEXT
      );
      CREATE TABLE vessels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        loa REAL NOT NULL,
        beam REAL NOT NULL,
        draft REAL NOT NULL,
        registration_number TEXT,
        year INTEGER,
        created_at TEXT NOT NULL
      );
      CREATE TABLE bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slip_id INTEGER NOT NULL REFERENCES slips(id),
        vessel_id INTEGER NOT NULL REFERENCES vessels(id),
        boater_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL CHECK(type IN ('transient', 'seasonal')),
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_price REAL NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    const now = new Date().toISOString();

    db.insert(schema.users).values({
      email: 'admin@test.com', passwordHash: 'hash', name: 'Admin', role: 'admin', createdAt: now,
    }).run();
    db.insert(schema.users).values({
      email: 'staff@test.com', passwordHash: 'hash', name: 'Staff', role: 'dock_staff', createdAt: now,
    }).run();
    db.insert(schema.users).values({
      email: 'boater@test.com', passwordHash: 'hash', name: 'Boater', role: 'boater', createdAt: now,
    }).run();

    db.insert(schema.docks).values({
      name: 'Dock A', description: 'Small', sizeCategory: 'small', minLength: 20, maxLength: 30,
    }).run();

    db.insert(schema.slips).values({
      dockId: 1, number: 'A-01', maxLength: 25, maxBeam: 10, maxDraft: 5,
      status: 'available', priceDaily: 50, priceMonthly: 800,
    }).run();
    db.insert(schema.slips).values({
      dockId: 1, number: 'A-02', maxLength: 40, maxBeam: 15, maxDraft: 8,
      status: 'available', priceDaily: 75, priceMonthly: 1200,
    }).run();

    db.insert(schema.vessels).values({
      ownerId: 3, name: 'Sea Breeze', type: 'Sailboat', loa: 24, beam: 8, draft: 4, createdAt: now,
    }).run();
    db.insert(schema.vessels).values({
      ownerId: 3, name: 'Big Yacht', type: 'Motor Yacht', loa: 35, beam: 12, draft: 6, createdAt: now,
    }).run();
  });

  afterAll(() => {
    getSqlite().close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(adminSession as any);
  });

  describe('createBooking', () => {
    it('creates a transient booking successfully', async () => {
      const result = await createBooking({
        slipId: 1, vesselId: 1, boaterId: 3,
        type: 'transient', startDate: '2026-04-01', endDate: '2026-04-06',
      });
      expect(result.success).toBe(true);
      expect(result.booking).toBeDefined();
      expect(result.booking!.totalPrice).toBe(250);
      expect(result.booking!.status).toBe('pending');
    });

    it('creates a seasonal booking successfully', async () => {
      const result = await createBooking({
        slipId: 2, vesselId: 1, boaterId: 3,
        type: 'seasonal', startDate: '2026-06-01', endDate: '2026-09-01',
      });
      expect(result.success).toBe(true);
      expect(result.booking!.totalPrice).toBe(3600);
    });

    it('rejects oversized vessel', async () => {
      const result = await createBooking({
        slipId: 1, vesselId: 2, boaterId: 3,
        type: 'transient', startDate: '2026-05-01', endDate: '2026-05-05',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('does not fit');
      expect(result.reasons).toBeDefined();
      expect(result.reasons!.length).toBeGreaterThan(0);
    });

    it('prevents double-booking (overlapping dates on same slip)', async () => {
      const result = await createBooking({
        slipId: 1, vesselId: 1, boaterId: 3,
        type: 'transient', startDate: '2026-04-03', endDate: '2026-04-08',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('already booked');
    });

    it('allows booking on checkout day (hotel convention)', async () => {
      const result = await createBooking({
        slipId: 1, vesselId: 1, boaterId: 3,
        type: 'transient', startDate: '2026-04-06', endDate: '2026-04-10',
      });
      expect(result.success).toBe(true);
    });

    it('rejects unauthorized boater', async () => {
      mockGetSession.mockResolvedValue(boaterSession as any);
      const result = await createBooking({
        slipId: 2, vesselId: 1, boaterId: 3,
        type: 'transient', startDate: '2026-07-01', endDate: '2026-07-05',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });
  });

  describe('updateBookingStatus', () => {
    let pendingBookingId: number;

    beforeAll(async () => {
      mockGetSession.mockResolvedValue(adminSession as any);
      // Insert directly to avoid mock timing issues
      const now = new Date().toISOString();
      const sqliteDb = getSqlite();
      sqliteDb.exec(`
        INSERT INTO bookings (slip_id, vessel_id, boater_id, type, status, start_date, end_date, total_price, created_at, updated_at)
        VALUES (2, 1, 3, 'transient', 'pending', '2026-08-01', '2026-08-05', 300, '${now}', '${now}')
      `);
      const row = sqliteDb.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
      pendingBookingId = row.id;
    });

    it('pending -> confirmed succeeds and slip becomes reserved', async () => {
      const result = await updateBookingStatus(pendingBookingId, 'confirmed');
      expect(result.success).toBe(true);
      expect(result.booking!.status).toBe('confirmed');

      const slip = await db.query.slips.findFirst({ where: eq(schema.slips.id, 2) });
      expect(slip!.status).toBe('reserved');
    });

    it('confirmed -> checked_in succeeds and slip becomes occupied', async () => {
      const result = await updateBookingStatus(pendingBookingId, 'checked_in');
      expect(result.success).toBe(true);

      const slip = await db.query.slips.findFirst({ where: eq(schema.slips.id, 2) });
      expect(slip!.status).toBe('occupied');
    });

    it('checked_in -> checked_out succeeds and slip becomes available', async () => {
      const result = await updateBookingStatus(pendingBookingId, 'checked_out');
      expect(result.success).toBe(true);

      const slip = await db.query.slips.findFirst({ where: eq(schema.slips.id, 2) });
      expect(slip!.status).toBe('available');
    });

    it('rejects invalid transition (pending -> checked_in)', async () => {
      mockGetSession.mockResolvedValue(adminSession as any);
      const created = await createBooking({
        slipId: 2, vesselId: 1, boaterId: 3,
        type: 'transient', startDate: '2026-09-01', endDate: '2026-09-05',
      });
      const result = await updateBookingStatus(created.booking!.id, 'checked_in');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot transition');
    });
  });

  describe('arrivals and departures queries', () => {
    const today = format(new Date(), 'yyyy-MM-dd');

    beforeAll(() => {
      const now = new Date().toISOString();
      const sqliteDb = getSqlite();

      sqliteDb.exec(`
        INSERT INTO bookings (slip_id, vessel_id, boater_id, type, status, start_date, end_date, total_price, created_at, updated_at)
        VALUES (1, 1, 3, 'transient', 'confirmed', '${today}', '2026-12-30', 350, '${now}', '${now}')
      `);

      sqliteDb.exec(`
        INSERT INTO bookings (slip_id, vessel_id, boater_id, type, status, start_date, end_date, total_price, created_at, updated_at)
        VALUES (2, 1, 3, 'transient', 'checked_in', '2026-01-01', '${today}', 350, '${now}', '${now}')
      `);
    });

    it('getTodayArrivals returns confirmed bookings starting today', async () => {
      const arrivals = await getTodayArrivals();
      expect(arrivals.length).toBeGreaterThanOrEqual(1);
      const todayArrival = arrivals.find(a => a.startDate === today);
      expect(todayArrival).toBeDefined();
      expect(todayArrival!.status).toBe('confirmed');
    });

    it('getTodayDepartures returns checked_in bookings ending today', async () => {
      const departures = await getTodayDepartures();
      expect(departures.length).toBeGreaterThanOrEqual(1);
      const todayDeparture = departures.find(d => d.endDate === today);
      expect(todayDeparture).toBeDefined();
      expect(todayDeparture!.status).toBe('checked_in');
    });
  });
});
