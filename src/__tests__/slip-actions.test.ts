import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
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
  // Expose sqlite handle for table creation
  (db as any).__sqlite = sqlite;
  return { db };
});
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Import after mocks
import { getSlipsWithDetails } from '@/lib/dal/slips';
import { changeSlipStatus } from '@/app/actions/slip-actions';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';

const mockGetSession = vi.mocked(getSession);
const mockRevalidatePath = vi.mocked(revalidatePath);

// Access the underlying sqlite handle from our mock
const testDb = db;
const getSqlite = () => (db as any).__sqlite as import('better-sqlite3').Database;

describe('Slip DAL and Server Actions', () => {
  beforeAll(() => {
    const sqlite = getSqlite();
    // Create all required tables
    sqlite.exec(`
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

    // Seed test data
    const now = new Date().toISOString();

    testDb.insert(schema.users).values({
      email: 'boater@test.com',
      passwordHash: 'hash',
      name: 'Test Boater',
      role: 'boater',
      createdAt: now,
    }).run();

    testDb.insert(schema.docks).values({
      name: 'Dock A',
      description: 'Small boats',
      sizeCategory: 'small',
      minLength: 20,
      maxLength: 30,
    }).run();

    testDb.insert(schema.slips).values([
      {
        dockId: 1,
        number: 'A-01',
        maxLength: 25,
        maxBeam: 10,
        maxDraft: 5,
        status: 'occupied',
        priceDaily: 50,
        priceMonthly: 800,
      },
      {
        dockId: 1,
        number: 'A-02',
        maxLength: 25,
        maxBeam: 10,
        maxDraft: 5,
        status: 'available',
        priceDaily: 50,
        priceMonthly: 800,
      },
    ]).run();

    testDb.insert(schema.vessels).values({
      ownerId: 1,
      name: 'Sea Breeze',
      type: 'Sailboat',
      loa: 24,
      beam: 8,
      draft: 4,
      createdAt: now,
    }).run();

    testDb.insert(schema.bookings).values({
      slipId: 1,
      vesselId: 1,
      boaterId: 1,
      type: 'transient',
      status: 'checked_in',
      startDate: '2026-03-20',
      endDate: '2026-03-27',
      totalPrice: 350,
      createdAt: now,
      updatedAt: now,
    }).run();
  });

  afterAll(() => {
    getSqlite().close();
  });

  describe('getSlipsWithDetails', () => {
    it('returns slips with dock relation', async () => {
      const slips = await getSlipsWithDetails();
      expect(slips.length).toBe(2);
      expect(slips[0].dock).toBeDefined();
      expect(slips[0].dock.name).toBe('Dock A');
    });

    it('returns slips with booking and vessel relations', async () => {
      const slips = await getSlipsWithDetails();
      const occupiedSlip = slips.find((s) => s.number === 'A-01')!;
      expect(occupiedSlip.bookings.length).toBeGreaterThan(0);
      expect(occupiedSlip.bookings[0].vessel).toBeDefined();
      expect(occupiedSlip.bookings[0].vessel.name).toBe('Sea Breeze');
    });

    it('returns slips with boater relation on bookings', async () => {
      const slips = await getSlipsWithDetails();
      const occupiedSlip = slips.find((s) => s.number === 'A-01')!;
      expect(occupiedSlip.bookings[0].boater).toBeDefined();
      expect(occupiedSlip.bookings[0].boater.name).toBe('Test Boater');
    });
  });

  describe('changeSlipStatus', () => {
    it('updates slip status when called by admin', async () => {
      mockGetSession.mockResolvedValue({
        userId: 1,
        email: 'admin@test.com',
        name: 'Admin',
        role: 'admin',
        isLoggedIn: true,
      } as any);

      await changeSlipStatus(2, 'maintenance', 'Needs repair');

      const slip = await testDb.query.slips.findFirst({
        where: eq(schema.slips.id, 2),
      });
      expect(slip!.status).toBe('maintenance');
      expect(slip!.notes).toBe('Needs repair');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/marina');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/staff/operations');
    });

    it('updates slip status when called by dock_staff', async () => {
      mockGetSession.mockResolvedValue({
        userId: 2,
        email: 'dock@test.com',
        name: 'Dock Staff',
        role: 'dock_staff',
        isLoggedIn: true,
      } as any);

      await changeSlipStatus(2, 'available');

      const slip = await testDb.query.slips.findFirst({
        where: eq(schema.slips.id, 2),
      });
      expect(slip!.status).toBe('available');
      expect(slip!.notes).toBeNull();
    });

    it('throws Unauthorized for boater role', async () => {
      mockGetSession.mockResolvedValue({
        userId: 3,
        email: 'boater@test.com',
        name: 'Boater',
        role: 'boater',
        isLoggedIn: true,
      } as any);

      await expect(changeSlipStatus(1, 'maintenance')).rejects.toThrow('Unauthorized');
    });

    it('throws Unauthorized when not logged in', async () => {
      mockGetSession.mockResolvedValue({
        isLoggedIn: false,
      } as any);

      await expect(changeSlipStatus(1, 'maintenance')).rejects.toThrow('Unauthorized');
    });
  });
});
