'use client';

import { Card, CardContent } from '@/components/ui/card';
import { STATUS_COLORS } from './map-constants';

export function MapLegend() {
  return (
    <Card className="absolute top-3 right-3 z-10 bg-background/85 backdrop-blur-sm shadow-md">
      <CardContent className="flex flex-wrap gap-x-4 gap-y-1.5 p-3">
        {Object.entries(STATUS_COLORS).map(([status, { fill, label }]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-full border border-white/20"
              style={{ backgroundColor: fill }}
            />
            <span className="text-xs font-medium text-foreground/80">{label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
