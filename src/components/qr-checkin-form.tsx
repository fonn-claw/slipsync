'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, CheckCircle, AlertCircle } from 'lucide-react';
import { checkInByCode } from '@/app/actions/checkin-actions';

export function QrCheckInForm() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    error?: string;
    booking?: {
      slipNumber?: string;
      dockName?: string;
      vesselName?: string;
      boaterName?: string;
      checkedInAt: string;
    };
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await checkInByCode(code);
    setResult(res);
    setLoading(false);

    if (res.success) {
      setCode('');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" /> QR Code Check-In
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter booking code (e.g., SS-ABC123)"
            className="flex-1 font-mono uppercase"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !code.trim()}>
            {loading ? 'Checking...' : 'Check In'}
          </Button>
        </form>

        {result && (
          <div className={`mt-4 rounded-lg border p-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            {result.success && result.booking ? (
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Check-in successful!</p>
                  <div className="mt-1 space-y-0.5 text-sm text-green-700">
                    <p>Slip <span className="font-medium">{result.booking.slipNumber}</span> (Dock {result.booking.dockName})</p>
                    <p>Vessel: {result.booking.vesselName}</p>
                    <p>Boater: {result.booking.boaterName}</p>
                    <p className="text-xs text-green-600">
                      Checked in at {new Date(result.booking.checkedInAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">Check-in failed</p>
                  <p className="mt-1 text-sm text-red-700">{result.error}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
