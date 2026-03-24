'use server';

import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { fuelSales } from '@/db/schema';
import { revalidatePath } from 'next/cache';

interface FuelSaleInput {
  slipId: number;
  boaterId: number;
  fuelType: 'diesel' | 'gas';
  gallons: number;
  pricePerGallon: number;
}

export async function recordFuelSale(input: FuelSaleInput) {
  const session = await getSession();

  if (!session.isLoggedIn || (session.role !== 'admin' && session.role !== 'dock_staff')) {
    return { success: false, error: 'Unauthorized: Only admin and staff can record fuel sales' };
  }

  if (input.gallons <= 0 || input.pricePerGallon <= 0) {
    return { success: false, error: 'Gallons and price must be positive' };
  }

  const totalPrice = Math.round(input.gallons * input.pricePerGallon * 100) / 100;

  const [sale] = await db.insert(fuelSales).values({
    slipId: input.slipId,
    boaterId: input.boaterId,
    recordedBy: session.userId,
    fuelType: input.fuelType,
    gallons: input.gallons,
    pricePerGallon: input.pricePerGallon,
    totalPrice,
  }).returning();

  revalidatePath('/staff/fuel');
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/fuel');

  return { success: true, sale };
}
