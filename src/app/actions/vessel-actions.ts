'use server';

import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { vessels } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createVessel(data: {
  name: string;
  type: string;
  loa: number;
  beam: number;
  draft: number;
  registrationNumber?: string;
  year?: number;
}) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'boater') {
    return { success: false, error: 'Only boaters can register vessels' };
  }

  const [result] = await db
    .insert(vessels)
    .values({
      ownerId: session.userId,
      name: data.name,
      type: data.type,
      loa: data.loa,
      beam: data.beam,
      draft: data.draft,
      registrationNumber: data.registrationNumber ?? null,
      year: data.year ?? null,
      createdAt: new Date().toISOString(),
    })
    .returning();

  revalidatePath('/boater/vessels');

  return { success: true, vessel: result };
}

export async function deleteVessel(vesselId: number) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'boater') {
    return { success: false, error: 'Unauthorized' };
  }

  const vessel = await db.query.vessels.findFirst({
    where: and(eq(vessels.id, vesselId), eq(vessels.ownerId, session.userId)),
  });
  if (!vessel) return { success: false, error: 'Vessel not found' };

  await db.delete(vessels).where(eq(vessels.id, vesselId));
  revalidatePath('/boater/vessels');

  return { success: true };
}
