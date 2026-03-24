'use client';

import { useState, useTransition } from 'react';
import { updateBookingStatus } from '@/app/actions/booking-actions';
import { canTransition, VALID_TRANSITIONS } from '@/lib/domain/booking-rules';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Ship, Anchor, CalendarDays, DollarSign, User, CheckCircle, XCircle, LogIn, LogOut } from 'lucide-react';

const statusStyles: Record<string, { badge: string; label: string }> = {
  pending: { badge: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/25', label: 'Pending' },
  confirmed: { badge: 'bg-blue-500/15 text-blue-700 border-blue-500/25', label: 'Confirmed' },
  checked_in: { badge: 'bg-green-500/15 text-green-700 border-green-500/25', label: 'Checked In' },
  checked_out: { badge: 'bg-gray-500/15 text-gray-600 border-gray-500/25', label: 'Checked Out' },
  cancelled: { badge: 'bg-red-500/15 text-red-700 border-red-500/25', label: 'Cancelled' },
};

const actionConfig: Record<string, { label: string; icon: React.ElementType; variant: 'default' | 'destructive' | 'outline'; needsConfirm: boolean }> = {
  confirmed: { label: 'Confirm', icon: CheckCircle, variant: 'default', needsConfirm: false },
  checked_in: { label: 'Check In', icon: LogIn, variant: 'default', needsConfirm: false },
  checked_out: { label: 'Check Out', icon: LogOut, variant: 'outline', needsConfirm: true },
  cancelled: { label: 'Cancel', icon: XCircle, variant: 'destructive', needsConfirm: true },
};

interface BookingDetailPanelProps {
  booking: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDetailPanel({ booking, open, onOpenChange }: BookingDetailPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!booking) return null;

  const status = statusStyles[booking.status] ?? statusStyles.pending;
  const validNextStatuses = VALID_TRANSITIONS[booking.status] ?? [];

  const handleAction = (newStatus: string) => {
    const config = actionConfig[newStatus];
    if (config?.needsConfirm) {
      setConfirmAction(newStatus);
    } else {
      executeAction(newStatus);
    }
  };

  const executeAction = (newStatus: string) => {
    setError(null);
    startTransition(async () => {
      const result = await updateBookingStatus(booking.id, newStatus);
      if (result.success) {
        setConfirmAction(null);
        onOpenChange(false);
      } else {
        setError(result.error || 'Failed to update status');
      }
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <SheetTitle className="text-lg">Booking #{booking.id}</SheetTitle>
              <Badge variant="outline" className={status.badge}>{status.label}</Badge>
              <Badge variant="secondary" className="text-xs">{booking.type}</Badge>
            </div>
            <SheetDescription>
              Slip {booking.slip?.number} &middot; {booking.slip?.dock?.name}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 pb-4">
            {/* Vessel info */}
            {booking.vessel && (
              <Card size="sm">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Ship className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{booking.vessel.name}</span>
                    <Badge variant="secondary" className="text-xs">{booking.vessel.type}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {booking.vessel.loa}&apos; LOA × {booking.vessel.beam}&apos; B × {booking.vessel.draft}&apos; D
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Boater */}
            {booking.boater && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{booking.boater.name}</span>
                <span className="text-muted-foreground">{booking.boater.email}</span>
              </div>
            )}

            {/* Dates */}
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>
                {new Date(booking.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' '}&ndash;{' '}
                {new Date(booking.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">${booking.totalPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Notes */}
            {booking.notes && (
              <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Notes:</span> {booking.notes}
              </div>
            )}

            {/* Actions */}
            {validNextStatuses.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </label>
                <div className="flex flex-wrap gap-2">
                  {validNextStatuses.map((nextStatus) => {
                    const config = actionConfig[nextStatus];
                    if (!config) return null;
                    const Icon = config.icon;
                    return (
                      <Button
                        key={nextStatus}
                        variant={config.variant}
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleAction(nextStatus)}
                      >
                        <Icon className="mr-1.5 h-3.5 w-3.5" />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Timestamps */}
            <div className="border-t pt-3 text-xs text-muted-foreground">
              <div>Created: {new Date(booking.createdAt).toLocaleString()}</div>
              <div>Updated: {new Date(booking.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmation dialog for cancel/check-out */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'cancelled' ? 'Cancel Booking' : 'Check Out'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'cancelled'
                ? `Are you sure you want to cancel booking #${booking.id}? This action cannot be undone.`
                : `Check out booking #${booking.id}? The slip will become available.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <Button
              variant={confirmAction === 'cancelled' ? 'destructive' : 'default'}
              onClick={() => confirmAction && executeAction(confirmAction)}
              disabled={isPending}
            >
              {isPending ? 'Processing...' : confirmAction === 'cancelled' ? 'Yes, Cancel' : 'Confirm Check Out'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
