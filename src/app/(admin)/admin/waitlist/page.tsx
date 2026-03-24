import { getWaitlistEntries } from '@/lib/dal/dashboard';
import { WaitlistClient } from './waitlist-client';

export default async function WaitlistPage() {
  const entries = await getWaitlistEntries();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Waitlist</h1>
        <p className="text-sm text-muted-foreground">{entries.length} entries</p>
      </div>
      <WaitlistClient entries={entries} />
    </div>
  );
}
