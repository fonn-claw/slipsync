'use server';

import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { maintenanceRequests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createMaintenanceRequest(data: {
  slipId: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}) {
  const session = await getSession();
  if (!session.isLoggedIn) return { success: false, error: 'Unauthorized' };

  const [result] = await db
    .insert(maintenanceRequests)
    .values({
      slipId: data.slipId,
      reportedBy: session.userId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: 'open',
      createdAt: new Date().toISOString(),
    })
    .returning();

  revalidatePath('/boater/maintenance');
  revalidatePath('/staff/maintenance');
  revalidatePath('/admin/maintenance');

  return { success: true, request: result };
}

export async function updateMaintenanceStatus(
  requestId: number,
  newStatus: 'open' | 'in_progress' | 'completed' | 'cancelled',
) {
  const session = await getSession();
  if (!session.isLoggedIn || (session.role !== 'admin' && session.role !== 'dock_staff')) {
    return { success: false, error: 'Unauthorized' };
  }

  const existing = await db.query.maintenanceRequests.findFirst({
    where: eq(maintenanceRequests.id, requestId),
  });
  if (!existing) return { success: false, error: 'Request not found' };

  await db.update(maintenanceRequests)
    .set({
      status: newStatus,
      resolvedAt: newStatus === 'completed' ? new Date().toISOString() : existing.resolvedAt,
      assignedTo: newStatus === 'in_progress' ? session.userId : existing.assignedTo,
    })
    .where(eq(maintenanceRequests.id, requestId));

  revalidatePath('/boater/maintenance');
  revalidatePath('/staff/maintenance');
  revalidatePath('/admin/maintenance');

  return { success: true };
}
