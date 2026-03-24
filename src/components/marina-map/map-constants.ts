/** Fixed SVG coordinate space for the marina map */
export const VIEWBOX = { width: 1200, height: 700 } as const;

/** Color mapping for slip statuses */
export const STATUS_COLORS = {
  available: { fill: '#22c55e', hover: '#16a34a', label: 'Available' },
  occupied: { fill: '#3b82f6', hover: '#2563eb', label: 'Occupied' },
  reserved: { fill: '#eab308', hover: '#ca8a04', label: 'Reserved' },
  maintenance: { fill: '#ef4444', hover: '#dc2626', label: 'Maintenance' },
} as const;

/** Dock structural colors */
export const DOCK_COLORS = { pier: '#78716c', walkway: '#a8a29e' } as const;

/** Water background gradient */
export const WATER_GRADIENT = { start: '#0c4a6e', end: '#0369a1' } as const;

/** Gap between dock groups in SVG units */
export const DOCK_GAP = 40;

/** Gap between individual slips in SVG units */
export const SLIP_GAP = 2;

/** Height of the main walkway at bottom of the map */
export const WALKWAY_HEIGHT = 50;

/** Width of each dock pier */
export const PIER_WIDTH = 16;
