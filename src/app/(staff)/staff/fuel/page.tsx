import { getFuelSales, getOccupiedSlipsWithBoaters } from '@/lib/dal/fuel';
import { FuelSaleForm } from '@/components/fuel-sale-form';
import { FuelSalesTable } from '@/components/fuel-sales-table';

export default async function StaffFuelPage() {
  const [sales, occupiedSlips] = await Promise.all([
    getFuelSales(30),
    getOccupiedSlipsWithBoaters(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Fuel Sales</h1>
        <p className="text-sm text-muted-foreground">Log fuel dispensed to occupied slips</p>
      </div>
      <FuelSaleForm occupiedSlips={occupiedSlips} />
      <FuelSalesTable sales={sales} />
    </div>
  );
}
