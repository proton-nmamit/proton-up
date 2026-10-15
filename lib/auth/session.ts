import { cache } from 'react';
import { headers, cookies } from 'next/headers';
import { auth } from '@/lib/auth/better-auth';
import { sql, isDbConfigured } from '@/lib/db';
import { DbProfile } from '@/lib/types/database';
import { isLocalDevMode, readLocalStore } from '@/lib/local-store';
import { getAdminPermissions } from '@/lib/auth/admin-privileges';

export interface AuthSessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role?: string | null;
  user_metadata?: { full_name?: string };
}

export const getCurrentUser = cache(async (): Promise<AuthSessionUser | null> => {
  if (isLocalDevMode()) {
    const cookieStore = await cookies();
    const devUserId = cookieStore.get('proton_dev_user_id')?.value;
    if (!devUserId) return null;
    const store = readLocalStore();
    const localUser = store.users.find((u) => u.id === devUserId);
    if (!localUser) return null;
    return {
      id: localUser.id,
      email: localUser.email,
      name: localUser.fullName,
      user_metadata: { full_name: localUser.fullName },
    };
  }

  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session || !session.user) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      role: (session.user as any).role,
      user_metadata: { full_name: session.user.name || undefined },
    };
  } catch (err) {
    console.error('[Session Error] Failed to get session from Better Auth:', err);
    return null;
  }
});

export const getCurrentProfile = cache(async (): Promise<DbProfile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  if (isLocalDevMode()) {
    const store = readLocalStore();
    const profile = store.profiles.find((p) => p.user_id === user.id);
    if (!profile) return null;
    const designation = store.designations.find((d) => d.id === profile.designation_id) || profile.designations;
    return {
      ...profile,
      designations: designation,
    };
  }

  if (isDbConfigured()) {
    try {
      const rows = await sql`
        SELECT 
          p.*,
          d.id AS des_id,
          d.name AS des_name,
          d.category AS des_category,
          d.category_label AS des_category_label,
          d.display_order AS des_display_order,
          d.description AS des_description,
          d.is_core AS des_is_core,
          d.is_active AS des_is_active
        FROM public.profiles p
        LEFT JOIN public.designations d ON p.designation_id = d.id
        WHERE p.user_id = ${user.id}
        LIMIT 1
      `;

      if (rows && rows.length > 0) {
        const r: any = rows[0];
        const designation = r.des_id
          ? {
              id: r.des_id,
              name: r.des_name,
              category: r.des_category,
              category_label: r.des_category_label,
              display_order: r.des_display_order,
              description: r.des_description,
              is_core: r.des_is_core,
              is_active: r.des_is_active,
            }
          : undefined;

        const {
          des_id,
          des_name,
          des_category,
          des_category_label,
          des_display_order,
          des_description,
          des_is_core,
          des_is_active,
          ...prof
        } = r;

        return {
          ...prof,
          designations: designation,
        } as DbProfile;
      }
    } catch (err) {
      console.error('[Session Error] Failed to fetch current profile from database:', err);
    }
  }

  // Resilient fallback for system administrators if database profile row is temporarily unreachable
  const adminPerms = getAdminPermissions(user.email);
  if (adminPerms.isFullAdmin || adminPerms.isEventsManager || adminPerms.isVicePresident) {
    return {
      id: `admin-${user.id}`,
      user_id: user.id,
      full_name: adminPerms.roleLabel,
      role: adminPerms.isSuperAdmin ? 'super_admin' : 'admin',
      status: 'approved',
      joining_year: '2024',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as DbProfile;
  }

  return null;
});

export const requireAdminSession = cache(async () => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required.');
  }

  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    const adminPerms = getAdminPermissions(user.email);
    if (!adminPerms.isFullAdmin && !adminPerms.isEventsManager && !adminPerms.isVicePresident) {
      throw new Error('Access denied. Administrator privileges required.');
    }
  }

  return { user, profile: profile! };
});

export const requireMemberSession = cache(async () => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required.');
  }

  const profile = await getCurrentProfile();
  return { user, profile };
});
