import type { SlipWithDetails } from '@/lib/dal/slips';
import { VIEWBOX, WALKWAY_HEIGHT, PIER_WIDTH, SLIP_GAP } from './map-constants';

export interface SlipLayout {
  slipId: number;
  number: string;
  status: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vesselName: string | null;
}

export interface DockLayout {
  dockId: number;
  name: string;
  sizeCategory: string;
  x: number;
  y: number;
  width: number;
  height: number;
  slips: SlipLayout[];
  slipCount: number;
}

export interface MarinaLayout {
  viewBox: typeof VIEWBOX;
  docks: DockLayout[];
}

/**
 * Dock X-position mapping (percentage of viewBox width).
 * Left side: Dock A (~10%), Dock B (~30%)
 * Right side: Dock C (~60%), Dock D (~82%)
 */
const DOCK_X_POSITIONS: Record<string, number> = {
  'Dock A': 0.10,
  'Dock B': 0.30,
  'Dock C': 0.60,
  'Dock D': 0.82,
};

/** Slip width by dock size category */
const SLIP_WIDTH_BY_CATEGORY: Record<string, number> = {
  small: 40,
  medium: 55,
  large: 70,
  extra_large: 90,
};

/**
 * Extract vessel name from a slip's bookings.
 * Only returns a name for active bookings (checked_in or confirmed).
 */
function extractVesselName(slip: SlipWithDetails): string | null {
  if (!slip.bookings || slip.bookings.length === 0) return null;
  const activeBooking = slip.bookings.find(
    (b) => b.status === 'checked_in' || b.status === 'confirmed',
  );
  return activeBooking?.vessel?.name ?? null;
}

/**
 * Compute the full marina SVG layout from database slip data.
 * Groups slips by dock, positions docks as vertical finger piers
 * extending upward from a walkway at the bottom.
 * Slips alternate left/right along each pier.
 */
export function computeMarinaLayout(slips: SlipWithDetails[]): MarinaLayout {
  if (slips.length === 0) {
    return { viewBox: VIEWBOX, docks: [] };
  }

  // Group slips by dock
  const dockMap = new Map<number, { dock: SlipWithDetails['dock']; slips: SlipWithDetails[] }>();
  for (const slip of slips) {
    const existing = dockMap.get(slip.dockId);
    if (existing) {
      existing.slips.push(slip);
    } else {
      dockMap.set(slip.dockId, { dock: slip.dock, slips: [slip] });
    }
  }

  // Available pier height (from top padding to walkway)
  const topPadding = 30;
  const pierHeight = VIEWBOX.height - WALKWAY_HEIGHT - topPadding;

  const docks: DockLayout[] = [];

  for (const [dockId, { dock, slips: dockSlips }] of dockMap) {
    const xPct = DOCK_X_POSITIONS[dock.name] ?? 0.5;
    const pierX = Math.round(xPct * VIEWBOX.width);
    const pierY = topPadding;

    const slipCount = dockSlips.length;
    // Each slip is placed along the pier; half on each side
    // Calculate slip height to fill available pier length
    const slipsPerSide = Math.ceil(slipCount / 2);
    const slipHeight = Math.max(
      6,
      Math.floor((pierHeight - (slipsPerSide - 1) * SLIP_GAP) / slipsPerSide),
    );

    const slipWidth = SLIP_WIDTH_BY_CATEGORY[dock.sizeCategory] ?? 50;

    // Total dock bounding box width includes slips on both sides + pier
    const dockWidth = slipWidth * 2 + PIER_WIDTH + 4; // 2px gap each side
    const dockX = pierX - slipWidth - 2;

    const slipLayouts: SlipLayout[] = dockSlips.map((slip, index) => {
      const isLeftSide = index % 2 === 0;
      const sideIndex = Math.floor(index / 2);

      const x = isLeftSide
        ? pierX - slipWidth - 2
        : pierX + PIER_WIDTH + 2;

      const y = pierY + sideIndex * (slipHeight + SLIP_GAP);

      return {
        slipId: slip.id,
        number: slip.number,
        status: slip.status,
        x,
        y,
        width: slipWidth,
        height: slipHeight,
        vesselName: extractVesselName(slip),
      };
    });

    docks.push({
      dockId,
      name: dock.name,
      sizeCategory: dock.sizeCategory,
      x: dockX,
      y: pierY,
      width: dockWidth,
      height: pierHeight,
      slips: slipLayouts,
      slipCount,
    });
  }

  return { viewBox: VIEWBOX, docks };
}
