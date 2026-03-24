import { addDays, subDays, format } from 'date-fns';

const now = new Date();

export function daysFromNow(offset: number): string {
  const date = offset >= 0 ? addDays(now, offset) : subDays(now, Math.abs(offset));
  return format(date, 'yyyy-MM-dd');
}

export function isoNow(): string {
  return now.toISOString();
}
