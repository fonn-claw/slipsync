import { getTodayArrivals, getTodayDepartures } from '@/lib/dal/bookings';
import { ArrivalsAndDepartures } from '@/components/booking/arrivals-departures';

export default async function CheckInPage() {
  const [arrivals, departures] = await Promise.all([
    getTodayArrivals(),
    getTodayDepartures(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Check In / Check Out</h1>
        <p className="text-sm text-muted-foreground">
          {arrivals.length} arrival{arrivals.length !== 1 ? 's' : ''} &middot; {departures.length} departure{departures.length !== 1 ? 's' : ''} today
        </p>
      </div>
      <ArrivalsAndDepartures arrivals={arrivals} departures={departures} />
    </div>
  );
}
