import { db } from '@/db';
import { slips } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Anchor, Ruler, DollarSign, Zap, Droplets } from 'lucide-react';

const sizeLabels: Record<string, string> = {
  small: 'Small (20-30\')',
  medium: 'Medium (30-45\')',
  large: 'Large (45-65\')',
  extra_large: 'Extra Large (65-100\')',
};

export default async function BrowseSlipsPage() {
  const allSlips = await db.query.slips.findMany({
    where: eq(slips.status, 'available'),
    with: { dock: true },
    orderBy: (s, { asc }) => [asc(s.number)],
  });

  // Group by dock
  const byDock = allSlips.reduce<Record<string, typeof allSlips>>((acc, slip) => {
    const key = slip.dock.name;
    (acc[key] = acc[key] || []).push(slip);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Browse Available Slips</h1>
        <p className="mt-1 text-muted-foreground">
          {allSlips.length} slips available for booking
        </p>
      </div>

      {Object.entries(byDock).map(([dockName, dockSlips]) => (
        <div key={dockName}>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Anchor className="h-5 w-5 text-primary" />
            Dock {dockName}
            <Badge variant="secondary">{dockSlips.length} available</Badge>
            <span className="text-sm font-normal text-muted-foreground">
              {sizeLabels[dockSlips[0]?.dock.sizeCategory] ?? ''}
            </span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dockSlips.map((slip) => (
              <Card key={slip.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{slip.number}</span>
                    <Badge variant="outline" className="bg-green-500/15 text-green-700 border-green-500/25">
                      Available
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-sm font-semibold">{slip.maxLength}&apos;</div>
                      <div className="text-[10px] text-muted-foreground">Length</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{slip.maxBeam}&apos;</div>
                      <div className="text-[10px] text-muted-foreground">Beam</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{slip.maxDraft}&apos;</div>
                      <div className="text-[10px] text-muted-foreground">Draft</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">${slip.priceDaily}/day</span>
                      <span className="text-muted-foreground">&middot; ${slip.priceMonthly}/mo</span>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-3 text-xs">
                    {slip.hasElectric && (
                      <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-yellow-500" /> Electric</span>
                    )}
                    {slip.hasWater && (
                      <span className="flex items-center gap-1"><Droplets className="h-3 w-3 text-blue-500" /> Water</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {allSlips.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Anchor className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground">No slips available at this time</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
