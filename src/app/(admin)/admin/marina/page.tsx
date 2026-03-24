import { getSlipsWithDetails } from '@/lib/dal/slips';
import { getSession } from '@/lib/auth';
import { MarinaMap } from '@/components/marina-map/marina-map';
import { Anchor, Ship, Wrench, CheckCircle } from 'lucide-react';
import { WeatherWidget } from '@/components/weather-widget';
import { getWeather } from '@/lib/dal/weather';

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-md ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <div className="text-xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export default async function MarinaPage() {
  const [session, slips, weather] = await Promise.all([
    getSession(),
    getSlipsWithDetails(),
    getWeather(),
  ]);

  const total = slips.length;
  const occupied = slips.filter((s) => s.status === 'occupied').length;
  const available = slips.filter((s) => s.status === 'available').length;
  const maintenance = slips.filter((s) => s.status === 'maintenance').length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Marina Map
        </h1>
        <p className="text-sm text-muted-foreground">
          Sunset Harbor Marina &mdash; {total} Slips Across 4 Docks
        </p>
      </div>

      {/* Quick stats + weather */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard icon={Anchor} label="Total Slips" value={total} color="bg-slate-600" />
        <StatCard icon={Ship} label="Occupied" value={occupied} color="bg-blue-500" />
        <StatCard icon={CheckCircle} label="Available" value={available} color="bg-green-500" />
        <StatCard icon={Wrench} label="Maintenance" value={maintenance} color="bg-red-500" />
        <WeatherWidget weather={weather} compact />
      </div>

      {/* The hero marina map */}
      <MarinaMap slips={slips} userRole={session.role} />
    </div>
  );
}
