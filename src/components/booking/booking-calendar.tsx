'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isWeekend,
  isToday,
  parseISO,
} from 'date-fns';
import { BookingBar } from './booking-bar';
import { BookingDetailPanel } from './booking-detail-panel';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Dock {
  id: number;
  name: string;
}

interface Slip {
  id: number;
  number: string;
  dockId: number;
}

interface BookingCalendarProps {
  docks: Dock[];
  slipsByDock: Record<number, Slip[]>;
  bookingsByDock: Record<number, any[]>;
  initialDockId: number;
  initialYear: number;
  initialMonth: number;
}

export function BookingCalendar({
  docks,
  slipsByDock,
  bookingsByDock,
  initialDockId,
  initialYear,
  initialMonth,
}: BookingCalendarProps) {
  const router = useRouter();
  const [selectedDockId, setSelectedDockId] = useState(initialDockId);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const monthStart = useMemo(
    () => new Date(initialYear, initialMonth - 1, 1),
    [initialYear, initialMonth],
  );
  const monthEnd = useMemo(() => endOfMonth(monthStart), [monthStart]);
  const days = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);

  const currentSlips = slipsByDock[selectedDockId] ?? [];
  const currentBookings = bookingsByDock[selectedDockId] ?? [];

  const navigateMonth = (delta: number) => {
    let newMonth = initialMonth + delta;
    let newYear = initialYear;
    if (newMonth < 1) { newMonth = 12; newYear--; }
    if (newMonth > 12) { newMonth = 1; newYear++; }
    router.push(`/admin/bookings/calendar?dockId=${selectedDockId}&year=${newYear}&month=${newMonth}`);
  };

  const handleDockChange = (dockId: string) => {
    setSelectedDockId(Number(dockId));
    router.push(`/admin/bookings/calendar?dockId=${dockId}&year=${initialYear}&month=${initialMonth}`);
  };

  const handleEmptyDayClick = (slipId: number, date: Date) => {
    router.push(`/admin/bookings/new?slipId=${slipId}&date=${format(date, 'yyyy-MM-dd')}`);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <Tabs value={String(selectedDockId)} onValueChange={handleDockChange}>
          <TabsList>
            {docks.map((d) => (
              <TabsTrigger key={d.id} value={String(d.id)}>
                Dock {d.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-semibold">
            {format(monthStart, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <div className="min-w-[800px]">
          {/* Day headers */}
          <div className="flex border-b">
            <div className="w-16 shrink-0 border-r bg-muted/50 px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Slip
            </div>
            <div className="flex flex-1">
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`flex-1 border-r px-0.5 py-1.5 text-center text-[10px] last:border-r-0 ${
                    isToday(day) ? 'bg-primary/10 font-bold text-primary' : isWeekend(day) ? 'bg-muted/30 text-muted-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <div>{format(day, 'd')}</div>
                  <div className="text-[8px]">{format(day, 'EEE')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Slip rows */}
          {currentSlips.map((slip) => {
            const slipBookings = currentBookings.filter((b) => b.slipId === slip.id);
            return (
              <div key={slip.id} className="flex border-b last:border-b-0 hover:bg-muted/20">
                <div className="w-16 shrink-0 border-r bg-muted/50 px-2 py-1 text-xs font-medium flex items-center">
                  {slip.number}
                </div>
                <div
                  className="relative flex-1 cursor-pointer"
                  style={{ minHeight: '28px' }}
                  onClick={(e) => {
                    // Only handle click on empty area
                    if ((e.target as HTMLElement).closest('[data-booking]')) return;
                    // Find which day was clicked
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const dayIndex = Math.floor((x / rect.width) * days.length);
                    if (dayIndex >= 0 && dayIndex < days.length) {
                      handleEmptyDayClick(slip.id, days[dayIndex]);
                    }
                  }}
                >
                  {/* Today indicator */}
                  {days.findIndex((d) => isToday(d)) >= 0 && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-primary/40"
                      style={{ left: `${((days.findIndex((d) => isToday(d)) + 0.5) / days.length) * 100}%` }}
                    />
                  )}
                  {slipBookings.map((booking) => (
                    <div key={booking.id} data-booking>
                      <BookingBar
                        booking={booking}
                        monthStart={monthStart}
                        daysInMonth={days.length}
                        onBookingClick={setSelectedBooking}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {currentSlips.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No slips in this dock
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5"><div className="h-3 w-6 rounded-sm bg-yellow-400/80" /> Pending</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-6 rounded-sm bg-blue-500/80" /> Confirmed</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-6 rounded-sm bg-green-500/80" /> Checked In</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-6 rounded-sm bg-gray-400/60" /> Checked Out</div>
      </div>

      {/* Booking detail panel */}
      <BookingDetailPanel
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => { if (!open) setSelectedBooking(null); }}
      />
    </div>
  );
}
