'use client';

import { useState, useTransition } from 'react';
import type { SlipWithDetails } from '@/lib/dal/slips';
import { changeSlipStatus } from '@/app/actions/slip-actions';
import { STATUS_COLORS } from './map-constants';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Anchor,
  Droplets,
  Zap,
  Ruler,
  ChevronDown,
  Ship,
  CalendarDays,
  DollarSign,
} from 'lucide-react';

type SlipStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

const statusBadgeStyles: Record<SlipStatus, string> = {
  available: 'bg-green-500/15 text-green-700 border-green-500/25',
  occupied: 'bg-blue-500/15 text-blue-700 border-blue-500/25',
  reserved: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/25',
  maintenance: 'bg-red-500/15 text-red-700 border-red-500/25',
};

interface SlipDetailPanelProps {
  slip: SlipWithDetails | null;
  userRole: 'admin' | 'dock_staff' | 'boater';
  onClose: () => void;
}

export function SlipDetailPanel({ slip, userRole, onClose }: SlipDetailPanelProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<SlipStatus | null>(null);
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canChangeStatus = userRole === 'admin' || userRole === 'dock_staff';

  const handleStatusSelect = (status: SlipStatus) => {
    setPendingStatus(status);
    setMaintenanceNotes('');
    setError(null);
    setConfirmOpen(true);
  };

  const handleConfirmStatusChange = () => {
    if (!slip || !pendingStatus) return;
    startTransition(async () => {
      try {
        await changeSlipStatus(
          slip.id,
          pendingStatus,
          pendingStatus === 'maintenance' ? maintenanceNotes : undefined,
        );
        setConfirmOpen(false);
        setPendingStatus(null);
        setMaintenanceNotes('');
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to change status');
      }
    });
  };

  // Find active booking (checked_in or confirmed)
  const activeBooking = slip?.bookings?.find(
    (b) => b.status === 'checked_in' || b.status === 'confirmed',
  );

  return (
    <>
      <Sheet open={slip !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent side="right" className="overflow-y-auto">
          {slip && (
            <>
              {/* Header */}
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <SheetTitle className="text-lg">Slip {slip.number}</SheetTitle>
                  <Badge
                    variant="outline"
                    className={statusBadgeStyles[slip.status as SlipStatus] ?? ''}
                  >
                    {STATUS_COLORS[slip.status as keyof typeof STATUS_COLORS]?.label ?? slip.status}
                  </Badge>
                </div>
                <SheetDescription>
                  {slip.dock.name} &middot; {slip.dock.sizeCategory.replace('_', '-')} slip
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-4 px-4 pb-4">
                {/* Dimensions card */}
                <Card size="sm">
                  <CardHeader className="border-b pb-2">
                    <CardTitle className="flex items-center gap-1.5 text-sm">
                      <Ruler className="h-3.5 w-3.5" /> Dimensions & Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-lg font-semibold text-foreground">{slip.maxLength}&apos;</div>
                        <div className="text-xs text-muted-foreground">Length</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-foreground">{slip.maxBeam}&apos;</div>
                        <div className="text-xs text-muted-foreground">Beam</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-foreground">{slip.maxDraft}&apos;</div>
                        <div className="text-xs text-muted-foreground">Draft</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>${slip.priceDaily}/day</span>
                        <span className="text-muted-foreground">&middot;</span>
                        <span>${slip.priceMonthly}/mo</span>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-3">
                      <div className="flex items-center gap-1 text-xs">
                        <Zap className={`h-3.5 w-3.5 ${slip.hasElectric ? 'text-yellow-500' : 'text-muted-foreground/30'}`} />
                        <span className={slip.hasElectric ? '' : 'text-muted-foreground/50'}>Electric</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Droplets className={`h-3.5 w-3.5 ${slip.hasWater ? 'text-blue-500' : 'text-muted-foreground/30'}`} />
                        <span className={slip.hasWater ? '' : 'text-muted-foreground/50'}>Water</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Current vessel card */}
                {activeBooking && activeBooking.vessel && (
                  <Card size="sm">
                    <CardHeader className="border-b pb-2">
                      <CardTitle className="flex items-center gap-1.5 text-sm">
                        <Ship className="h-3.5 w-3.5" /> Current Vessel
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{activeBooking.vessel.name}</span>
                          <Badge variant="secondary" className="text-xs">{activeBooking.vessel.type}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activeBooking.vessel.loa}&apos; LOA x {activeBooking.vessel.beam}&apos; B x {activeBooking.vessel.draft}&apos; D
                        </div>
                        {activeBooking.boater && (
                          <div className="flex items-center justify-between border-t pt-2 text-xs">
                            <span className="font-medium">{activeBooking.boater.name}</span>
                            <span className="text-muted-foreground">{activeBooking.boater.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(activeBooking.startDate).toLocaleDateString()} &ndash;{' '}
                          {new Date(activeBooking.endDate).toLocaleDateString()}
                          <Badge variant="outline" className="ml-auto text-[10px]">{activeBooking.status.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Booking history */}
                <Card size="sm">
                  <CardHeader className="border-b pb-2">
                    <CardTitle className="flex items-center gap-1.5 text-sm">
                      <CalendarDays className="h-3.5 w-3.5" /> Booking History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {slip.bookings && slip.bookings.length > 0 ? (
                      <ScrollArea className="max-h-40">
                        <div className="space-y-2">
                          {slip.bookings.slice(0, 5).map((booking) => (
                            <div
                              key={booking.id}
                              className="flex items-center justify-between rounded-md border bg-muted/30 px-2 py-1.5 text-xs"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {booking.vessel?.name ?? 'Unknown vessel'}
                                </span>
                                <span className="text-muted-foreground">
                                  {new Date(booking.startDate).toLocaleDateString()} &ndash;{' '}
                                  {new Date(booking.endDate).toLocaleDateString()}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-[10px]">
                                {booking.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="py-3 text-center text-xs text-muted-foreground">No booking history</p>
                    )}
                  </CardContent>
                </Card>

                {/* Status change section (admin/staff only) */}
                {canChangeStatus && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Change Status
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="outline" className="w-full justify-between">
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: STATUS_COLORS[slip.status as keyof typeof STATUS_COLORS]?.fill }}
                              />
                              {STATUS_COLORS[slip.status as keyof typeof STATUS_COLORS]?.label ?? slip.status}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Set status to</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {(Object.entries(STATUS_COLORS) as [SlipStatus, typeof STATUS_COLORS[keyof typeof STATUS_COLORS]][]).map(
                          ([status, { fill, label }]) => (
                            <DropdownMenuItem
                              key={status}
                              disabled={status === slip.status}
                              onSelect={() => handleStatusSelect(status)}
                            >
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: fill }}
                              />
                              {label}
                              {status === slip.status && (
                                <span className="ml-auto text-xs text-muted-foreground">(current)</span>
                              )}
                            </DropdownMenuItem>
                          ),
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {/* Notes */}
                {slip.notes && (
                  <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Notes:</span> {slip.notes}
                  </div>
                )}

                {/* Book this slip CTA */}
                {slip.status === 'available' && (
                  <Button disabled className="w-full" variant="outline">
                    <Anchor className="mr-2 h-4 w-4" />
                    Book this Slip (Coming Soon)
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Status change confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Slip Status</AlertDialogTitle>
            <AlertDialogDescription>
              Change slip {slip?.number} status to{' '}
              <strong className="capitalize">{pendingStatus}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingStatus === 'maintenance' && (
            <div className="space-y-1.5">
              <label htmlFor="maintenance-notes" className="text-sm font-medium">
                Maintenance Notes
              </label>
              <textarea
                id="maintenance-notes"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="Describe the maintenance issue..."
                value={maintenanceNotes}
                onChange={(e) => setMaintenanceNotes(e.target.value)}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={handleConfirmStatusChange} disabled={isPending}>
              {isPending ? 'Updating...' : 'Confirm'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
