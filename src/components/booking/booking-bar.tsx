'use client';

import { differenceInDays, parseISO } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-400/80 hover:bg-yellow-400',
  confirmed: 'bg-blue-500/80 hover:bg-blue-500',
  checked_in: 'bg-green-500/80 hover:bg-green-500',
  checked_out: 'bg-gray-400/60 hover:bg-gray-400/80',
  cancelled: 'bg-red-400/40',
};

interface BookingBarProps {
  booking: {
    id: number;
    status: string;
    startDate: string;
    endDate: string;
    vessel?: { name: string } | null;
  };
  monthStart: Date;
  daysInMonth: number;
  onBookingClick: (booking: any) => void;
}

export function BookingBar({ booking, monthStart, daysInMonth, onBookingClick }: BookingBarProps) {
  const bookingStart = parseISO(booking.startDate);
  const bookingEnd = parseISO(booking.endDate);

  const startCol = Math.max(0, differenceInDays(bookingStart, monthStart));
  const endCol = Math.min(daysInMonth, differenceInDays(bookingEnd, monthStart));

  if (endCol <= 0 || startCol >= daysInMonth) return null;

  const leftPercent = (startCol / daysInMonth) * 100;
  const widthPercent = ((endCol - startCol) / daysInMonth) * 100;

  const startsInMonth = startCol >= 0;
  const endsInMonth = differenceInDays(bookingEnd, monthStart) <= daysInMonth;

  return (
    <div
      className={`absolute top-1 bottom-1 cursor-pointer text-[10px] font-medium text-white leading-none flex items-center px-1.5 overflow-hidden ${statusColors[booking.status] ?? statusColors.pending} ${startsInMonth ? 'rounded-l-sm' : ''} ${endsInMonth ? 'rounded-r-sm' : ''}`}
      style={{
        left: `${leftPercent}%`,
        width: `${Math.max(widthPercent, 2)}%`,
      }}
      onClick={(e) => { e.stopPropagation(); onBookingClick(booking); }}
      title={`${booking.vessel?.name ?? 'Unknown'} (${booking.status.replace('_', ' ')})`}
    >
      <span className="truncate">{booking.vessel?.name ?? ''}</span>
    </div>
  );
}
