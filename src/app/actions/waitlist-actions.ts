'use server';

import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { waitlist } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function removeFromWaitlist(entryId: number) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  db.delete(waitlist).where(eq(waitlist.id, entryId)).run();
  revalidatePath('/admin/waitlist');
  revalidatePath('/admin/dashboard');

  return { success: true };
}

export async function updateWaitlistStatus(
  entryId: number,
  status: 'waiting' | 'offered' | 'accepted' | 'expired',
) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  db.update(waitlist)
    .set({ status })
    .where(eq(waitlist.id, entryId))
    .run();

  revalidatePath('/admin/waitlist');
  revalidatePath('/admin/dashboard');

  return { success: true };
}
