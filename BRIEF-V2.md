# SlipSync v2 — Feature Update

## Context
SlipSync is a live, working marina management app at https://slipsync.demos.fonnit.com
Tech stack: Next.js + Drizzle ORM + Neon Postgres + NextAuth + Tailwind/shadcn
It has: interactive marina map, booking system, admin dashboard, boater portal, dock staff view.

## New Features to Add

### 1. Weather Widget
- Show current weather conditions at the marina on the dashboard and map view
- Temperature, wind speed/direction, wave height, conditions (sunny/cloudy/rain)
- Use a free weather API (Open-Meteo or wttr.in — no API key needed)
- Display as a compact card on the dashboard and a small overlay on the marina map
- Location: hardcode coordinates for "Sunset Harbor Marina" (use a Florida marina location)

### 2. QR Code Check-In
- Generate a unique QR code for each active booking
- Boaters see their QR code in the boater portal under their active reservation
- Dock staff can "scan" (for demo: enter a booking code) to check in a boater
- Check-in updates the slip status to "occupied" in real-time on the marina map
- Show check-in timestamp on the booking record

### 3. Fuel Sales Tracking
- New section in dock staff and admin views
- Log fuel dispensed: select slip, fuel type (diesel/gas), gallons, price per gallon
- Running totals per slip, per dock, and marina-wide
- Monthly fuel revenue summary on admin dashboard
- Boaters can see their fuel charges in the portal

### 4. Dashboard Improvements
- Add the weather widget
- Add fuel revenue to the revenue overview
- Add a "Today's Activity" feed: check-ins, check-outs, fuel sales, new bookings
- Make the stats cards more visually engaging (add trend arrows, sparklines if possible)

## DO NOT Change
- Don't break existing features
- Don't change the auth system or demo accounts
- Don't restructure the database from scratch — add new tables/columns as needed
- Keep the existing color palette and design language

## Demo Data
- Add fuel sales history (last 30 days, realistic amounts)
- Add some bookings with QR codes ready for check-in
- Weather data comes from live API, no seeding needed

## Technical Notes
- Database: Neon Postgres (already configured, use existing connection)
- For QR codes: use a library like `qrcode` (npm package) to generate SVG/PNG
- For weather: Open-Meteo API (free, no key) — https://api.open-meteo.com/v1/forecast
- All new API routes follow existing patterns in the codebase
