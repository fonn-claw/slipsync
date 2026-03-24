import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fuel } from 'lucide-react';

interface FuelSaleRow {
  id: number;
  fuelType: string;
  gallons: number;
  pricePerGallon: number;
  totalPrice: number;
  createdAt: string;
  slip?: { number: string; dock?: { name: string } | null } | null;
  boater?: { name: string } | null;
  recorder?: { name: string } | null;
}

export function FuelSalesTable({ sales, title = 'Recent Fuel Sales' }: { sales: FuelSaleRow[]; title?: string }) {
  if (sales.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <Fuel className="mx-auto mb-2 h-8 w-8 opacity-30" />
          No fuel sales recorded yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-3">Date</th>
                <th className="pb-2 pr-3">Slip</th>
                <th className="pb-2 pr-3">Boater</th>
                <th className="pb-2 pr-3">Type</th>
                <th className="pb-2 pr-3 text-right">Gallons</th>
                <th className="pb-2 pr-3 text-right">$/gal</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 text-muted-foreground">
                    {new Date(sale.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-2 pr-3 font-medium">
                    {sale.slip?.number}
                    <span className="ml-1 text-xs text-muted-foreground">{sale.slip?.dock?.name}</span>
                  </td>
                  <td className="py-2 pr-3">{sale.boater?.name}</td>
                  <td className="py-2 pr-3">
                    <Badge variant="outline" className={sale.fuelType === 'diesel' ? 'border-amber-300 text-amber-700' : 'border-blue-300 text-blue-700'}>
                      {sale.fuelType}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3 text-right font-mono">{sale.gallons.toFixed(1)}</td>
                  <td className="py-2 pr-3 text-right font-mono">${sale.pricePerGallon.toFixed(2)}</td>
                  <td className="py-2 text-right font-semibold">${sale.totalPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
