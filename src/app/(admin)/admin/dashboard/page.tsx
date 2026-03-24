import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Anchor, Ship, DollarSign, Wrench, CheckCircle, Clock, TrendingUp, Fuel, Activity, LogIn, LogOut, CalendarPlus } from 'lucide-react';
import { getDashboardStats, getRevenueOverview } from '@/lib/dal/dashboard';
import { getTodayArrivals, getTodayDepartures } from '@/lib/dal/bookings';
import { ArrivalsAndDepartures } from '@/components/booking/arrivals-departures';
import { WeatherWidget } from '@/components/weather-widget';
import { getWeather } from '@/lib/dal/weather';
import { getFuelRevenueSummary } from '@/lib/dal/fuel';
import { getTodayActivity, type ActivityItem } from '@/lib/dal/activity';

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  check_in: LogIn,
  check_out: LogOut,
  fuel_sale: Fuel,
  new_booking: CalendarPlus,
};

const activityColors: Record<string, string> = {
  check_in: 'text-green-600',
  check_out: 'text-orange-500',
  fuel_sale: 'text-amber-600',
  new_booking: 'text-blue-600',
};

export default async function DashboardPage() {
  const [stats, revenue, arrivals, departures, weather, fuelSummary, activity] = await Promise.all([
    getDashboardStats(),
    getRevenueOverview(),
    getTodayArrivals(),
    getTodayDepartures(),
    getWeather(),
    getFuelRevenueSummary(),
    getTodayActivity(),
  ]);

  const currentMonthFuel = fuelSummary.months[5]?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Sunset Harbor Marina management overview</p>
        </div>
      </div>

      {/* Weather + Quick Stats */}
      <div className="grid gap-4 lg:grid-cols-4">
        <WeatherWidget weather={weather} />
        <div className="lg:col-span-3">
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Fuel Revenue</CardTitle>
                <Fuel className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">${currentMonthFuel.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">This month</p>
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
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Monthly Revenue (Bookings)
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
                  <span className="text-sm font-semibold">Total (Bookings)</span>
                  <span className="text-lg font-bold text-primary">
                    ${revenue.totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">+ Fuel Revenue</span>
                  <span className="text-sm font-semibold text-amber-600">
                    ${fuelSummary.totalRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed + Arrivals/Departures */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Today's Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" /> Today&apos;s Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No activity today yet</p>
            ) : (
              <div className="space-y-3">
                {activity.map((item) => {
                  const Icon = activityIcons[item.type] || Activity;
                  const color = activityColors[item.type] || 'text-muted-foreground';
                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted ${color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <p className="text-sm font-medium">{item.description}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Arrivals & Departures */}
        <ArrivalsAndDepartures arrivals={arrivals} departures={departures} />
      </div>
    </div>
  );
}
