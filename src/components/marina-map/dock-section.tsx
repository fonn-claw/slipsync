'use client';

import { DOCK_COLORS, PIER_WIDTH, WALKWAY_HEIGHT, VIEWBOX } from './map-constants';
import type { DockLayout, SlipLayout } from './map-layout';
import { SlipElement } from './slip-element';

interface DockSectionProps {
  dock: DockLayout;
  selectedSlipId: number | null;
  isDimmed: boolean;
  onSlipClick: (id: number) => void;
  onSlipHover: (slip: SlipLayout | null) => void;
  onDockLabelClick: (dockName: string) => void;
}

export function DockSection({
  dock,
  selectedSlipId,
  isDimmed,
  onSlipClick,
  onSlipHover,
  onDockLabelClick,
}: DockSectionProps) {
  const pierX = dock.x + (dock.width - PIER_WIDTH) / 2;
  const pierY = dock.y;
  const pierHeight = VIEWBOX.height - WALKWAY_HEIGHT - dock.y;

  return (
    <g
      style={{
        opacity: isDimmed ? 0.35 : 1,
        transition: 'opacity 300ms ease',
      }}
    >
      {/* Pier shadow */}
      <rect
        x={pierX + 2}
        y={pierY + 2}
        width={PIER_WIDTH}
        height={pierHeight}
        rx={2}
        fill="rgba(0,0,0,0.15)"
      />
      {/* Pier body */}
      <rect
        x={pierX}
        y={pierY}
        width={PIER_WIDTH}
        height={pierHeight}
        rx={2}
        fill={DOCK_COLORS.pier}
      />
      {/* Pier cap (top) */}
      <rect
        x={pierX - 3}
        y={pierY - 2}
        width={PIER_WIDTH + 6}
        height={6}
        rx={3}
        fill={DOCK_COLORS.pier}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={0.5}
      />

      {/* Slips */}
      {dock.slips.map((slip) => (
        <SlipElement
          key={slip.slipId}
          slip={slip}
          isSelected={slip.slipId === selectedSlipId}
          isDimmed={false}
          onClick={() => onSlipClick(slip.slipId)}
          onMouseEnter={(s) => onSlipHover(s)}
          onMouseLeave={() => onSlipHover(null)}
        />
      ))}

      {/* Dock label at bottom near walkway */}
      <g
        onClick={() => onDockLabelClick(dock.name)}
        style={{ cursor: 'pointer' }}
      >
        {/* Label background pill */}
        <rect
          x={pierX - 14}
          y={VIEWBOX.height - WALKWAY_HEIGHT - 22}
          width={PIER_WIDTH + 28}
          height={18}
          rx={9}
          fill="rgba(15, 23, 42, 0.75)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={0.5}
        />
        <text
          x={pierX + PIER_WIDTH / 2}
          y={VIEWBOX.height - WALKWAY_HEIGHT - 13}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#ffffff"
          fontSize={9}
          fontWeight={600}
          fontFamily="system-ui, sans-serif"
        >
          {dock.name} ({dock.slipCount})
        </text>
      </g>
    </g>
  );
}
