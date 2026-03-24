'use server';

import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { slips } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function changeSlipStatus(
  slipId: number,
  newStatus: 'available' | 'occupied' | 'reserved' | 'maintenance',
  notes?: string,
) {
  const session = await getSession();

  if (!session.isLoggedIn || (session.role !== 'admin' && session.role !== 'dock_staff')) {
    throw new Error('Unauthorized');
  }

  await db
    .update(slips)
    .set({ status: newStatus, notes: notes ?? null })
    .where(eq(slips.id, slipId));

  revalidatePath('/marina');
  revalidatePath('/operations');
}
