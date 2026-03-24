import { db } from '@/db';
import { vessels } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ship, Ruler } from 'lucide-react';
import { VesselsClient } from './vessels-client';

export default async function VesselsPage() {
  const session = await getSession();

  const myVessels = await db.query.vessels.findMany({
    where: eq(vessels.ownerId, session.userId),
    orderBy: (v, { desc }) => [desc(v.createdAt)],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Vessels</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your registered vessels ({myVessels.length} vessel{myVessels.length !== 1 ? 's' : ''})
        </p>
      </div>
      <VesselsClient vessels={myVessels} />
    </div>
  );
}
