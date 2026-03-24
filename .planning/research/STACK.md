# Technology Stack

**Project:** SlipSync -- Marina & Boat Slip Management
**Researched:** 2026-03-24

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 16.1 | Full-stack React framework | App Router is mature, Turbopack stable for dev, server actions for mutations, API routes for backend. The standard choice for React full-stack apps in 2026. | HIGH |
| React | 19 | UI rendering | Ships with Next.js 16. Server Components reduce client bundle. | HIGH |
| TypeScript | 5.x | Type safety | Non-negotiable for any professional project. Drizzle and Zod provide end-to-end type safety. | HIGH |

### Database
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| SQLite via better-sqlite3 | 12.8.0 | Application database | Zero config, no external services, file-based DB perfect for local-first showcase app. Synchronous API is actually a benefit for server-side Next.js. | HIGH |
| Drizzle ORM | 0.45.x (stable) | Database access & migrations | Type-safe SQL queries, excellent SQLite support, lightweight (no query engine overhead like Prisma). Schema-as-code with push/migrate workflows. Stick with 0.45.x stable, not the v1 beta. | HIGH |
| drizzle-kit | latest | Schema migrations | Companion tool for Drizzle. Handles schema push and migration generation. | HIGH |

### Styling & UI Components
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 4.2 | Utility-first CSS | CSS-first config (no tailwind.config.js), 5x faster builds, native CSS cascade layers. The standard for modern React apps. | HIGH |
| shadcn/ui | latest (CLI v4) | Component library | Not a dependency -- copies components into your project. Professional, accessible, built on Radix UI primitives. Required by project brief. | HIGH |
| Lucide React | latest | Icons | Default icon set for shadcn/ui. Consistent, tree-shakeable, 1400+ icons including nautical-relevant ones. | HIGH |

### Data Visualization
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Recharts | 3.8.x | Dashboard charts | Most popular React charting library (24.8K GitHub stars). Built on D3 + SVG. Declarative API fits React patterns. Handles occupancy trends, revenue charts. | HIGH |
| Inline React SVG | -- | Interactive marina map | The marina map is a custom dock layout, NOT a geographic map. Hand-crafted SVG with React event handlers gives full control over layout, animations, tooltips, and color-coding. No library needed -- just `<svg>` elements with React state. | HIGH |

### Validation & Forms
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zod | 4.3.x | Schema validation | End-to-end validation: form inputs, API routes, Drizzle schema inference. Standard pairing with TypeScript projects. | HIGH |
| React Hook Form | 7.x | Form management | Minimal re-renders, excellent shadcn/ui integration (Form component wraps it). Zod resolver for validation. | HIGH |

### Date Handling
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| date-fns | 4.x | Date manipulation | Tree-shakeable (only import what you use), functional API, first-class timezone support in v4. Booking system needs solid date math for availability, overlaps, durations. | HIGH |

### Authentication
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Custom cookie-based auth | -- | Demo authentication | This is a showcase app with 3 hardcoded demo accounts. Using next-auth/better-auth would be massive overkill. Simple approach: hash passwords with bcrypt, store session in an HTTP-only cookie (or use iron-session for encrypted cookies). Role-based middleware checks the cookie. | HIGH |
| iron-session | 8.x | Encrypted cookie sessions | Stateless encrypted sessions. No session DB table needed. Simple API: `getIronSession()` in server components and API routes. | MEDIUM |

### Dev Tooling
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| ESLint | 9.x | Linting | Ships with Next.js. Flat config format. | HIGH |
| Prettier | 3.x | Code formatting | Consistent formatting. Tailwind plugin for class sorting. | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| ORM | Drizzle | Prisma | Prisma generates a query engine binary (~15MB), slower cold starts, heavier for SQLite use case. Drizzle is closer to SQL, lighter, faster. |
| Database | SQLite | PostgreSQL | Requires running a separate server. SQLite is perfect for a showcase/demo app with no concurrent write pressure. |
| Charts | Recharts | Chart.js, Nivo | Chart.js requires canvas (no SSR-friendly SVG). Nivo is heavier and more complex API. Recharts has the simplest declarative API. |
| Auth | Custom + iron-session | NextAuth/Better Auth | Massive dependency for 3 demo accounts. Custom auth is 50 lines of code. For a production app, use Better Auth (NextAuth is now legacy). |
| CSS | Tailwind | CSS Modules | Tailwind is faster to develop with, especially for a single-session build. shadcn/ui requires Tailwind. |
| Date library | date-fns | Day.js | date-fns v4 has native timezone support and tree-shakes better. Day.js requires plugins for timezones and advanced formatting. |
| Marina map | Inline SVG | D3.js, Canvas, react-simple-maps | This is a fixed dock layout, not a data-driven geographic map. Inline SVG with React gives the most control with the least complexity. D3 would be overkill. Canvas loses accessibility and CSS styling. |
| State management | React state + URL params | Redux, Zustand | Server Components handle most data fetching. Client state is minimal (selected slip, filter state). URL search params for shareable state. No global store needed. |
| Forms | React Hook Form | Formik | RHF has better performance (uncontrolled inputs), smaller bundle, and native shadcn/ui integration via the Form component. |

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| Prisma | Heavier than needed, query engine binary, slower for SQLite |
| Redux/Zustand | No complex client state to manage. Server Components + URL params suffice. |
| NextAuth / Auth.js | Overkill for demo accounts. Auth.js project has joined Better Auth anyway. |
| D3.js (for marina map) | The map is a fixed layout, not a data visualization. React SVG is simpler and more maintainable. |
| Canvas API | Loses CSS styling, accessibility, and event handling that SVG provides natively. |
| Moment.js | Deprecated. Use date-fns. |
| Axios | fetch() is built into Next.js with caching/revalidation. No need for a wrapper. |
| tRPC | Adds complexity for a monolithic app. Server actions + API routes are sufficient. |

## Installation

```bash
# Initialize Next.js 16 project
npx create-next-app@latest slipsync --typescript --tailwind --eslint --app --src-dir

# Database
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3

# UI Components (shadcn/ui is added via CLI, not npm)
npx shadcn@latest init
# Then add components as needed:
# npx shadcn@latest add button card dialog table badge calendar etc.

# Icons
npm install lucide-react

# Charts
npm install recharts

# Validation & Forms
npm install zod react-hook-form @hookform/resolvers

# Date handling
npm install date-fns

# Auth
npm install iron-session

# Dev
npm install -D prettier prettier-plugin-tailwindcss
```

## Architecture Notes

- **Server Components by default**: Pages and layouts fetch data on the server. Only interactive elements (map, forms, dropdowns) are Client Components.
- **Server Actions for mutations**: Booking creation, status changes, check-in/check-out use `"use server"` functions with Zod validation.
- **API routes minimal**: Only needed for things that don't fit server actions (e.g., if we need REST endpoints).
- **SQLite file at project root**: `./data/slipsync.db` -- gitignored, created by seed script.
- **Seed script**: `npm run seed` populates all demo data. Runs automatically if DB doesn't exist.

## Sources

- [Next.js 16.1 Release](https://nextjs.org/blog/next-16-1) - HIGH confidence
- [Drizzle ORM Releases](https://github.com/drizzle-team/drizzle-orm/releases) - HIGH confidence
- [Tailwind CSS v4.2](https://tailwindcss.com/blog/tailwindcss-v4) - HIGH confidence
- [shadcn/ui Changelog](https://ui.shadcn.com/docs/changelog) - HIGH confidence
- [Recharts npm](https://www.npmjs.com/package/recharts) - HIGH confidence
- [Zod v4 Release Notes](https://zod.dev/v4) - HIGH confidence
- [better-sqlite3 npm](https://www.npmjs.com/package/better-sqlite3) - HIGH confidence
- [Auth.js joins Better Auth](https://github.com/nextauthjs/next-auth/discussions/13252) - MEDIUM confidence
- [date-fns v4](https://date-fns.org/) - HIGH confidence
