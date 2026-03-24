import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fuel, DollarSign, Droplets, TrendingUp } from 'lucide-react';
import { getFuelSales, getFuelRevenueSummary, getOccupiedSlipsWithBoaters } from '@/lib/dal/fuel';
import { FuelSaleForm } from '@/components/fuel-sale-form';
import { FuelSalesTable } from '@/components/fuel-sales-table';

export default async function AdminFuelPage() {
  const [sales, summary, occupiedSlips] = await Promise.all([
    getFuelSales(50),
    getFuelRevenueSummary(),
    getOccupiedSlipsWithBoaters(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Fuel Sales</h1>
        <p className="mt-1 text-muted-foreground">Track fuel revenue across the marina</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">All-time fuel sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Gallons</CardTitle>
            <Droplets className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalGallons.toLocaleString('en-US', { minimumFractionDigits: 1 })}</div>
            <p className="text-xs text-muted-foreground">Dispensed all-time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Revenue</CardTitle>
            <Fuel className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.todayRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">{summary.todayGallons.toFixed(1)} gal today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(summary.months[5]?.total ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">{summary.months[5]?.label}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Monthly Fuel Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.months.map((m) => {
              const maxRevenue = Math.max(...summary.months.map((mm) => mm.total), 1);
              return (
                <div key={m.label} className="flex items-center gap-3">
                  <span className="w-20 text-sm text-muted-foreground">{m.label}</span>
                  <div className="flex-1">
                    <div className="h-6 rounded bg-muted">
                      <div className="flex h-6">
                        {m.diesel > 0 && (
                          <div
                            className="flex h-6 items-center rounded-l bg-amber-500/80 px-1 text-xs font-medium text-white"
                            style={{ width: `${(m.diesel / maxRevenue) * 100}%` }}
                          />
                        )}
                        {m.gas > 0 && (
                          <div
                            className="flex h-6 items-center bg-blue-500/80 px-1 text-xs font-medium text-white last:rounded-r"
                            style={{ width: `${(m.gas / maxRevenue) * 100}%` }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="w-20 text-right text-sm font-semibold">
                    {m.total > 0 ? `$${m.total.toLocaleString()}` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-amber-500/80" /> Diesel</span>
            <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-blue-500/80" /> Gas</span>
          </div>
        </CardContent>
      </Card>

      <FuelSaleForm occupiedSlips={occupiedSlips} />
      <FuelSalesTable sales={sales} />
    </div>
  );
}
