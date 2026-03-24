'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBooking } from '@/app/actions/booking-actions';
import { vesselFitsSlip, calculateBookingPrice } from '@/lib/domain/booking-rules';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle, CheckCircle, DollarSign, Anchor, Ship, CalendarDays, User } from 'lucide-react';

interface SlipOption {
  id: number;
  number: string;
  maxLength: number;
  maxBeam: number;
  maxDraft: number;
  priceDaily: number;
  priceMonthly: number;
  dock: { name: string };
}

interface VesselOption {
  id: number;
  name: string;
  type: string;
  loa: number;
  beam: number;
  draft: number;
  ownerId: number;
}

interface BoaterOption {
  id: number;
  name: string;
  email: string;
}

interface BookingFormProps {
  slips: SlipOption[];
  vessels: VesselOption[];
  boaters: BoaterOption[];
  preSelectedSlipId?: number;
  preSelectedDate?: string;
}

export function BookingForm({ slips, vessels, boaters, preSelectedSlipId, preSelectedDate }: BookingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [slipId, setSlipId] = useState<string>(preSelectedSlipId ? String(preSelectedSlipId) : '');
  const [boaterId, setBoaterId] = useState<string>('');
  const [vesselId, setVesselId] = useState<string>('');
  const [bookingType, setBookingType] = useState<'transient' | 'seasonal'>('transient');
  const [startDate, setStartDate] = useState(preSelectedDate || '');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);

  const selectedSlip = useMemo(() => slips.find((s) => s.id === Number(slipId)), [slips, slipId]);
  const filteredVessels = useMemo(() => vessels.filter((v) => v.ownerId === Number(boaterId)), [vessels, boaterId]);
  const selectedVessel = useMemo(() => vessels.find((v) => v.id === Number(vesselId)), [vessels, vesselId]);

  // Vessel fit check
  const fitResult = useMemo(() => {
    if (!selectedSlip || !selectedVessel) return null;
    return vesselFitsSlip(
      { loa: selectedVessel.loa, beam: selectedVessel.beam, draft: selectedVessel.draft },
      { maxLength: selectedSlip.maxLength, maxBeam: selectedSlip.maxBeam, maxDraft: selectedSlip.maxDraft },
    );
  }, [selectedSlip, selectedVessel]);

  // Price calculation
  const price = useMemo(() => {
    if (!selectedSlip || !startDate || !endDate || endDate <= startDate) return null;
    try {
      return calculateBookingPrice(bookingType, startDate, endDate, {
        priceDaily: selectedSlip.priceDaily,
        priceMonthly: selectedSlip.priceMonthly,
      });
    } catch {
      return null;
    }
  }, [selectedSlip, bookingType, startDate, endDate]);

  const priceLabel = useMemo(() => {
    if (price === null || !selectedSlip || !startDate || !endDate) return '';
    if (bookingType === 'transient') {
      const days = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000);
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${days} night${days !== 1 ? 's' : ''} × $${selectedSlip.priceDaily}/night)`;
    }
    const months = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (30.44 * 86400000)));
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${months} month${months !== 1 ? 's' : ''} × $${selectedSlip.priceMonthly}/mo)`;
  }, [price, selectedSlip, bookingType, startDate, endDate]);

  const canSubmit = slipId && boaterId && vesselId && startDate && endDate && endDate > startDate && (fitResult?.fits !== false) && !isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setReasons([]);

    startTransition(async () => {
      const result = await createBooking({
        slipId: Number(slipId),
        vesselId: Number(vesselId),
        boaterId: Number(boaterId),
        type: bookingType,
        startDate,
        endDate,
        notes: notes || undefined,
      });

      if (result.success) {
        router.push('/admin/bookings');
      } else {
        setError(result.error || 'Failed to create booking');
        if (result.reasons) setReasons(result.reasons);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      {/* Slip Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Anchor className="h-4 w-4 text-primary" /> Slip Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={slipId} onValueChange={(v) => setSlipId(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Select a slip..." />
            </SelectTrigger>
            <SelectContent>
              {slips.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.number} ({s.dock.name}) &mdash; {s.maxLength}&apos; × {s.maxBeam}&apos; × {s.maxDraft}&apos;
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedSlip && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              ${selectedSlip.priceDaily}/day &middot; ${selectedSlip.priceMonthly}/mo
            </div>
          )}
        </CardContent>
      </Card>

      {/* Boater & Vessel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" /> Boater & Vessel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="boater">Boater</Label>
            <Select value={boaterId} onValueChange={(v) => { setBoaterId(v ?? ''); setVesselId(''); }}>
              <SelectTrigger id="boater">
                <SelectValue placeholder="Select a boater..." />
              </SelectTrigger>
              <SelectContent>
                {boaters.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name} ({b.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="vessel">Vessel</Label>
            <Select value={vesselId} onValueChange={(v) => setVesselId(v ?? '')} disabled={!boaterId}>
              <SelectTrigger id="vessel">
                <SelectValue placeholder={boaterId ? 'Select a vessel...' : 'Select boater first'} />
              </SelectTrigger>
              <SelectContent>
                {filteredVessels.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.name} ({v.type}) &mdash; LOA: {v.loa}&apos; / Beam: {v.beam}&apos; / Draft: {v.draft}&apos;
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vessel fit indicator */}
          {fitResult && !fitResult.fits && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertCircle className="h-4 w-4" /> Vessel does not fit this slip
              </div>
              <ul className="mt-1 list-inside list-disc text-xs text-destructive/80">
                {fitResult.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
          {fitResult && fitResult.fits && (
            <div className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 p-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" /> Vessel fits this slip
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Type & Dates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-primary" /> Booking Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Booking Type</Label>
            <RadioGroup
              value={bookingType}
              onValueChange={(v) => setBookingType(v as 'transient' | 'seasonal')}
              className="mt-2 flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="transient" id="transient" />
                <Label htmlFor="transient" className="font-normal">
                  Transient <span className="text-xs text-muted-foreground">(daily/weekly)</span>
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="seasonal" id="seasonal" />
                <Label htmlFor="seasonal" className="font-normal">
                  Seasonal <span className="text-xs text-muted-foreground">(monthly)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Check-in Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Check-out Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
              />
            </div>
          </div>

          {/* Rate display */}
          {price !== null && (
            <div className="flex items-center gap-2 rounded-md border bg-primary/5 p-3">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{priceLabel}</span>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              placeholder="Special requests, arrival time, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error display */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
          {reasons.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-xs text-destructive/80">
              {reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Submit */}
      <Button type="submit" className="w-full" size="lg" disabled={!canSubmit}>
        <Ship className="mr-2 h-4 w-4" />
        {isPending ? 'Creating Booking...' : 'Create Booking'}
      </Button>
    </form>
  );
}
