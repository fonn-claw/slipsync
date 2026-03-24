import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Anchor, Ship, DollarSign, Wrench, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { getDashboardStats, getRevenueOverview } from '@/lib/dal/dashboard';
import { getTodayArrivals, getTodayDepartures } from '@/lib/dal/bookings';
import { ArrivalsAndDepartures } from '@/components/booking/arrivals-departures';

export default async function DashboardPage() {
  const [stats, revenue, arrivals, departures] = await Promise.all([
    getDashboardStats(),
    getRevenueOverview(),
    getTodayArrivals(),
    getTodayDepartures(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Sunset Harbor Marina management overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Slips</CardTitle>
            <Anchor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Across 4 docks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Occupancy</CardTitle>
            <Ship className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.occupancyRate}%</span>
              <Badge variant="secondary" className="text-xs">{stats.occupied + stats.reserved}/{stats.total}</Badge>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div className="h-2 rounded-full bg-blue-500" style={{ width: `${stats.occupancyRate}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <p className="text-xs text-muted-foreground">Ready for booking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reserved</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
            <p className="text-xs text-muted-foreground">Upcoming check-ins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.maintenance}</div>
            <p className="text-xs text-muted-foreground">Out of service</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Overview */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenue.months.map((m) => (
                <div key={m.label} className="flex items-center gap-3">
                  <span className="w-20 text-sm text-muted-foreground">{m.label}</span>
                  <div className="flex-1">
                    <div className="h-6 rounded bg-muted">
                      <div
                        className="flex h-6 items-center rounded bg-primary/80 px-2 text-xs font-medium text-primary-foreground"
                        style={{ width: `${revenue.totalRevenue > 0 ? Math.max(5, (m.revenue / revenue.totalRevenue) * 100) : 5}%` }}
                      >
                        {m.revenue > 0 ? `$${m.revenue.toLocaleString()}` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Revenue by Dock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenue.byDock.map((d) => (
                <div key={d.dock} className="flex items-center justify-between">
                  <span className="text-sm font-medium">Dock {d.dock}</span>
                  <span className="text-sm font-bold">${d.revenue.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-lg font-bold text-primary">
                    ${revenue.totalRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Arrivals & Departures */}
      <ArrivalsAndDepartures arrivals={arrivals} departures={departures} />
    </div>
  );
}
