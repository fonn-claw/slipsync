'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Fuel, CheckCircle, AlertCircle } from 'lucide-react';
import { recordFuelSale } from '@/app/actions/fuel-actions';

interface SlipOption {
  slipId: number;
  slipNumber: string;
  dockName: string;
  boaterId: number;
  boaterName: string;
  vesselName: string;
}

export function FuelSaleForm({ occupiedSlips }: { occupiedSlips: SlipOption[] }) {
  const [slipId, setSlipId] = useState('');
  const [fuelType, setFuelType] = useState<'diesel' | 'gas'>('diesel');
  const [gallons, setGallons] = useState('');
  const [pricePerGallon, setPricePerGallon] = useState(fuelType === 'diesel' ? '4.89' : '3.79');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  const selectedSlip = occupiedSlips.find((s) => String(s.slipId) === slipId);
  const totalPrice = gallons && pricePerGallon
    ? (parseFloat(gallons) * parseFloat(pricePerGallon)).toFixed(2)
    : '0.00';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlip) return;

    setLoading(true);
    setResult(null);

    const res = await recordFuelSale({
      slipId: selectedSlip.slipId,
      boaterId: selectedSlip.boaterId,
      fuelType,
      gallons: parseFloat(gallons),
      pricePerGallon: parseFloat(pricePerGallon),
    });

    setResult(res);
    setLoading(false);

    if (res.success) {
      setSlipId('');
      setGallons('');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5" /> Log Fuel Sale
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Slip</Label>
              <select
                value={slipId}
                onChange={(e) => setSlipId(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select occupied slip...</option>
                {occupiedSlips.map((s) => (
                  <option key={s.slipId} value={s.slipId}>
                    {s.slipNumber} (Dock {s.dockName}) — {s.boaterName} / {s.vesselName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Fuel Type</Label>
              <div className="mt-1 flex gap-2">
                <Button
                  type="button"
                  variant={fuelType === 'diesel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setFuelType('diesel'); setPricePerGallon('4.89'); }}
                >
                  Diesel
                </Button>
                <Button
                  type="button"
                  variant={fuelType === 'gas' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setFuelType('gas'); setPricePerGallon('3.79'); }}
                >
                  Gas
                </Button>
              </div>
            </div>
            <div>
              <Label>Gallons</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                value={gallons}
                onChange={(e) => setGallons(e.target.value)}
                placeholder="0.0"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Price per Gallon ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={pricePerGallon}
                onChange={(e) => setPricePerGallon(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-bold text-primary">${totalPrice}</span>
          </div>

          <Button type="submit" disabled={loading || !slipId || !gallons} className="w-full">
            {loading ? 'Recording...' : 'Record Fuel Sale'}
          </Button>
        </form>

        {result && (
          <div className={`mt-4 rounded-lg border p-3 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">Fuel sale recorded successfully</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">{result.error}</span>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
