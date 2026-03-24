# Phase 1: Foundation & Data Layer - Research

**Researched:** 2026-03-24
**Domain:** Database schema (Drizzle/SQLite), authentication (iron-session), seed data, base layouts (Next.js App Router + shadcn/ui nautical theme)
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire foundation: database schema with Drizzle ORM on SQLite, cookie-based auth with iron-session, comprehensive seed data with relative dates, and role-scoped layouts with a nautical theme. All decisions are locked in CONTEXT.md -- iron-session for auth, route groups for role layouts, CSS custom properties for theming, light mode only.

The stack is well-established and well-documented. Next.js 16.2.1 with App Router, Drizzle ORM 0.45.1 with better-sqlite3 12.8.0, and iron-session 8.0.4 are all current stable releases. shadcn/ui with Tailwind v4.2.2 uses OKLCH color variables with the `@theme inline` directive. The primary risk area is getting the iron-session middleware pattern right for role-based routing across three route groups.

**Primary recommendation:** Build in strict order -- database connection and schema first, then auth (iron-session + middleware), then seed script, then layouts and theme. Each layer depends on the previous one.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- iron-session with httpOnly cookies for session management -- simplest secure approach for demo accounts
- Login via Next.js Server Action with redirect -- no client-side auth state management needed
- Middleware-based route protection with role checks -- centralized enforcement at the API layer
- Standard login form -- no quick-switch UI or magic links needed
- Three demo accounts seeded: admin@slipsync.app, dock@slipsync.app, boater@slipsync.app (all password: demo1234)
- Navy/teal/seafoam color palette implemented as CSS custom properties extending shadcn/ui theme
- Light mode only -- optimized for LinkedIn screenshots and demo presentations
- Inter font for body text, system font stack fallback
- Subtle shadows with rounded corners, seafoam accent highlights on interactive elements
- shadcn/ui components customized via CSS variables, not component overrides
- Three Next.js route groups: (admin), (staff), (boater) with shared layout shells per role
- Admin and staff: sidebar navigation with marina branding at top
- Boater portal: top navigation bar with horizontal links
- Collapsible sidebar on tablet, hamburger menu on mobile
- Post-login landing pages: admin -> dashboard placeholder, staff -> marina map placeholder, boater -> my bookings placeholder
- All dates relative to Date.now() -- demo always looks current whenever seed runs
- Auto-seed on first run if database is empty
- Realistic boater names with nautical-themed vessel names
- Revenue data derived from booking history with rate variations by slip size/dock
- Slip dimensions follow realistic marina standards per dock categories
- Status distribution: ~40% occupied, ~20% reserved upcoming, ~30% available, ~10% maintenance

### Claude's Discretion
- Exact Drizzle schema column types and index choices
- Specific seed data names and vessel details
- Loading state and error boundary implementation
- Exact sidebar width and navigation icon choices

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can log in with email and password | iron-session 8.0.4 with `getIronSession()` in Server Actions; bcrypt for password hashing; login form submits to Server Action |
| AUTH-02 | User session persists across browser refresh | iron-session uses encrypted httpOnly cookies -- persistence is automatic across refreshes |
| AUTH-03 | User can log out from any page | Server Action that destroys session via `session.destroy()` + redirect to login |
| AUTH-04 | Role-based access control enforced at middleware layer | Next.js middleware.ts reads session cookie, checks role against route pattern, redirects unauthorized |
| AUTH-05 | Three demo accounts seeded | Seed script creates admin/dock_staff/boater users with bcrypt-hashed "demo1234" passwords |
| SLIP-01 | Each slip has defined dimensions (length, beam, draft capacity) | Drizzle schema with `max_length`, `max_beam`, `max_draft` real columns on slips table |
| SLIP-02 | Slips organized by dock with size categories | Docks table with size category; slips FK to dock; 4 docks with 20/15/15/10 slips |
| SEED-01 | Seed script creates marina with 4 docks and 60 slips | Seed function with dock/slip data arrays, realistic dimensions per dock category |
| SEED-02 | 15-20 boater accounts with registered vessels | Seed generates boater users with associated vessel records |
| SEED-03 | Mix of slip statuses: ~40% occupied, ~20% reserved, ~30% available, ~10% maintenance | Seed distributes bookings and status flags to match target percentages |
| SEED-04 | Historical bookings going back 3 months (relative dates) | All dates computed from `Date.now()` using helper functions like `daysFromNow()` |
| SEED-05 | Waitlist entries and maintenance requests in various states | Seed creates waitlist and maintenance_request records with mixed statuses |
| UX-01 | Ocean/nautical color palette | OKLCH CSS custom properties for navy/teal/seafoam extending shadcn/ui theme variables |
| UX-02 | Clean, modern, professional UI using shadcn/ui | shadcn/ui CLI v4 with Tailwind v4.2, components added via `npx shadcn@latest add` |
| UX-03 | Responsive design -- works on desktop and tablet | Route group layouts with collapsible sidebar (tablet), hamburger menu (mobile) |
</phase_requirements>

## Standard Stack

### Core (Phase 1 specific)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.1 | Full-stack framework | App Router, Server Actions, middleware, route groups |
| React | 19 | UI rendering | Ships with Next.js 16; Server Components for data fetching |
| TypeScript | 5.x | Type safety | End-to-end types with Drizzle and Zod |
| Drizzle ORM | 0.45.1 | Database access | Type-safe SQL, lightweight, excellent SQLite support |
| better-sqlite3 | 12.8.0 | SQLite driver | Synchronous API, zero config, file-based DB |
| drizzle-kit | 0.31.10 | Schema management | `drizzle-kit push` for rapid iteration |
| iron-session | 8.0.4 | Session management | Encrypted stateless cookies, single `getIronSession()` API |
| Tailwind CSS | 4.2.2 | Utility CSS | CSS-first config, OKLCH colors, `@theme inline` |
| shadcn/ui | latest (CLI v4) | Component library | Copies into project, professional, Radix primitives |
| Lucide React | 1.0.1 | Icons | Default shadcn/ui icon set, tree-shakeable |
| Zod | 4.3.6 | Validation | Form + Server Action validation, Drizzle type inference |
| date-fns | 4.1.0 | Date utilities | Seed script relative date computation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| bcrypt / bcryptjs | latest | Password hashing | Hashing demo account passwords in seed, verifying on login |
| @hookform/resolvers | 5.2.2 | Form validation bridge | Connecting Zod schemas to React Hook Form |
| react-hook-form | 7.72.0 | Form management | Login form (and all future forms) |

**Installation (Phase 1):**
```bash
# Project init
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir

# Database
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3

# Auth
npm install iron-session bcryptjs
npm install -D @types/bcryptjs

# UI (shadcn components added via CLI)
npx shadcn@latest init
npx shadcn@latest add button card input label form sidebar sheet avatar dropdown-menu separator badge

# Icons
npm install lucide-react

# Validation & Forms
npm install zod react-hook-form @hookform/resolvers

# Date handling
npm install date-fns

# Dev
npm install -D prettier prettier-plugin-tailwindcss tsx
```

## Architecture Patterns

### Recommended Project Structure (Phase 1)
```
src/
  app/
    layout.tsx                  -- Root layout (Inter font, theme)
    page.tsx                    -- Redirect to /login or role landing
    globals.css                 -- Tailwind + nautical OKLCH theme tokens
    middleware.ts               -- Auth + role-based route gating
    (auth)/
      login/page.tsx            -- Login form
    (admin)/
      layout.tsx                -- Sidebar layout shell
      dashboard/page.tsx        -- Placeholder "Dashboard coming soon"
    (staff)/
      layout.tsx                -- Sidebar layout shell (dock staff)
      operations/page.tsx       -- Placeholder "Marina map coming soon"
    (boater)/
      layout.tsx                -- Top nav layout shell
      my-bookings/page.tsx      -- Placeholder "My bookings coming soon"
  components/
    ui/                         -- shadcn/ui components
    layouts/
      admin-sidebar.tsx         -- Admin sidebar nav component
      staff-sidebar.tsx         -- Staff sidebar nav component
      boater-navbar.tsx         -- Boater top navigation
      marina-logo.tsx           -- Branding component (anchor/wave icon)
  lib/
    auth.ts                     -- getSession(), login(), logout() helpers
    dal/                        -- Data Access Layer (empty shell, populated in later phases)
  db/
    index.ts                    -- Database connection (better-sqlite3 + Drizzle)
    schema.ts                   -- All table definitions
    seed.ts                     -- Demo data generation
data/
  slipsync.db                   -- SQLite file (gitignored)
drizzle.config.ts               -- Drizzle configuration
```

### Pattern 1: iron-session with Server Actions
**What:** Single `getSession()` helper that wraps `getIronSession()` with typed session data. Used in middleware, Server Actions, and Server Components.
**When to use:** Every auth check.
**Example:**
```typescript
// src/lib/auth.ts
import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  userId: number;
  email: string;
  name: string;
  role: 'admin' | 'dock_staff' | 'boater';
  isLoggedIn: boolean;
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'slipsync-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function login(email: string, password: string) {
  // Verify credentials against DB, then:
  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.role = user.role;
  session.isLoggedIn = true;
  await session.save();
}

export async function logout() {
  const session = await getSession();
  session.destroy();
}
```
**Source:** [iron-session npm](https://www.npmjs.com/package/iron-session), [iron-session GitHub examples](https://github.com/vvo/iron-session/blob/main/examples/next/src/middleware.ts)

### Pattern 2: Middleware Route Protection with Role Mapping
**What:** Next.js middleware reads session cookie, maps route patterns to required roles, redirects unauthorized users.
**When to use:** Every protected route.
**Example:**
```typescript
// src/app/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData } from '@/lib/auth';

const roleRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
  '/staff': ['admin', 'dock_staff'],
  '/boater': ['admin', 'boater'],
};

export async function middleware(request: NextRequest) {
  const session = await getIronSession<SessionData>(
    request.cookies as any,
    sessionOptions
  );

  // Public routes
  if (request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  // Not logged in -> redirect to login
  if (!session.isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role check
  for (const [prefix, allowedRoles] of Object.entries(roleRoutes)) {
    if (request.nextUrl.pathname.startsWith(prefix)) {
      if (!allowedRoles.includes(session.role)) {
        // Redirect to their own landing page
        const landing = session.role === 'admin' ? '/admin/dashboard'
          : session.role === 'dock_staff' ? '/staff/operations'
          : '/boater/my-bookings';
        return NextResponse.redirect(new URL(landing, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
```
**Source:** [Next.js Authentication Guide](https://nextjs.org/docs/app/building-your-application/authentication), [iron-session middleware example](https://github.com/vvo/iron-session/blob/main/examples/next/src/middleware.ts)

### Pattern 3: Drizzle SQLite Schema with Relations
**What:** All tables defined in a single schema file with Drizzle's relational API for type-safe joins.
**When to use:** Database schema definition.
**Example:**
```typescript
// src/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['admin', 'dock_staff', 'boater'] }).notNull(),
  phone: text('phone'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const docks = sqliteTable('docks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(), // A, B, C, D
  description: text('description'),
  sizeCategory: text('size_category', { enum: ['small', 'medium', 'large', 'extra_large'] }).notNull(),
  minLength: real('min_length').notNull(),
  maxLength: real('max_length').notNull(),
});

export const slips = sqliteTable('slips', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dockId: integer('dock_id').notNull().references(() => docks.id),
  number: text('number').notNull().unique(), // e.g. "A-01"
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

export const vessels = sqliteTable('vessels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  type: text('type').notNull(), // sailboat, powerboat, catamaran, etc.
  loa: real('loa').notNull(), // length overall
  beam: real('beam').notNull(),
  draft: real('draft').notNull(),
  registrationNumber: text('registration_number'),
  year: integer('year'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const bookings = sqliteTable('bookings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slipId: integer('slip_id').notNull().references(() => slips.id),
  vesselId: integer('vessel_id').notNull().references(() => vessels.id),
  boaterId: integer('boater_id').notNull().references(() => users.id),
  type: text('type', { enum: ['transient', 'seasonal'] }).notNull(),
  status: text('status', { enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'] }).notNull().default('pending'),
  startDate: text('start_date').notNull(), // YYYY-MM-DD
  endDate: text('end_date').notNull(),     // YYYY-MM-DD
  totalPrice: real('total_price').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

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

// Relations
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
```
**Source:** [Drizzle ORM SQLite docs](https://orm.drizzle.team/docs/get-started/sqlite-new), [Drizzle column types](https://orm.drizzle.team/docs/column-types/sqlite)

### Pattern 4: OKLCH Nautical Theme via CSS Custom Properties
**What:** Override shadcn/ui CSS variables with navy/teal/seafoam OKLCH values. Use `@theme inline` to register with Tailwind v4.
**When to use:** globals.css setup.
**Example:**
```css
/* src/app/globals.css */
@import "tailwindcss";

:root {
  /* Navy-based neutrals */
  --background: oklch(0.98 0.005 230);
  --foreground: oklch(0.15 0.03 240);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.15 0.03 240);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.15 0.03 240);

  /* Teal primary */
  --primary: oklch(0.45 0.12 220);
  --primary-foreground: oklch(0.98 0.005 230);

  /* Seafoam secondary */
  --secondary: oklch(0.92 0.04 180);
  --secondary-foreground: oklch(0.25 0.06 220);

  /* Muted seafoam */
  --muted: oklch(0.94 0.02 200);
  --muted-foreground: oklch(0.45 0.03 220);

  /* Teal accent */
  --accent: oklch(0.88 0.06 180);
  --accent-foreground: oklch(0.20 0.06 220);

  --destructive: oklch(0.55 0.2 25);
  --destructive-foreground: oklch(0.98 0 0);

  --border: oklch(0.88 0.02 220);
  --input: oklch(0.88 0.02 220);
  --ring: oklch(0.45 0.12 220);
  --radius: 0.625rem;

  /* Sidebar - deep navy */
  --sidebar: oklch(0.20 0.05 240);
  --sidebar-foreground: oklch(0.92 0.02 220);
  --sidebar-primary: oklch(0.75 0.10 180);
  --sidebar-primary-foreground: oklch(0.15 0.03 240);
  --sidebar-accent: oklch(0.28 0.04 240);
  --sidebar-accent-foreground: oklch(0.92 0.02 220);
  --sidebar-border: oklch(0.30 0.04 240);
  --sidebar-ring: oklch(0.45 0.12 220);

  /* Chart colors - ocean palette */
  --chart-1: oklch(0.55 0.15 220);
  --chart-2: oklch(0.65 0.12 180);
  --chart-3: oklch(0.50 0.10 260);
  --chart-4: oklch(0.70 0.08 160);
  --chart-5: oklch(0.60 0.14 200);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```
**Source:** [shadcn/ui Theming](https://ui.shadcn.com/docs/theming), [shadcn/ui Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4)

### Anti-Patterns to Avoid
- **Client-side auth state:** Do NOT use React context or useState for auth. iron-session handles everything server-side via cookies. The session is read in middleware and Server Components.
- **Raw SQL queries:** Use Drizzle's typed query builder exclusively. Never use `db.run('SELECT ...')`.
- **Hardcoded dates in seed:** Every date must use a helper like `daysFromNow(n)` -- never `new Date('2026-03-20')`.
- **Separate API routes for internal data:** Server Components call the DAL directly. Server Actions handle mutations. No `/api/*` routes needed in Phase 1.
- **Multiple database connections:** Create one `db` instance in `src/db/index.ts` and import it everywhere.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session encryption | Custom JWT/encryption | iron-session `getIronSession()` | Handles encryption, serialization, cookie management in one call |
| Password hashing | Custom hash function | bcryptjs `hash()` / `compare()` | Battle-tested, constant-time comparison prevents timing attacks |
| Form state management | Custom useReducer forms | React Hook Form + Zod resolver | Handles validation, error display, submission state automatically |
| UI components | Custom buttons, inputs, cards | shadcn/ui components via CLI | Accessible, styled, consistent, saves hours |
| Date arithmetic | Manual date math | date-fns `addDays()`, `subDays()`, `format()` | Edge cases around month boundaries, DST, etc. |
| CSS class merging | Manual string concatenation | `cn()` utility from shadcn/ui (clsx + tailwind-merge) | Handles Tailwind class conflicts correctly |

## Common Pitfalls

### Pitfall 1: iron-session in Middleware Uses Different Cookie API
**What goes wrong:** `getIronSession()` requires `cookies()` from `next/headers` in Server Components/Actions, but middleware receives `request.cookies` which has a different API.
**Why it happens:** Next.js middleware runs on the Edge runtime where `cookies()` from `next/headers` works differently than in Server Components.
**How to avoid:** In middleware, pass the request/response cookies directly. The iron-session README shows the middleware pattern: `getIronSession<SessionData>(request.cookies as any, sessionOptions)` or use the request/response pair pattern. Test middleware auth check separately from Server Action auth check.
**Warning signs:** "cookies is not a function" errors in middleware.

### Pitfall 2: Seed Data Absolute Dates Going Stale
**What goes wrong:** Demo data uses hardcoded dates. A month later, all bookings are in the past and the app looks dead.
**Why it happens:** Faster to write `new Date('2026-04-01')` than compute relative dates.
**How to avoid:** Create a `daysFromNow(offset: number)` helper that returns `format(addDays(new Date(), offset), 'yyyy-MM-dd')`. Use it for ALL seed dates. Current bookings should span today (start in past, end in future).
**Warning signs:** Any string literal that looks like a date in the seed file.

### Pitfall 3: SQLite Boolean Gotcha
**What goes wrong:** SQLite has no native boolean type. Drizzle's `integer('col', { mode: 'boolean' })` maps to 0/1, but direct SQL queries or seed inserts using `true`/`false` may produce unexpected results.
**How to avoid:** Always use Drizzle's typed API for inserts, which handles the conversion. In seed data, use `true`/`false` in Drizzle insert statements (it converts automatically). Never insert boolean values via raw SQL.
**Warning signs:** `has_electric` column showing `'true'` string instead of `1`.

### Pitfall 4: Route Group Layout Nesting
**What goes wrong:** Route groups like `(admin)` create URL paths without the group name, but layouts still nest. If the root layout has padding and the admin layout also adds padding, you get double padding.
**Why it happens:** Next.js layout nesting is hierarchical regardless of route groups.
**How to avoid:** Root layout should be minimal (html, body, fonts, theme). All structural layout (sidebar, nav, content area) belongs in the route group layouts. Root layout provides only the outer shell.
**Warning signs:** Unexpected spacing, scrollbar issues, content pushed off-screen.

### Pitfall 5: Forgetting SESSION_SECRET Environment Variable
**What goes wrong:** iron-session requires a 32+ character secret for cookie encryption. Missing or short secret causes cryptic errors at runtime.
**How to avoid:** Add `SESSION_SECRET` to `.env.local` during project setup. Use a random 32+ character string. Add validation on startup that checks for the variable.
**Warning signs:** "Password must be at least 32 characters long" error from iron-session.

## Code Examples

### Database Connection Setup
```typescript
// src/db/index.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'slipsync.db');
const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
```
**Source:** [Drizzle ORM better-sqlite3 setup](https://orm.drizzle.team/docs/get-started/sqlite-new)

### Login Server Action
```typescript
// src/app/(auth)/login/actions.ts
'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return { error: 'Invalid email or password' };
  }

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.role = user.role;
  session.isLoggedIn = true;
  await session.save();

  // Redirect to role-appropriate landing
  const landing = user.role === 'admin' ? '/admin/dashboard'
    : user.role === 'dock_staff' ? '/staff/operations'
    : '/boater/my-bookings';
  redirect(landing);
}
```

### Seed Date Helper
```typescript
// src/db/seed-helpers.ts
import { addDays, format, subDays } from 'date-fns';

const now = new Date();

export function daysFromNow(offset: number): string {
  const date = offset >= 0 ? addDays(now, offset) : subDays(now, Math.abs(offset));
  return format(date, 'yyyy-MM-dd');
}

export function isoNow(): string {
  return now.toISOString();
}
```

### drizzle.config.ts
```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/slipsync.db',
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HSL color values in shadcn/ui | OKLCH color values | shadcn/ui 2025 updates | More perceptually uniform; wrap in hsl() no longer needed |
| tailwind.config.js | CSS-first config with @theme inline | Tailwind v4 (2025) | No JS config file; colors defined in CSS |
| NextAuth.js / Auth.js | Better Auth (or custom for simple cases) | 2025 | Auth.js project joined Better Auth; for 3 demo accounts, custom is simpler |
| Drizzle v1 beta | Drizzle 0.45.x stable | Current | Stick with 0.45.x stable, not v1 beta |
| Prisma for SQLite | Drizzle ORM | Ongoing trend | Drizzle is lighter, no query engine binary, closer to SQL |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (recommended for Next.js + TypeScript) |
| Config file | None -- Wave 0 creates `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Login with email/password succeeds | unit | `npx vitest run src/__tests__/auth.test.ts -t "login"` | No - Wave 0 |
| AUTH-02 | Session persists (cookie set correctly) | unit | `npx vitest run src/__tests__/auth.test.ts -t "session"` | No - Wave 0 |
| AUTH-03 | Logout destroys session | unit | `npx vitest run src/__tests__/auth.test.ts -t "logout"` | No - Wave 0 |
| AUTH-04 | Role-based middleware redirects unauthorized | unit | `npx vitest run src/__tests__/middleware.test.ts` | No - Wave 0 |
| AUTH-05 | Demo accounts exist after seed | unit | `npx vitest run src/__tests__/seed.test.ts -t "demo accounts"` | No - Wave 0 |
| SLIP-01 | Slips have dimensions (length, beam, draft) | unit | `npx vitest run src/__tests__/schema.test.ts -t "slip dimensions"` | No - Wave 0 |
| SLIP-02 | Slips organized by dock with categories | unit | `npx vitest run src/__tests__/schema.test.ts -t "dock categories"` | No - Wave 0 |
| SEED-01 | Seed creates 4 docks, 60 slips | unit | `npx vitest run src/__tests__/seed.test.ts -t "marina structure"` | No - Wave 0 |
| SEED-02 | Seed creates 15-20 boaters with vessels | unit | `npx vitest run src/__tests__/seed.test.ts -t "boaters"` | No - Wave 0 |
| SEED-03 | Status distribution matches targets | unit | `npx vitest run src/__tests__/seed.test.ts -t "status distribution"` | No - Wave 0 |
| SEED-04 | Historical bookings use relative dates | unit | `npx vitest run src/__tests__/seed.test.ts -t "relative dates"` | No - Wave 0 |
| SEED-05 | Waitlist and maintenance seeded | unit | `npx vitest run src/__tests__/seed.test.ts -t "waitlist"` | No - Wave 0 |
| UX-01 | Nautical color palette defined | manual-only | Visual inspection | N/A |
| UX-02 | shadcn/ui components render | manual-only | Build succeeds: `npm run build` | N/A |
| UX-03 | Responsive layouts work | manual-only | Visual inspection at tablet/mobile breakpoints | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration for Next.js
- [ ] `src/__tests__/auth.test.ts` -- Auth login/logout/session tests
- [ ] `src/__tests__/middleware.test.ts` -- Middleware role-checking tests
- [ ] `src/__tests__/seed.test.ts` -- Seed data validation tests
- [ ] `src/__tests__/schema.test.ts` -- Schema structure validation
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react`

## Open Questions

1. **iron-session middleware cookie type compatibility**
   - What we know: iron-session 8 works with Next.js App Router middleware, but the cookie API bridge between middleware `RequestCookies` and `getIronSession` can be finicky
   - What's unclear: Whether Next.js 16 changes the middleware cookie API vs 15
   - Recommendation: Follow the iron-session example pattern exactly; test middleware auth early in implementation

2. **Drizzle `drizzle-kit push` vs migrations for SQLite**
   - What we know: `push` is simpler for development (no migration files), but `migrate` gives reproducible schema changes
   - What's unclear: Whether push handles all schema changes non-destructively
   - Recommendation: Use `push` for Phase 1 rapid development since this is greenfield. Switch to migrations only if needed later.

## Sources

### Primary (HIGH confidence)
- [Drizzle ORM SQLite setup](https://orm.drizzle.team/docs/get-started/sqlite-new) - Schema definition, connection setup, push workflow
- [Drizzle ORM column types](https://orm.drizzle.team/docs/column-types/sqlite) - SQLite column type mappings
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming) - CSS variable system, OKLCH colors, background/foreground convention
- [shadcn/ui Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4) - @theme inline directive, migration from HSL to OKLCH
- [iron-session npm](https://www.npmjs.com/package/iron-session) - API reference, version 8.0.4
- [iron-session GitHub middleware example](https://github.com/vvo/iron-session/blob/main/examples/next/src/middleware.ts) - Middleware integration pattern

### Secondary (MEDIUM confidence)
- [Next.js Authentication Guide](https://nextjs.org/docs/app/building-your-application/authentication) - Official auth patterns for App Router
- [Next.js RBAC middleware patterns](https://www.jigz.dev/blogs/how-to-use-middleware-for-role-based-access-control-in-next-js-15-app-router) - Middleware role-checking patterns (Next.js 15, applicable to 16)

### Tertiary (LOW confidence)
- None -- all findings verified against official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry on 2026-03-24
- Architecture: HIGH -- patterns from official Next.js/Drizzle/iron-session docs
- Pitfalls: HIGH -- documented in project PITFALLS.md research + verified against sources
- Theme: MEDIUM -- OKLCH values are estimated for nautical palette; may need visual tuning

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable stack, 30-day validity)
