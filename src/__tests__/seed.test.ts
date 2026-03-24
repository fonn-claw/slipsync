import { describe, it, expect, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import * as schema from '@/db/schema';
import { seed } from '@/db/seed';

const { users, docks, slips, vessels, bookings, waitlist, maintenanceRequests } = schema;

// Use a separate test database
const testDbPath = path.join(process.cwd(), 'data', 'test-slipsync.db');

let db: ReturnType<typeof drizzle>;

beforeAll(async () => {
  // Clean up any existing test database
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const sqlite = new Database(testDbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  db = drizzle(sqlite, { schema });

  // Create tables by running drizzle-kit push equivalent (create tables from schema)
  // We use raw SQL since drizzle-kit push requires a CLI
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS docks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      size_category TEXT NOT NULL,
      min_length REAL NOT NULL,
      max_length REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS slips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dock_id INTEGER NOT NULL REFERENCES docks(id),
      number TEXT NOT NULL UNIQUE,
      max_length REAL NOT NULL,
      max_beam REAL NOT NULL,
      max_draft REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      price_daily REAL NOT NULL,
      price_monthly REAL NOT NULL,
      has_electric INTEGER NOT NULL DEFAULT 1,
      has_water INTEGER NOT NULL DEFAULT 1,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS vessels (
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
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slip_id INTEGER NOT NULL REFERENCES slips(id),
      vessel_id INTEGER NOT NULL REFERENCES vessels(id),
      boater_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      total_price REAL NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boater_id INTEGER NOT NULL REFERENCES users(id),
      vessel_id INTEGER NOT NULL REFERENCES vessels(id),
      preferred_dock TEXT,
      min_length REAL,
      requested_start TEXT,
      requested_end TEXT,
      status TEXT NOT NULL DEFAULT 'waiting',
      priority INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS maintenance_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slip_id INTEGER NOT NULL REFERENCES slips(id),
      reported_by INTEGER NOT NULL REFERENCES users(id),
      assigned_to INTEGER REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );
  `);

  // Run seed with our test db instance
  await seed(db);
});

describe('seed data', () => {
  it('demo accounts - three demo accounts exist with correct bcrypt passwords', () => {
    const allUsers = db.select().from(users).all();
    const admin = allUsers.find((u) => u.email === 'admin@slipsync.app');
    const dockStaff = allUsers.find((u) => u.email === 'dock@slipsync.app');
    const boater = allUsers.find((u) => u.email === 'boater@slipsync.app');

    expect(admin).toBeDefined();
    expect(dockStaff).toBeDefined();
    expect(boater).toBeDefined();

    expect(admin!.role).toBe('admin');
    expect(dockStaff!.role).toBe('dock_staff');
    expect(boater!.role).toBe('boater');

    // Verify bcrypt hashes validate against "demo1234"
    expect(bcrypt.compareSync('demo1234', admin!.passwordHash)).toBe(true);
    expect(bcrypt.compareSync('demo1234', dockStaff!.passwordHash)).toBe(true);
    expect(bcrypt.compareSync('demo1234', boater!.passwordHash)).toBe(true);
  });

  it('marina structure - exactly 4 docks and 60 slips with correct distribution', () => {
    const allDocks = db.select().from(docks).all();
    expect(allDocks).toHaveLength(4);

    const dockNames = allDocks.map((d) => d.name).sort();
    expect(dockNames).toEqual(['A', 'B', 'C', 'D']);

    const allSlips = db.select().from(slips).all();
    expect(allSlips).toHaveLength(60);

    // Verify slip count per dock
    for (const dock of allDocks) {
      const dockSlips = allSlips.filter((s) => s.dockId === dock.id);
      if (dock.name === 'A') expect(dockSlips).toHaveLength(20);
      if (dock.name === 'B') expect(dockSlips).toHaveLength(15);
      if (dock.name === 'C') expect(dockSlips).toHaveLength(15);
      if (dock.name === 'D') expect(dockSlips).toHaveLength(10);
    }
  });

  it('boaters - between 15 and 20 boater users each with at least 1 vessel', () => {
    const boaters = db.select().from(users).where(eq(users.role, 'boater')).all();
    expect(boaters.length).toBeGreaterThanOrEqual(15);
    expect(boaters.length).toBeLessThanOrEqual(20);

    // Each boater should have at least 1 vessel
    for (const boater of boaters) {
      const boaterVessels = db
        .select()
        .from(vessels)
        .where(eq(vessels.ownerId, boater.id))
        .all();
      expect(boaterVessels.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('status distribution - approximately 40% occupied, 20% reserved, 30% available, 10% maintenance', () => {
    const allSlips = db.select().from(slips).all();
    const occupied = allSlips.filter((s) => s.status === 'occupied').length;
    const reserved = allSlips.filter((s) => s.status === 'reserved').length;
    const available = allSlips.filter((s) => s.status === 'available').length;
    const maintenance = allSlips.filter((s) => s.status === 'maintenance').length;

    // Allow some flexibility: occupied 22-26, reserved 10-14, available 16-20, maintenance 4-8
    expect(occupied).toBeGreaterThanOrEqual(22);
    expect(occupied).toBeLessThanOrEqual(26);
    expect(reserved).toBeGreaterThanOrEqual(10);
    expect(reserved).toBeLessThanOrEqual(14);
    expect(available).toBeGreaterThanOrEqual(16);
    expect(available).toBeLessThanOrEqual(20);
    expect(maintenance).toBeGreaterThanOrEqual(4);
    expect(maintenance).toBeLessThanOrEqual(8);
  });

  it('relative dates - all booking dates are within 180 days of today', () => {
    const allBookings = db.select().from(bookings).all();
    expect(allBookings.length).toBeGreaterThan(0);

    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() - 180);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 180);

    for (const booking of allBookings) {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);

      expect(start.getTime()).toBeGreaterThanOrEqual(minDate.getTime());
      expect(start.getTime()).toBeLessThanOrEqual(maxDate.getTime());
      expect(end.getTime()).toBeGreaterThanOrEqual(minDate.getTime());
      expect(end.getTime()).toBeLessThanOrEqual(maxDate.getTime());
    }
  });

  it('waitlist and maintenance - correct counts and mixed statuses', () => {
    const waitlistEntries = db.select().from(waitlist).all();
    expect(waitlistEntries.length).toBeGreaterThanOrEqual(3);

    const maintenanceEntries = db.select().from(maintenanceRequests).all();
    expect(maintenanceEntries.length).toBeGreaterThanOrEqual(4);

    // Check for mixed maintenance statuses
    const statuses = maintenanceEntries.map((m) => m.status);
    expect(statuses).toContain('open');
    expect(statuses).toContain('in_progress');
    expect(statuses).toContain('completed');
  });

  it('boater demo account has vessels - Sarah Chen has 2 vessels and 1 active booking', () => {
    const sarah = db
      .select()
      .from(users)
      .where(eq(users.email, 'boater@slipsync.app'))
      .all()[0];
    expect(sarah).toBeDefined();
    expect(sarah.name).toBe('Sarah Chen');

    // Exactly 2 vessels
    const sarahVessels = db
      .select()
      .from(vessels)
      .where(eq(vessels.ownerId, sarah.id))
      .all();
    expect(sarahVessels).toHaveLength(2);

    const vesselNames = sarahVessels.map((v) => v.name).sort();
    expect(vesselNames).toContain('Sea Breeze');
    expect(vesselNames).toContain('Harbor Light');

    // At least 1 active booking (checked_in or confirmed)
    const sarahBookings = db
      .select()
      .from(bookings)
      .where(eq(bookings.boaterId, sarah.id))
      .all();

    const activeBookings = sarahBookings.filter(
      (b) => b.status === 'confirmed' || b.status === 'checked_in'
    );
    expect(activeBookings.length).toBeGreaterThanOrEqual(1);
  });
});
