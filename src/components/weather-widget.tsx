'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Sun, Cloud, CloudRain, CloudLightning, CloudDrizzle, CloudFog, CloudSun, Wind, Droplets, Thermometer } from 'lucide-react';
import type { WeatherData } from '@/lib/dal/weather';
import { windDirectionLabel } from '@/lib/dal/weather';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  cloud: Cloud,
  'cloud-sun': CloudSun,
  'cloud-rain': CloudRain,
  'cloud-drizzle': CloudDrizzle,
  'cloud-lightning': CloudLightning,
  'cloud-fog': CloudFog,
};

export function WeatherWidget({ weather, compact }: { weather: WeatherData | null; compact?: boolean }) {
  if (!weather) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-4 text-sm text-muted-foreground">
          Weather data unavailable
        </CardContent>
      </Card>
    );
  }

  const WeatherIcon = iconMap[weather.icon] || Cloud;

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-card/80 px-3 py-2 shadow-sm backdrop-blur-sm">
        <WeatherIcon className="h-5 w-5 text-yellow-500" />
        <span className="text-sm font-semibold">{weather.temperature}°F</span>
        <span className="text-xs text-muted-foreground">{weather.conditions}</span>
        <Wind className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{weather.windSpeed} mph {windDirectionLabel(weather.windDirection)}</span>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-500">
              <WeatherIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold">{weather.temperature}°F</div>
              <div className="text-sm text-muted-foreground">{weather.conditions}</div>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div className="font-medium text-foreground">Sunset Harbor</div>
            <div>Ft. Lauderdale, FL</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3">
          <div className="flex items-center gap-1.5">
            <Wind className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <div className="text-xs font-medium">{weather.windSpeed} mph</div>
              <div className="text-[10px] text-muted-foreground">{windDirectionLabel(weather.windDirection)}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <div className="text-xs font-medium">{weather.humidity}%</div>
              <div className="text-[10px] text-muted-foreground">Humidity</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Thermometer className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <div className="text-xs font-medium">{weather.temperature}°F</div>
              <div className="text-[10px] text-muted-foreground">Feels like</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
