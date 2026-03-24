import { getSlipsWithDetails } from '@/lib/dal/slips';
import { getSession } from '@/lib/auth';
import { MarinaMap } from '@/components/marina-map/marina-map';

export default async function OperationsPage() {
  const [session, slips] = await Promise.all([
    getSession(),
    getSlipsWithDetails(),
  ]);

  const total = slips.length;
  const occupied = slips.filter((s) => s.status === 'occupied').length;
  const available = slips.filter((s) => s.status === 'available').length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Operations &mdash; Marina Map
        </h1>
        <p className="text-sm text-muted-foreground">
          {occupied} occupied &middot; {available} available &middot; {total} total slips
        </p>
      </div>

      {/* Interactive marina map */}
      <MarinaMap slips={slips} userRole={session.role} />
    </div>
  );
}
