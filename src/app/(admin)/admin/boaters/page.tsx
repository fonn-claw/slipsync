import { getAllBoaters } from '@/lib/dal/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Ship, Calendar } from 'lucide-react';

export default async function BoatersPage() {
  const boaters = await getAllBoaters();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Boaters</h1>
        <p className="text-sm text-muted-foreground">{boaters.length} registered boaters</p>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 border-b px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div>Name</div>
          <div>Contact</div>
          <div>Vessels</div>
          <div>Bookings</div>
        </div>
        {boaters.map((b) => (
          <div key={b.id} className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-4 border-b px-4 py-3 text-sm last:border-b-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {b.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">{b.name}</span>
            </div>
            <div className="text-muted-foreground">
              <div>{b.email}</div>
              {b.phone && <div className="text-xs">{b.phone}</div>}
            </div>
            <div className="flex items-center gap-1">
              <Ship className="h-3.5 w-3.5 text-muted-foreground" />
              <Badge variant="secondary">{b.vessels?.length ?? 0}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <Badge variant="secondary">{b.bookings?.length ?? 0}</Badge>
            </div>
          </div>
        ))}
        {boaters.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
            No boaters registered
          </div>
        )}
      </div>
    </div>
  );
}
