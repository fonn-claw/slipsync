'use client';

import { useState, useTransition } from 'react';
import { updateBookingStatus } from '@/app/actions/booking-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Ship, Anchor, LogIn, LogOut, CalendarDays } from 'lucide-react';

interface BookingCard {
  id: number;
  startDate: string;
  endDate: string;
  slip?: { number: string; dock?: { name: string } } | null;
  vessel?: { name: string; type: string } | null;
  boater?: { name: string } | null;
}

interface ArrivalsAndDeparturesProps {
  arrivals: BookingCard[];
  departures: BookingCard[];
}

export function ArrivalsAndDepartures({ arrivals, departures }: ArrivalsAndDeparturesProps) {
  const [isPending, startTransition] = useTransition();
  const [checkOutId, setCheckOutId] = useState<number | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());

  const handleCheckIn = (bookingId: number) => {
    startTransition(async () => {
      const result = await updateBookingStatus(bookingId, 'checked_in');
      if (result.success) {
        setCompletedIds((prev) => new Set(prev).add(bookingId));
      }
    });
  };

  const handleCheckOut = (bookingId: number) => {
    setCheckOutId(bookingId);
  };

  const confirmCheckOut = () => {
    if (!checkOutId) return;
    const id = checkOutId;
    startTransition(async () => {
      const result = await updateBookingStatus(id, 'checked_out');
      if (result.success) {
        setCompletedIds((prev) => new Set(prev).add(id));
        setCheckOutId(null);
      }
    });
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Arrivals */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Ship className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Today&apos;s Arrivals</h2>
            <Badge variant="secondary">{arrivals.length}</Badge>
          </div>
          {arrivals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                <Ship className="mx-auto mb-2 h-8 w-8 opacity-30" />
                No arrivals today
              </CardContent>
            </Card>
          ) : (
            arrivals.map((b) => (
              <Card key={b.id} className={completedIds.has(b.id) ? 'opacity-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Anchor className="h-3.5 w-3.5 text-muted-foreground" />
                        {b.slip?.number}, {b.slip?.dock?.name}
                      </div>
                      <div className="text-sm">
                        {b.vessel?.name} <span className="text-muted-foreground">({b.vessel?.type})</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{b.boater?.name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(b.startDate)} &ndash; {formatDate(b.endDate)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={isPending || completedIds.has(b.id)}
                      onClick={() => handleCheckIn(b.id)}
                    >
                      <LogIn className="mr-1.5 h-3.5 w-3.5" />
                      {completedIds.has(b.id) ? 'Done' : 'Check In'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Departures */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Anchor className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold">Today&apos;s Departures</h2>
            <Badge variant="secondary">{departures.length}</Badge>
          </div>
          {departures.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                <Anchor className="mx-auto mb-2 h-8 w-8 opacity-30" />
                No departures today
              </CardContent>
            </Card>
          ) : (
            departures.map((b) => (
              <Card key={b.id} className={completedIds.has(b.id) ? 'opacity-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Anchor className="h-3.5 w-3.5 text-muted-foreground" />
                        {b.slip?.number}, {b.slip?.dock?.name}
                      </div>
                      <div className="text-sm">
                        {b.vessel?.name} <span className="text-muted-foreground">({b.vessel?.type})</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{b.boater?.name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(b.startDate)} &ndash; {formatDate(b.endDate)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending || completedIds.has(b.id)}
                      onClick={() => handleCheckOut(b.id)}
                    >
                      <LogOut className="mr-1.5 h-3.5 w-3.5" />
                      {completedIds.has(b.id) ? 'Done' : 'Check Out'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Check Out confirmation */}
      <AlertDialog open={!!checkOutId} onOpenChange={(open) => { if (!open) setCheckOutId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Check Out</AlertDialogTitle>
            <AlertDialogDescription>
              Check out this booking? The slip will become available for new bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <Button onClick={confirmCheckOut} disabled={isPending}>
              {isPending ? 'Processing...' : 'Confirm Check Out'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
