import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ── Users ──────────────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['admin', 'dock_staff', 'boater'] }).notNull(),
  phone: text('phone'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ── Docks ──────────────────────────────────────────────────────────────────
export const docks = sqliteTable('docks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  sizeCategory: text('size_category', { enum: ['small', 'medium', 'large', 'extra_large'] }).notNull(),
  minLength: real('min_length').notNull(),
  maxLength: real('max_length').notNull(),
});

// ── Slips ──────────────────────────────────────────────────────────────────
export const slips = sqliteTable('slips', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dockId: integer('dock_id').notNull().references(() => docks.id),
  number: text('number').notNull().unique(),
  maxLength: real('max_length').notNull(),
  maxBeam: real('max_beam').notNull(),
  maxDraft: real('max_draft').notNull(),
  status: text('status', { enum: ['available', 'occupied', 'reserved', 'maintenance'] }).notNull().default('available'),
  priceDaily: real('price_daily').notNull(),
  priceMonthly: real('price_monthly').notNull(),
  hasElectric: integer('has_electric', { mode: 'boolean' }).notNull().default(true),
  hasWater: integer('has_water', { mode: 'boolean' }).notNull().default(true),
  notes: text('notes'),
});

// ── Vessels ────────────────────────────────────────────────────────────────
export const vessels = sqliteTable('vessels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  type: text('type').notNull(),
  loa: real('loa').notNull(),
  beam: real('beam').notNull(),
  draft: real('draft').notNull(),
  registrationNumber: text('registration_number'),
  year: integer('year'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ── Bookings ───────────────────────────────────────────────────────────────
export const bookings = sqliteTable('bookings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slipId: integer('slip_id').notNull().references(() => slips.id),
  vesselId: integer('vessel_id').notNull().references(() => vessels.id),
  boaterId: integer('boater_id').notNull().references(() => users.id),
  type: text('type', { enum: ['transient', 'seasonal'] }).notNull(),
  status: text('status', { enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'] }).notNull().default('pending'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  totalPrice: real('total_price').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ── Waitlist ───────────────────────────────────────────────────────────────
export const waitlist = sqliteTable('waitlist', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  boaterId: integer('boater_id').notNull().references(() => users.id),
  vesselId: integer('vessel_id').notNull().references(() => vessels.id),
  preferredDock: text('preferred_dock'),
  minLength: real('min_length'),
  requestedStart: text('requested_start'),
  requestedEnd: text('requested_end'),
  status: text('status', { enum: ['waiting', 'offered', 'accepted', 'expired'] }).notNull().default('waiting'),
  priority: integer('priority').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ── Maintenance Requests ───────────────────────────────────────────────────
export const maintenanceRequests = sqliteTable('maintenance_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slipId: integer('slip_id').notNull().references(() => slips.id),
  reportedBy: integer('reported_by').notNull().references(() => users.id),
  assignedTo: integer('assigned_to').references(() => users.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] }).notNull().default('medium'),
  status: text('status', { enum: ['open', 'in_progress', 'completed', 'cancelled'] }).notNull().default('open'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  resolvedAt: text('resolved_at'),
});

// ── Relations ──────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  vessels: many(vessels),
  bookings: many(bookings),
  waitlistEntries: many(waitlist),
  reportedMaintenance: many(maintenanceRequests),
}));

export const docksRelations = relations(docks, ({ many }) => ({
  slips: many(slips),
}));

export const slipsRelations = relations(slips, ({ one, many }) => ({
  dock: one(docks, { fields: [slips.dockId], references: [docks.id] }),
  bookings: many(bookings),
  maintenanceRequests: many(maintenanceRequests),
}));

export const vesselsRelations = relations(vessels, ({ one, many }) => ({
  owner: one(users, { fields: [vessels.ownerId], references: [users.id] }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  slip: one(slips, { fields: [bookings.slipId], references: [slips.id] }),
  vessel: one(vessels, { fields: [bookings.vesselId], references: [vessels.id] }),
  boater: one(users, { fields: [bookings.boaterId], references: [users.id] }),
}));

export const waitlistRelations = relations(waitlist, ({ one }) => ({
  boater: one(users, { fields: [waitlist.boaterId], references: [users.id] }),
  vessel: one(vessels, { fields: [waitlist.vesselId], references: [vessels.id] }),
}));

export const maintenanceRequestsRelations = relations(maintenanceRequests, ({ one }) => ({
  slip: one(slips, { fields: [maintenanceRequests.slipId], references: [slips.id] }),
  reporter: one(users, { fields: [maintenanceRequests.reportedBy], references: [users.id] }),
}));
