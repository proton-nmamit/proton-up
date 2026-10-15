'use server'

import { sql, isDbConfigured } from '@/lib/db'
import { requireAdminSession } from '@/lib/auth/session'
import { DbProfile, DbDesignation, MemberStatus } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import { isLocalDevMode, readLocalStore, writeLocalStore } from '@/lib/local-store'
import { logActivity } from '@/lib/audit-service'
import { getAdminPermissions, AdminPermissions } from '@/lib/auth/admin-privileges'

export interface AdminMemberWithDetails extends DbProfile {
  email?: string | null
}

/**
 * Retrieves all registered member profiles with designation details and auth email.
 */
function isProtonAdministrator(p: { full_name?: string | null; role?: string | null; email?: string | null }): boolean {
  const name = (p.full_name || '').toLowerCase().trim()
  const email = (p.email || '').toLowerCase().trim()
  return name === 'proton administrator' || email === 'admin@proton.cyber' || p.role === 'super_admin'
}

export async function getAdminMembersList(): Promise<{
  members: AdminMemberWithDetails[]
  designations: DbDesignation[]
  adminPermissions?: AdminPermissions
  error?: string
}> {
  try {
    const { user } = await requireAdminSession()
    const adminPermissions = getAdminPermissions(user.email)

    if (adminPermissions.isEventsManager) {
      return { members: [], designations: [], adminPermissions, error: 'Access restricted to Events and Gallery.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const emailMap: Record<string, string> = {}
      for (const u of store.users) {
        if (u.id && u.email) emailMap[u.id] = u.email
      }
      const members: AdminMemberWithDetails[] = store.profiles
        .map((p) => ({
          ...p,
          email: p.user_id ? emailMap[p.user_id] || null : null,
          designations: store.designations.find((d) => d.id === p.designation_id) || p.designations,
        }))
        .filter((p) => !isProtonAdministrator(p))
      return {
        members,
        designations: store.designations,
        adminPermissions,
      }
    }

    if (!isDbConfigured()) {
      return { members: [], designations: [], error: 'Database service is unconfigured' }
    }

    const [profilesRows, designations] = await Promise.all([
      sql`
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
        ORDER BY p.created_at DESC
      `,
      sql`
        SELECT * FROM public.designations
        WHERE is_active = true
        ORDER BY display_order ASC
      `,
    ])

    // Map auth user emails from neon_auth.user
    let emailMap: Record<string, string> = {}
    try {
      const authUsers = await sql`
        SELECT id, email FROM neon_auth.user
      `
      if (authUsers && authUsers.length > 0) {
        for (const u of authUsers as any[]) {
          if (u.id && u.email) {
            emailMap[u.id] = u.email
          }
        }
      }
    } catch (e) {
      console.warn('[getAdminMembersList] neon_auth.user email lookup note:', e)
    }

    const members: AdminMemberWithDetails[] = (profilesRows as any[])
      .map((r: any) => {
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
          : undefined

        const { des_id, des_name, des_category, des_category_label, des_display_order, des_description, des_is_core, des_is_active, ...prof } = r
        return {
          ...prof,
          email: prof.user_id ? emailMap[prof.user_id] || null : null,
          designations: designation,
        }
      })
      .filter((p) => !isProtonAdministrator(p))

    return {
      members,
      designations: (designations as any[] as DbDesignation[]) || [],
      adminPermissions,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unauthorized'
    return { members: [], designations: [], error: msg }
  }
}

/**
 * Approves a pending member profile.
 */
export async function approveMemberAction(profileId: string) {
  try {
    const { user, profile } = await requireAdminSession()
    const permissions = getAdminPermissions(user.email)
    if (!permissions.canApproveMembers) {
      return { error: 'Permission denied: Your account cannot approve members.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const p = store.profiles.find((x) => x.id === profileId)
      if (p) {
        p.status = 'approved'
        p.rejection_reason = null
        p.updated_at = new Date().toISOString()
        writeLocalStore(store)

        await logActivity({
          action: 'MEMBER_APPROVED',
          actorId: user.id,
          actorEmail: user.email || 'admin@proton.cyber',
          actorName: profile?.full_name || 'Administrator',
          actorRole: profile?.role || 'admin',
          targetId: profileId,
          targetName: p.full_name,
          targetType: 'member',
          details: { status: 'approved' },
        })
      }
      revalidatePath('/admin/members')
      revalidatePath('/admin/logs')
      revalidatePath('/teams')
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Database client unavailable' }

    const targetRows = await sql`
      SELECT full_name, usn FROM public.profiles WHERE id = ${profileId} LIMIT 1
    `
    const targetProfile: any = (targetRows as any[])[0]

    await sql`
      UPDATE public.profiles
      SET status = 'approved',
          rejection_reason = NULL,
          updated_at = now()
      WHERE id = ${profileId}
    `

    await logActivity({
      action: 'MEMBER_APPROVED',
      actorId: user.id,
      actorEmail: user.email || 'admin@proton.cyber',
      actorName: profile?.full_name || 'Administrator',
      actorRole: profile?.role || 'admin',
      targetId: profileId,
      targetName: targetProfile?.full_name || 'Member',
      targetType: 'member',
      details: { status: 'approved', usn: targetProfile?.usn },
    })

    revalidatePath('/admin/members')
    revalidatePath('/admin/logs')
    revalidatePath('/teams')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Approval failed'
    return { error: msg }
  }
}

/**
 * Rejects a member profile with an optional or required explanation.
 */
export async function rejectMemberAction(profileId: string, rejectionReason: string) {
  try {
    const { user, profile } = await requireAdminSession()
    const permissions = getAdminPermissions(user.email)
    if (!permissions.canRevokeMembers) {
      return {
        error:
          'Permission denied: Vice President privileges are strictly limited to approving members. You cannot reject or revoke memberships.',
      }
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      return { error: 'Please provide a reason for rejecting this profile.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const p = store.profiles.find((x) => x.id === profileId)
      if (p) {
        if (p.role === 'super_admin' || p.full_name === 'PROTON Administrator' || p.user_id === user.id) {
          return { error: 'Security restriction: Cannot revoke the master super administrator or your own account.' }
        }

        if (p.role === 'admin' && !permissions.isSuperAdmin) {
          return {
            error:
              'Hierarchy restriction: Only the Super Administrator (admin@proton.cyber) can revoke or deactivate official administrator accounts.',
          }
        }

        p.status = 'rejected'
        p.rejection_reason = rejectionReason.trim()
        p.updated_at = new Date().toISOString()
        writeLocalStore(store)

        await logActivity({
          action: 'MEMBER_REJECTED',
          actorId: user.id,
          actorEmail: user.email || 'admin@proton.cyber',
          actorName: profile?.full_name || 'Administrator',
          actorRole: profile?.role || 'admin',
          targetId: profileId,
          targetName: p.full_name,
          targetType: 'member',
          details: { status: 'rejected', reason: rejectionReason.trim() },
        })
      }
      revalidatePath('/admin/members')
      revalidatePath('/admin/logs')
      revalidatePath('/teams')
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Database client unavailable' }

    const targetRows = await sql`
      SELECT full_name, usn, role, user_id FROM public.profiles WHERE id = ${profileId} LIMIT 1
    `
    const targetProfile: any = (targetRows as any[])[0]

    if (
      targetProfile?.role === 'super_admin' ||
      targetProfile?.full_name === 'PROTON Administrator' ||
      targetProfile?.user_id === user.id
    ) {
      return { error: 'Security restriction: Cannot revoke the master super administrator or your own account.' }
    }

    if (targetProfile?.role === 'admin' && !permissions.isSuperAdmin) {
      return {
        error:
          'Hierarchy restriction: Only the Super Administrator (admin@proton.cyber) can revoke or deactivate official administrator accounts.',
      }
    }

    await sql`
      UPDATE public.profiles
      SET status = 'rejected',
          rejection_reason = ${rejectionReason.trim()},
          updated_at = now()
      WHERE id = ${profileId}
    `

    await logActivity({
      action: 'MEMBER_REJECTED',
      actorId: user.id,
      actorEmail: user.email || 'admin@proton.cyber',
      actorName: profile?.full_name || 'Administrator',
      actorRole: profile?.role || 'admin',
      targetId: profileId,
      targetName: targetProfile?.full_name || 'Member',
      targetType: 'member',
      details: { status: 'rejected', reason: rejectionReason.trim(), usn: targetProfile?.usn },
    })

    revalidatePath('/admin/members')
    revalidatePath('/admin/logs')
    revalidatePath('/teams')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Rejection failed'
    return { error: msg }
  }
}

/**
 * Permanently deletes a member from the club.
 * Completely destroys their Supabase Auth user record so they cannot log in to admin or member portals,
 * erases their profile, revokes invitations, and generates an immutable audit log record.
 * Requires two levels of admin confirmation.
 */
export async function deleteMemberPermanentlyAction(
  profileId: string,
  reason: string,
  typedConfirmation: string
) {
  try {
    const { user, profile } = await requireAdminSession()
    const permissions = getAdminPermissions(user.email)
    if (!permissions.canDeleteMembers) {
      return {
        error:
          'Permission denied: Vice President privileges do not permit permanent member deletion or expulsion.',
      }
    }

    if (!reason || reason.trim().length < 3) {
      return { error: 'A valid reason of at least 3 characters is strictly required for permanent deletion.' }
    }

    if (!typedConfirmation || !typedConfirmation.trim()) {
      return { error: 'Please enter the confirmation text.' }
    }

    // Local dev mode
    if (isLocalDevMode()) {
      const store = readLocalStore()
      const targetMember = store.profiles.find((p) => p.id === profileId)
      if (!targetMember) return { error: 'Member profile not found.' }

      if (
        targetMember.role === 'super_admin' ||
        targetMember.full_name === 'PROTON Administrator' ||
        targetMember.user_id === user.id
      ) {
        return { error: 'Security restriction: Cannot delete the master super administrator or your own active account.' }
      }

      if (targetMember.role === 'admin' && !permissions.isSuperAdmin) {
        return {
          error:
            'Hierarchy restriction: Only the Super Administrator (admin@proton.cyber) has top-level authority to permanently delete or expel official administrator accounts.',
        }
      }

      if (
        typedConfirmation.trim().toLowerCase() !== targetMember.full_name.trim().toLowerCase() &&
        typedConfirmation.trim().toUpperCase() !== 'DELETE'
      ) {
        return { error: `Confirmation mismatch. You must type "${targetMember.full_name}" or "DELETE" to verify.` }
      }

      const targetUser = store.users.find((u) => u.id === targetMember.user_id)
      const targetEmail = targetUser?.email || null

      store.profiles = store.profiles.filter((p) => p.id !== profileId)
      if (targetMember.user_id) {
        store.users = store.users.filter((u) => u.id !== targetMember.user_id)
      }
      if (targetEmail) {
        store.invitations = store.invitations.filter((i) => i.email.toLowerCase() !== targetEmail.toLowerCase())
      }
      writeLocalStore(store)

      await logActivity({
        action: 'MEMBER_PERMANENTLY_DELETED',
        actorId: user.id,
        actorEmail: user.email || 'admin@proton.cyber',
        actorName: profile?.full_name || 'Administrator',
        actorRole: profile?.role || 'admin',
        targetId: profileId,
        targetName: targetMember.full_name,
        targetEmail: targetEmail,
        targetType: 'member',
        details: {
          reason: reason.trim(),
          usn: targetMember.usn,
          designation: (targetMember as any).designations?.name || targetMember.custom_role_text,
          branch: targetMember.branch,
          year: targetMember.year,
          two_factor_confirmed: true,
          typed_confirmation: typedConfirmation,
          auth_user_deleted: Boolean(targetMember.user_id),
        },
      })

      revalidatePath('/admin/members')
      revalidatePath('/admin/logs')
      revalidatePath('/teams')
      return { success: true, deletedName: targetMember.full_name }
    }

    if (!isDbConfigured()) return { error: 'Database client unavailable' }

    // 1. Fetch target member details from Neon
    const targetRows = await sql`
      SELECT 
        p.*,
        d.name AS designation_name
      FROM public.profiles p
      LEFT JOIN public.designations d ON p.designation_id = d.id
      WHERE p.id = ${profileId}
      LIMIT 1
    `

    if (!targetRows || targetRows.length === 0) {
      return { error: 'Target member profile was not found.' }
    }

    const targetMember: any = targetRows[0]

    // Guard: Prevent deleting master super admin or self
    if (
      targetMember.role === 'super_admin' ||
      targetMember.full_name === 'PROTON Administrator' ||
      targetMember.user_id === user.id
    ) {
      return { error: 'Security restriction: Cannot delete the master super administrator or your own active account.' }
    }

    // Guard: Only the Super Administrator (admin@proton.cyber) can delete/expel administrator accounts
    if (targetMember.role === 'admin' && !permissions.isSuperAdmin) {
      return {
        error:
          'Hierarchy restriction: Only the Super Administrator (admin@proton.cyber) has top-level authority to permanently delete or expel official administrator accounts.',
      }
    }

    if (
      typedConfirmation.trim().toLowerCase() !== targetMember.full_name.trim().toLowerCase() &&
      typedConfirmation.trim().toUpperCase() !== 'DELETE'
    ) {
      return { error: `Confirmation mismatch. You must type "${targetMember.full_name}" or "DELETE" to verify.` }
    }

    // 2. Fetch email and purge security record from Neon Auth
    let targetEmail: string | null = null
    let targetUserId: string | null = targetMember.user_id || null
    let authDeleted = false

    if (targetUserId) {
      try {
        const authUserRows = await sql`
          SELECT email FROM neon_auth.user WHERE id = ${targetUserId} LIMIT 1
        `
        if (authUserRows && authUserRows.length > 0) {
          targetEmail = (authUserRows as any[])[0].email
        }
        await sql`DELETE FROM neon_auth.session WHERE "userId" = ${targetUserId}`
        await sql`DELETE FROM neon_auth.account WHERE "userId" = ${targetUserId}`
        await sql`DELETE FROM neon_auth.user WHERE id = ${targetUserId}`
        authDeleted = true
      } catch (authEx) {
        console.error('Failed to delete neon auth user:', authEx)
      }
    }

    // 4. Delete profile row from Neon
    await sql`DELETE FROM public.profiles WHERE id = ${profileId}`

    // 5. Delete associated invitations from Neon
    if (targetEmail) {
      try {
        await sql`DELETE FROM public.invitations WHERE lower(email) = ${targetEmail.toLowerCase()}`
      } catch {
        // Ignored
      }
    }

    // 6. Record immutable audit entry in Neon
    await logActivity({
      action: 'MEMBER_PERMANENTLY_DELETED',
      actorId: user.id,
      actorEmail: user.email || 'admin@proton.cyber',
      actorName: profile?.full_name || 'Administrator',
      actorRole: profile?.role || 'admin',
      targetId: profileId,
      targetName: targetMember.full_name,
      targetEmail: targetEmail,
      targetType: 'member',
      details: {
        reason: reason.trim(),
        usn: targetMember.usn,
        designation: targetMember.designation_name || targetMember.custom_role_text,
        branch: targetMember.branch,
        year: targetMember.year,
        two_factor_confirmed: true,
        typed_confirmation: typedConfirmation,
        auth_user_deleted: authDeleted,
      },
    })

    revalidatePath('/admin/members')
    revalidatePath('/admin/logs')
    revalidatePath('/teams')
    return { success: true, deletedName: targetMember.full_name }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Permanent deletion failed'
    return { error: msg }
  }
}

/**
 * Administratively edits a member's profile information.
 * Uses strict whitelist: prevents modifying role, user_id, or created_at.
 */
export async function updateMemberByAdminAction(formData: FormData) {
  try {
    const { user, profile } = await requireAdminSession()
    const permissions = getAdminPermissions(user.email)
    if (!permissions.canEditMembers) {
      return {
        error:
          'Permission denied: Vice President privileges do not permit modifying member dossiers.',
      }
    }

    const profileId = formData.get('id') as string
    if (!profileId) {
      return { error: 'Profile ID is required.' }
    }

    const fullName = (formData.get('full_name') as string)?.trim()
    const branch = (formData.get('branch') as string)?.trim() || null
    const year = (formData.get('year') as string)?.trim() || null
    const joiningYear = (formData.get('joining_year') as string)?.trim() || null
    const designationId = (formData.get('designation_id') as string)?.trim() || null
    const hasDepartment = formData.has('department')
    const department = hasDepartment ? ((formData.get('department') as string)?.trim() || null) : undefined
    const bio = (formData.get('bio') as string)?.trim() || null
    const usn = (formData.get('usn') as string)?.trim() || null
    const phone = (formData.get('phone') as string)?.trim() || null
    const githubUrl = (formData.get('github_url') as string)?.trim() || null
    const linkedinUrl = (formData.get('linkedin_url') as string)?.trim() || null
    const instagramUrl = (formData.get('instagram_url') as string)?.trim() || null
    const portfolioUrl = (formData.get('portfolio_url') as string)?.trim() || null
    const status = (formData.get('status') as MemberStatus) || undefined

    if (!fullName || fullName.length < 2) {
      return { error: 'Full name must contain at least 2 characters.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const p = store.profiles.find((x) => x.id === profileId)
      if (p) {
        const isTargetAdmin =
          p.role === 'admin' ||
          p.role === 'super_admin' ||
          (p.full_name && p.full_name.toLowerCase().startsWith('proton '))

        p.full_name = fullName
        p.branch = branch
        p.year = year
        p.joining_year = joiningYear
        p.designation_id = designationId
        if (hasDepartment) p.department = department || null
        p.bio = bio
        p.usn = usn
        p.phone = phone
        p.github_url = githubUrl
        p.linkedin_url = linkedinUrl
        p.instagram_url = instagramUrl
        p.portfolio_url = portfolioUrl
        if (status && (!isTargetAdmin || permissions.isSuperAdmin)) {
          p.status = status
        }
        p.updated_at = new Date().toISOString()
        writeLocalStore(store)

        await logActivity({
          action: 'MEMBER_UPDATED',
          actorId: user.id,
          actorEmail: user.email || 'admin@proton.cyber',
          actorName: profile?.full_name || 'Administrator',
          actorRole: profile?.role || 'admin',
          targetId: profileId,
          targetName: fullName,
          targetType: 'member',
          details: { full_name: fullName, status: (!isTargetAdmin || permissions.isSuperAdmin) ? status : undefined, branch, year },
        })
      }
      revalidatePath('/admin/members')
      revalidatePath('/admin/logs')
      revalidatePath('/teams')
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Admin database client unavailable' }

    // Check if target profile is an admin account
    const targetRows = await sql`
      SELECT role, full_name FROM public.profiles WHERE id = ${profileId} LIMIT 1
    `
    const targetProfile: any = (targetRows as any[])[0]

    const isTargetAdmin =
      targetProfile?.role === 'admin' ||
      targetProfile?.role === 'super_admin' ||
      (targetProfile?.full_name && targetProfile.full_name.toLowerCase().startsWith('proton '))

    let targetStatus = undefined
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      if (!isTargetAdmin || permissions.isSuperAdmin) {
        targetStatus = status
      }
    }

    if (hasDepartment && targetStatus) {
      await sql`
        UPDATE public.profiles
        SET full_name = ${fullName},
            branch = ${branch},
            year = ${year},
            joining_year = ${joiningYear},
            designation_id = ${designationId},
            department = ${department},
            bio = ${bio},
            usn = ${usn},
            phone = ${phone},
            github_url = ${githubUrl},
            linkedin_url = ${linkedinUrl},
            instagram_url = ${instagramUrl},
            portfolio_url = ${portfolioUrl},
            status = ${targetStatus},
            updated_at = now()
        WHERE id = ${profileId}
      `
    } else if (hasDepartment) {
      await sql`
        UPDATE public.profiles
        SET full_name = ${fullName},
            branch = ${branch},
            year = ${year},
            joining_year = ${joiningYear},
            designation_id = ${designationId},
            department = ${department},
            bio = ${bio},
            usn = ${usn},
            phone = ${phone},
            github_url = ${githubUrl},
            linkedin_url = ${linkedinUrl},
            instagram_url = ${instagramUrl},
            portfolio_url = ${portfolioUrl},
            updated_at = now()
        WHERE id = ${profileId}
      `
    } else if (targetStatus) {
      await sql`
        UPDATE public.profiles
        SET full_name = ${fullName},
            branch = ${branch},
            year = ${year},
            joining_year = ${joiningYear},
            designation_id = ${designationId},
            bio = ${bio},
            usn = ${usn},
            phone = ${phone},
            github_url = ${githubUrl},
            linkedin_url = ${linkedinUrl},
            instagram_url = ${instagramUrl},
            portfolio_url = ${portfolioUrl},
            status = ${targetStatus},
            updated_at = now()
        WHERE id = ${profileId}
      `
    } else {
      await sql`
        UPDATE public.profiles
        SET full_name = ${fullName},
            branch = ${branch},
            year = ${year},
            joining_year = ${joiningYear},
            designation_id = ${designationId},
            bio = ${bio},
            usn = ${usn},
            phone = ${phone},
            github_url = ${githubUrl},
            linkedin_url = ${linkedinUrl},
            instagram_url = ${instagramUrl},
            portfolio_url = ${portfolioUrl},
            updated_at = now()
        WHERE id = ${profileId}
      `
    }

    await logActivity({
      action: 'MEMBER_UPDATED',
      actorId: user.id,
      actorEmail: user.email || 'admin@proton.cyber',
      actorName: profile?.full_name || 'Administrator',
      actorRole: profile?.role || 'admin',
      targetId: profileId,
      targetName: fullName,
      targetType: 'member',
      details: { full_name: fullName, status: targetStatus, branch, year },
    })

    revalidatePath('/admin/members')
    revalidatePath('/admin/logs')
    revalidatePath('/teams')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Update failed'
    return { error: msg }
  }
}
