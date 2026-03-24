import Link from 'next/link';
import { getAllBookings } from '@/lib/dal/bookings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, CalendarDays } from 'lucide-react';
import { BookingsClient } from './bookings-client';

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/25',
  confirmed: 'bg-blue-500/15 text-blue-700 border-blue-500/25',
  checked_in: 'bg-green-500/15 text-green-700 border-green-500/25',
  checked_out: 'bg-gray-500/15 text-gray-600 border-gray-500/25',
  cancelled: 'bg-red-500/15 text-red-700 border-red-500/25',
};

export default async function BookingsPage() {
  const bookings = await getAllBookings();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Bookings</h1>
          <p className="text-sm text-muted-foreground">{bookings.length} total bookings</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/bookings/calendar">
            <Button variant="outline" size="sm">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendar
            </Button>
          </Link>
          <Link href="/admin/bookings/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Button>
          </Link>
        </div>
      </div>

      <BookingsClient bookings={bookings} statusStyles={statusStyles} />
    </div>
  );
}
