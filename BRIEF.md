# SlipSync — Marina & Boat Slip Management

## Overview
A full web application for marina operators to manage boat slips, bookings, and boaters. Built as a FonnIT daily showcase — must look impressive and work with realistic demo data.

## Business Context
- 73% of marinas still run on spreadsheets, losing ~$47K/year through booking errors and admin overhead
- 61% of small-to-mid marinas struggle with double bookings
- 78% of recreational boaters expect online booking
- Existing solutions: ancient desktop systems ($2.5-20K) or enterprise SaaS ($200-500/mo)
- Our pitch: modern, affordable alternative at $79-149/mo

## Target Users
1. **Marina Admin** — Manages the entire marina: slips, bookings, revenue, waitlists
2. **Dock Staff** — Day-to-day operations: check-ins, check-outs, maintenance tracking
3. **Boaters** — Browse available slips, book, manage vessels, submit maintenance requests

## Core Features

### 1. Interactive Visual Marina Map (HERO FEATURE)
- SVG/Canvas rendering showing dock layout with slips
- 4 docks (A, B, C, D) with 60 total slips
- Color-coded by status: available (green), occupied (blue), reserved (yellow), maintenance (red)
- Click a slip → details panel with vessel info, booking history, actions
- This is what people see first — make it stunning

### 2. Booking System
- Transient bookings (daily/weekly) and seasonal reservations
- Vessel size matching to slip dimensions (length, beam, draft)
- Calendar view of availability per slip/dock
- Double-booking prevention
- Booking lifecycle: pending → confirmed → checked-in → checked-out

### 3. Boater Portal
- Self-service slip browsing and booking
- Vessel registration (name, type, LOA, beam, draft)
- View current and past reservations
- Submit maintenance requests for their slip
- Account management

### 4. Admin Dashboard
- Occupancy rate (current + historical trends)
- Revenue overview (monthly, by dock, by slip type)
- Upcoming arrivals and departures
- Waitlist management
- Quick stats: total slips, occupied, available, maintenance

### 5. Auth & Roles
- Role-based access: admin, dock_staff, boater
- Secure login with demo accounts

## Nice to Have
- Weather widget (current conditions at marina)
- Fuel sales tracking
- Utility metering per slip (water, electric)

## Demo Data
- Marina: "Sunset Harbor Marina"
- 60 slips across 4 docks:
  - Dock A: 20 slips (small, 20-30ft)
  - Dock B: 15 slips (medium, 30-45ft)
  - Dock C: 15 slips (large, 45-65ft)
  - Dock D: 10 slips (extra-large, 65-100ft)
- 15-20 boater accounts with registered vessels
- Mix of: currently occupied (40%), reserved upcoming (20%), available (30%), maintenance (10%)
- Historical bookings going back 3 months
- A few items on the waitlist
- Maintenance requests in various states

### Demo Accounts
- admin@slipsync.app / demo1234 — Full admin access
- dock@slipsync.app / demo1234 — Dock staff view
- boater@slipsync.app / demo1234 — Boater portal (has 2 vessels, 1 active booking)

## Design Requirements
- Ocean/nautical color palette (deep navy blues, teals, seafoam, whites)
- Clean, modern, professional UI
- Responsive — must work on tablet for dockside use
- The marina map is the centerpiece — large, prominent, interactive
- This goes on LinkedIn — it needs to impress business decision-makers

## Technical Notes
- Choose your own stack (Next.js + SQLite/Drizzle is fine)
- Must build and run locally
- Seed script that populates all demo data on first run
