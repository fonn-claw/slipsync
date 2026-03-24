'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { BookingDetailPanel } from '@/components/booking/booking-detail-panel';

interface BookingsClientProps {
  bookings: any[];
  statusStyles: Record<string, string>;
}

export function BookingsClient({ bookings, statusStyles }: BookingsClientProps) {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  return (
    <>
      <div className="rounded-lg border bg-card">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto_auto_auto] gap-4 border-b px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div>Slip</div>
          <div>Vessel</div>
          <div>Boater</div>
          <div>Type</div>
          <div>Status</div>
          <div>Dates</div>
        </div>
        {bookings.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No bookings yet</div>
        ) : (
          bookings.map((b) => (
            <div
              key={b.id}
              className="grid cursor-pointer grid-cols-[1fr_1fr_1fr_auto_auto_auto] items-center gap-4 border-b px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-muted/50"
              onClick={() => setSelectedBooking(b)}
            >
              <div className="font-medium">{b.slip?.number}</div>
              <div>{b.vessel?.name}</div>
              <div className="text-muted-foreground">{b.boater?.name}</div>
              <div>
                <Badge variant="secondary" className="text-xs capitalize">{b.type}</Badge>
              </div>
              <div>
                <Badge variant="outline" className={statusStyles[b.status] ?? ''}>
                  {b.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(b.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' '}&ndash;{' '}
                {new Date(b.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))
        )}
      </div>

      <BookingDetailPanel
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => { if (!open) setSelectedBooking(null); }}
      />
    </>
  );
}
