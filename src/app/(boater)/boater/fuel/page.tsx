import { getSession } from '@/lib/auth';
import { getFuelSalesByBoater } from '@/lib/dal/fuel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fuel, DollarSign } from 'lucide-react';

export default async function BoaterFuelPage() {
  const session = await getSession();
  const sales = await getFuelSalesByBoater(session.userId);

  const totalSpent = sales.reduce((sum, s) => sum + s.totalPrice, 0);
  const totalGallons = sales.reduce((sum, s) => sum + s.gallons, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Fuel Charges</h1>
        <p className="mt-1 text-muted-foreground">Your fuel purchase history at the marina</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Gallons</CardTitle>
            <Fuel className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGallons.toFixed(1)} gal</div>
          </CardContent>
        </Card>
      </div>

      {/* Sales List */}
      {sales.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <Fuel className="mx-auto mb-2 h-8 w-8 opacity-30" />
            No fuel purchases yet
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Purchase History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      Slip {sale.slip?.number}
                      <Badge variant="outline" className={sale.fuelType === 'diesel' ? 'border-amber-300 text-amber-700' : 'border-blue-300 text-blue-700'}>
                        {sale.fuelType}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sale.gallons.toFixed(1)} gal @ ${sale.pricePerGallon.toFixed(2)}/gal
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-primary">${sale.totalPrice.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
