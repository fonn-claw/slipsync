'use client';

import { STATUS_COLORS } from './map-constants';
import type { SlipLayout } from './map-layout';

interface SlipElementProps {
  slip: SlipLayout;
  isSelected: boolean;
  isDimmed: boolean;
  onClick: () => void;
  onMouseEnter: (slip: SlipLayout) => void;
  onMouseLeave: () => void;
}

export function SlipElement({
  slip,
  isSelected,
  isDimmed,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: SlipElementProps) {
  const colors = STATUS_COLORS[slip.status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.available;
  const numericPart = slip.number.split('-')[1] ?? slip.number;
  const fontSize = slip.width < 50 ? 8 : 10;

  return (
    <g
      onClick={onClick}
      onMouseEnter={() => onMouseEnter(slip)}
      onMouseLeave={onMouseLeave}
      style={{
        cursor: 'pointer',
        opacity: isDimmed ? 0.3 : 1,
        transition: 'opacity 200ms ease',
      }}
    >
      <rect
        x={slip.x}
        y={slip.y}
        width={slip.width}
        height={slip.height}
        rx={2}
        fill={colors.fill}
        stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.15)'}
        strokeWidth={isSelected ? 2 : 0.5}
        style={{ transition: 'fill 200ms ease, stroke 150ms ease' }}
      />
      {/* Subtle boat icon for occupied slips */}
      {slip.status === 'occupied' && slip.height >= 12 && (
        <path
          d={`M${slip.x + slip.width / 2 - 5},${slip.y + 3} l5,-2 l5,2 l-1,3 l-8,0 z`}
          fill="rgba(255,255,255,0.25)"
          pointerEvents="none"
        />
      )}
      <text
        x={slip.x + slip.width / 2}
        y={slip.y + slip.height / 2 + (slip.status === 'occupied' && slip.height >= 12 ? 2 : 0)}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize={fontSize}
        fontWeight={500}
        fontFamily="system-ui, sans-serif"
        pointerEvents="none"
      >
        {numericPart}
      </text>
    </g>
  );
}
