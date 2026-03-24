'use client';

import { useState, useTransition } from 'react';
import { createVessel } from '@/app/actions/vessel-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ship, Plus, Ruler } from 'lucide-react';

interface VesselsClientProps {
  vessels: {
    id: number;
    name: string;
    type: string;
    loa: number;
    beam: number;
    draft: number;
    registrationNumber: string | null;
    year: number | null;
  }[];
}

export function VesselsClient({ vessels }: VesselsClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createVessel({
        name: form.get('name') as string,
        type: form.get('type') as string,
        loa: Number(form.get('loa')),
        beam: Number(form.get('beam')),
        draft: Number(form.get('draft')),
        registrationNumber: (form.get('registrationNumber') as string) || undefined,
        year: form.get('year') ? Number(form.get('year')) : undefined,
      });

      if (result.success) {
        setShowForm(false);
      } else {
        setError(result.error || 'Failed to register vessel');
      }
    });
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'default'}>
        <Plus className="mr-2 h-4 w-4" />
        {showForm ? 'Cancel' : 'Register New Vessel'}
      </Button>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Vessel Name</Label>
                  <Input id="name" name="name" required placeholder="Sea Breeze" />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Input id="type" name="type" required placeholder="Sailboat, Motor Yacht, etc." />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="loa">LOA (ft)</Label>
                  <Input id="loa" name="loa" type="number" step="0.1" required placeholder="24" />
                </div>
                <div>
                  <Label htmlFor="beam">Beam (ft)</Label>
                  <Input id="beam" name="beam" type="number" step="0.1" required placeholder="8" />
                </div>
                <div>
                  <Label htmlFor="draft">Draft (ft)</Label>
                  <Input id="draft" name="draft" type="number" step="0.1" required placeholder="4" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="registrationNumber">Registration # (optional)</Label>
                  <Input id="registrationNumber" name="registrationNumber" placeholder="FL-1234-AB" />
                </div>
                <div>
                  <Label htmlFor="year">Year (optional)</Label>
                  <Input id="year" name="year" type="number" placeholder="2020" />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Registering...' : 'Register Vessel'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {vessels.map((v) => (
          <Card key={v.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Ship className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{v.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{v.type}</Badge>
                </div>
                {v.year && <span className="text-sm text-muted-foreground">{v.year}</span>}
              </div>
              <div className="mt-3 flex items-center gap-1 text-sm">
                <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{v.loa}&apos; LOA</span>
                <span className="text-muted-foreground">&times;</span>
                <span>{v.beam}&apos; B</span>
                <span className="text-muted-foreground">&times;</span>
                <span>{v.draft}&apos; D</span>
              </div>
              {v.registrationNumber && (
                <div className="mt-1 text-xs text-muted-foreground">Reg: {v.registrationNumber}</div>
              )}
            </CardContent>
          </Card>
        ))}
        {vessels.length === 0 && !showForm && (
          <Card className="col-span-2">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              <Ship className="mx-auto mb-2 h-8 w-8 opacity-30" />
              No vessels registered yet. Click &quot;Register New Vessel&quot; to add one.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
