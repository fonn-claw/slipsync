'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return { error: 'Invalid email or password' };
  }

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.role = user.role;
  session.isLoggedIn = true;
  await session.save();

  const landing =
    user.role === 'admin'
      ? '/admin/dashboard'
      : user.role === 'dock_staff'
        ? '/staff/operations'
        : '/boater/my-bookings';
  redirect(landing);
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect('/login');
}
