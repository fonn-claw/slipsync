import { getSlipsWithDetails } from '@/lib/dal/slips';
import { getTodayArrivals, getTodayDepartures } from '@/lib/dal/bookings';
import { getSession } from '@/lib/auth';
import { MarinaMap } from '@/components/marina-map/marina-map';
import { ArrivalsAndDepartures } from '@/components/booking/arrivals-departures';

export default async function OperationsPage() {
  const [session, slips, arrivals, departures] = await Promise.all([
    getSession(),
    getSlipsWithDetails(),
    getTodayArrivals(),
    getTodayDepartures(),
  ]);

  const total = slips.length;
  const occupied = slips.filter((s) => s.status === 'occupied').length;
  const available = slips.filter((s) => s.status === 'available').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Operations
        </h1>
        <p className="text-sm text-muted-foreground">
          {occupied} occupied &middot; {available} available &middot; {total} total slips
        </p>
      </div>

      {/* Arrivals & Departures */}
      <ArrivalsAndDepartures arrivals={arrivals} departures={departures} />

      {/* Interactive marina map */}
      <MarinaMap slips={slips} userRole={session.role} />
    </div>
  );
}
