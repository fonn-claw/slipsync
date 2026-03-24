'use client';

import { useMemo, useRef, useState, useCallback } from 'react';
import type { SlipWithDetails } from '@/lib/dal/slips';
import { computeMarinaLayout, type SlipLayout } from './map-layout';
import { VIEWBOX, WATER_GRADIENT, DOCK_COLORS, WALKWAY_HEIGHT } from './map-constants';
import { DockSection } from './dock-section';
import { MapLegend } from './map-legend';
import { SlipDetailPanel } from './slip-detail-panel';

interface MarinaMapProps {
  slips: SlipWithDetails[];
  userRole: 'admin' | 'dock_staff' | 'boater';
}

interface HoveredSlip {
  slip: SlipLayout;
  mouseX: number;
  mouseY: number;
}

export function MarinaMap({ slips, userRole }: MarinaMapProps) {
  const [selectedSlipId, setSelectedSlipId] = useState<number | null>(null);
  const [highlightedDock, setHighlightedDock] = useState<string | null>(null);
  const [hoveredSlip, setHoveredSlip] = useState<HoveredSlip | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const layout = useMemo(() => computeMarinaLayout(slips), [slips]);

  const selectedSlip = useMemo(
    () => slips.find((s) => s.id === selectedSlipId) ?? null,
    [slips, selectedSlipId],
  );

  const handleSlipHover = useCallback((slip: SlipLayout | null) => {
    if (!slip) {
      setHoveredSlip(null);
    }
    // Position will be updated on mouse move
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!hoveredSlip && !e.currentTarget) return;
      // We track mouse position to reposition tooltip
      const container = svgContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setHoveredSlip((prev) => (prev ? { ...prev, mouseX: x, mouseY: y } : prev));
    },
    [hoveredSlip],
  );

  const handleSlipEnter = useCallback((slip: SlipLayout) => {
    setHoveredSlip({ slip, mouseX: 0, mouseY: 0 });
  }, []);

  const handleDockLabelClick = useCallback(
    (dockName: string) => {
      setHighlightedDock((prev) => (prev === dockName ? null : dockName));
    },
    [],
  );

  return (
    <div ref={svgContainerRef} className="relative w-full">
      {/* Interactive SVG Marina Map */}
      <svg
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        className="w-full h-auto rounded-lg"
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
      >
        <defs>
          {/* Water gradient background */}
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={WATER_GRADIENT.start} stopOpacity={0.15} />
            <stop offset="100%" stopColor={WATER_GRADIENT.end} stopOpacity={0.08} />
          </linearGradient>
          {/* Wave pattern */}
          <pattern id="waves" x="0" y="0" width="120" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M0,10 Q30,0 60,10 Q90,20 120,10"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          </pattern>
          {/* Subtle glow for pier shadow */}
          <filter id="pierShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Water background */}
        <rect width={VIEWBOX.width} height={VIEWBOX.height} rx={8} fill="#0c4a6e" />
        <rect width={VIEWBOX.width} height={VIEWBOX.height} rx={8} fill="url(#water)" />
        <rect width={VIEWBOX.width} height={VIEWBOX.height} rx={8} fill="url(#waves)" />

        {/* Marina compass rose decoration */}
        <g opacity={0.06} transform="translate(60, 50)">
          <circle cx={0} cy={0} r={30} fill="none" stroke="#fff" strokeWidth={1} />
          <line x1={0} y1={-30} x2={0} y2={30} stroke="#fff" strokeWidth={0.5} />
          <line x1={-30} y1={0} x2={30} y2={0} stroke="#fff" strokeWidth={0.5} />
          <text x={0} y={-34} textAnchor="middle" fill="#fff" fontSize={8} fontWeight={600}>N</text>
        </g>

        {/* Main walkway at bottom */}
        <rect
          x={0}
          y={VIEWBOX.height - WALKWAY_HEIGHT}
          width={VIEWBOX.width}
          height={WALKWAY_HEIGHT}
          rx={0}
          fill={DOCK_COLORS.walkway}
        />
        {/* Walkway edge line */}
        <line
          x1={0}
          y1={VIEWBOX.height - WALKWAY_HEIGHT}
          x2={VIEWBOX.width}
          y2={VIEWBOX.height - WALKWAY_HEIGHT}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />

        {/* Sunset Harbor Marina branding on walkway */}
        <text
          x={VIEWBOX.width / 2}
          y={VIEWBOX.height - WALKWAY_HEIGHT / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.7)"
          fontSize={14}
          fontWeight={700}
          fontFamily="system-ui, sans-serif"
          letterSpacing={2}
        >
          SUNSET HARBOR MARINA
        </text>

        {/* Dock sections */}
        {layout.docks.map((dock) => (
          <DockSection
            key={dock.dockId}
            dock={dock}
            selectedSlipId={selectedSlipId}
            isDimmed={highlightedDock !== null && highlightedDock !== dock.name}
            onSlipClick={(id) => setSelectedSlipId(id)}
            onSlipHover={(slip) => (slip ? handleSlipEnter(slip) : handleSlipHover(null))}
            onDockLabelClick={handleDockLabelClick}
          />
        ))}
      </svg>

      {/* Custom HTML tooltip overlay */}
      {hoveredSlip && hoveredSlip.mouseX > 0 && (
        <div
          className="pointer-events-none absolute z-20 rounded-md bg-slate-900/95 px-2.5 py-1.5 text-xs text-white shadow-lg backdrop-blur-sm"
          style={{
            left: hoveredSlip.mouseX + 12,
            top: hoveredSlip.mouseY - 8,
            transform: 'translateY(-100%)',
          }}
        >
          <div className="font-semibold">Slip {hoveredSlip.slip.number}</div>
          <div className="text-slate-300 capitalize">{hoveredSlip.slip.status}</div>
          {hoveredSlip.slip.vesselName && (
            <div className="text-blue-300">{hoveredSlip.slip.vesselName}</div>
          )}
        </div>
      )}

      {/* Legend */}
      <MapLegend />

      {/* Detail panel */}
      <SlipDetailPanel
        slip={selectedSlip}
        userRole={userRole}
        onClose={() => setSelectedSlipId(null)}
      />
    </div>
  );
}
