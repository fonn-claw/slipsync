import { getMaintenanceRequests } from '@/lib/dal/dashboard';
import { Badge } from '@/components/ui/badge';
import { MaintenanceListClient } from './maintenance-client';

export default async function AdminMaintenancePage() {
  const requests = await getMaintenanceRequests();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Maintenance Requests</h1>
        <p className="text-sm text-muted-foreground">{requests.length} total requests</p>
      </div>
      <MaintenanceListClient requests={requests} />
    </div>
  );
}
