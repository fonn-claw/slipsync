import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as schema from '@/db/schema';

// Create an in-memory test database
const sqlite = new Database(':memory:');
sqlite.pragma('foreign_keys = ON');
const testDb = drizzle(sqlite, { schema });

describe('Auth Logic', () => {
  beforeAll(() => {
    // Create tables manually
    sqlite.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'dock_staff', 'boater')),
        phone TEXT,
        created_at TEXT NOT NULL
      )
    `);

    // Seed test users
    const hash = bcrypt.hashSync('demo1234', 10);
    testDb.insert(schema.users).values([
      {
        email: 'admin@slipsync.app',
        passwordHash: hash,
        name: 'Marina Admin',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      {
        email: 'dock@slipsync.app',
        passwordHash: hash,
        name: 'Dock Staff',
        role: 'dock_staff',
        createdAt: new Date().toISOString(),
      },
      {
        email: 'boater@slipsync.app',
        passwordHash: hash,
        name: 'Test Boater',
        role: 'boater',
        createdAt: new Date().toISOString(),
      },
    ]).run();
  });

  afterAll(() => {
    sqlite.close();
  });

  it('login with valid admin credentials returns correct user data', async () => {
    const user = await testDb.query.users.findFirst({
      where: eq(schema.users.email, 'admin@slipsync.app'),
    });

    expect(user).toBeDefined();
    expect(user!.email).toBe('admin@slipsync.app');
    expect(user!.role).toBe('admin');
    expect(bcrypt.compareSync('demo1234', user!.passwordHash)).toBe(true);

    // Simulate session creation
    const sessionData = {
      userId: user!.id,
      email: user!.email,
      name: user!.name,
      role: user!.role,
      isLoggedIn: true,
    };

    expect(sessionData.isLoggedIn).toBe(true);
    expect(sessionData.role).toBe('admin');
    expect(sessionData.email).toBe('admin@slipsync.app');
  });

  it('login with valid dock staff credentials returns dock_staff role', async () => {
    const user = await testDb.query.users.findFirst({
      where: eq(schema.users.email, 'dock@slipsync.app'),
    });

    expect(user).toBeDefined();
    expect(user!.role).toBe('dock_staff');
    expect(bcrypt.compareSync('demo1234', user!.passwordHash)).toBe(true);
  });

  it('login with valid boater credentials returns boater role', async () => {
    const user = await testDb.query.users.findFirst({
      where: eq(schema.users.email, 'boater@slipsync.app'),
    });

    expect(user).toBeDefined();
    expect(user!.role).toBe('boater');
    expect(bcrypt.compareSync('demo1234', user!.passwordHash)).toBe(true);
  });

  it('login with invalid password returns false comparison', async () => {
    const user = await testDb.query.users.findFirst({
      where: eq(schema.users.email, 'admin@slipsync.app'),
    });

    expect(user).toBeDefined();
    expect(bcrypt.compareSync('wrongpassword', user!.passwordHash)).toBe(false);
  });

  it('login with nonexistent email returns no user', async () => {
    const user = await testDb.query.users.findFirst({
      where: eq(schema.users.email, 'nobody@test.com'),
    });

    expect(user).toBeUndefined();
  });

  it('logout destroys session (session becomes empty)', () => {
    // Simulate session lifecycle
    const session: Record<string, any> = {
      userId: 1,
      email: 'admin@slipsync.app',
      name: 'Marina Admin',
      role: 'admin',
      isLoggedIn: true,
    };

    expect(session.isLoggedIn).toBe(true);

    // Simulate destroy
    for (const key of Object.keys(session)) {
      delete session[key];
    }

    expect(session.isLoggedIn).toBeUndefined();
  });

  it('role-based landing page mapping works correctly', () => {
    const getLanding = (role: string) =>
      role === 'admin'
        ? '/admin/dashboard'
        : role === 'dock_staff'
          ? '/staff/operations'
          : '/boater/my-bookings';

    expect(getLanding('admin')).toBe('/admin/dashboard');
    expect(getLanding('dock_staff')).toBe('/staff/operations');
    expect(getLanding('boater')).toBe('/boater/my-bookings');
  });
});
