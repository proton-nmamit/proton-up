'use server'

import { sql, isDbConfigured } from '@/lib/db'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth/session'
import { DbProfile, DbDesignation } from '@/lib/types/database'
import { revalidatePath } from 'next/cache'
import { isLocalDevMode, readLocalStore, writeLocalStore, hashPassword } from '@/lib/local-store'
import { logActivity } from '@/lib/audit-service'
import { getAdminPermissions } from '@/lib/auth/admin-privileges'
import { uploadToCloudinary, deleteFromCloudinary, STORAGE_PRESETS } from '@/lib/storage/cloudinary'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = STORAGE_PRESETS.MEMBER_AVATARS.maxSizeBytes // 3 MB

function isValidHttpUrl(str: string): boolean {
  if (!str) return true
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Retrieves the current authenticated member's profile and list of available designations.
 */
export async function getMemberPortalData(): Promise<{
  profile: DbProfile | null
  email: string | null
  designations: DbDesignation[]
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { profile: null, email: null, designations: [], error: 'Not authenticated' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const profile = await getCurrentProfile()
      const designations = store.designations
        .filter((d) => d.is_active)
        .sort((a, b) => a.display_order - b.display_order)

      return {
        profile,
        email: user.email || null,
        designations,
      }
    }

    if (!isDbConfigured()) {
      return { profile: null, email: user.email || null, designations: [], error: 'Database service unconfigured' }
    }

    const [profile, designations] = await Promise.all([
      getCurrentProfile(),
      sql`
        SELECT * FROM public.designations
        WHERE is_active = true
        ORDER BY display_order ASC
      `,
    ])

    return {
      profile,
      email: user.email || null,
      designations: (designations as any[] as DbDesignation[]) || [],
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve portal data'
    return { profile: null, email: null, designations: [], error: message }
  }
}

/**
 * Updates editable profile fields for the authenticated member.
 * STRICT SECURITY BOUNDARIES:
 * - Identifies caller strictly via server-side session (auth.getUser()).
 * - Whitelists editable fields only.
 * - Forbids modification of: id, user_id, role, status, rejection_reason, created_at.
 * - If currently rejected, resubmission shifts status to 'pending' for re-review.
 */
export async function updateMemberProfileAction(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'Unauthorized. Please log in to update your profile.' }
    }

    // Extract & validate allowed fields
    const fullName = (formData.get('full_name') as string)?.trim()
    const branch = 'Cybersecurity'
    const year = (formData.get('year') as string)?.trim() || '3rd Year'
    const joiningYear = (formData.get('joining_year') as string)?.trim() || null
    const designationId = (formData.get('designation_id') as string)?.trim() || null
    const department = (formData.get('department') as string)?.trim() || null
    const bio = (formData.get('bio') as string)?.trim() || null
    const usn = (formData.get('usn') as string)?.trim() || null
    const phone = (formData.get('phone') as string)?.trim() || null
    const githubUrl = (formData.get('github_url') as string)?.trim() || null
    const linkedinUrl = (formData.get('linkedin_url') as string)?.trim() || null
    const instagramUrl = (formData.get('instagram_url') as string)?.trim() || null
    const portfolioUrl = (formData.get('portfolio_url') as string)?.trim() || null

    if (!fullName || fullName.length < 2) {
      return { error: 'Full name must contain at least 2 characters.' }
    }
    if (fullName.length > 100) {
      return { error: 'Full name cannot exceed 100 characters.' }
    }
    if (bio && bio.length > 500) {
      return { error: 'Bio cannot exceed 500 characters.' }
    }

    // Load current profile to check current status and verify ownership
    if (isLocalDevMode()) {
      const store = readLocalStore()
      const currentProfile = store.profiles.find((p) => p.user_id === user.id)
      if (!currentProfile) {
        return { error: 'Member profile record could not be found.' }
      }
      currentProfile.full_name = fullName
      currentProfile.branch = branch
      currentProfile.year = year
      currentProfile.joining_year = joiningYear
      currentProfile.designation_id = designationId
      currentProfile.department = department
      currentProfile.bio = bio
      currentProfile.usn = usn
      currentProfile.phone = phone
      currentProfile.github_url = githubUrl
      currentProfile.linkedin_url = linkedinUrl
      currentProfile.instagram_url = instagramUrl
      currentProfile.portfolio_url = portfolioUrl
      currentProfile.updated_at = new Date().toISOString()

      const wasRejected = currentProfile.status === 'rejected'
      if (wasRejected) {
        currentProfile.status = 'pending'
        currentProfile.rejection_reason = null
      }
      writeLocalStore(store)
      revalidatePath('/member/dashboard')
      revalidatePath('/teams')
      revalidatePath('/admin')
      revalidatePath('/admin/profile')
      revalidatePath('/admin/members')

      await logActivity({
        action: 'MEMBER_UPDATED',
        actorId: user.id,
        actorEmail: user.email || 'unknown',
        actorName: fullName,
        actorRole: currentProfile.role || 'member',
        targetId: currentProfile.id,
        targetName: fullName,
        targetEmail: user.email,
        targetType: 'member',
        details: {
          updatedFields: ['full_name', 'branch', 'year', 'joining_year', 'designation_id', 'department', 'bio', 'social_links'],
          editorPortal: currentProfile.role === 'admin' || currentProfile.role === 'super_admin' ? 'Admin Dashboard' : 'Member Portal',
        },
      })

      return { success: true, statusTransitionedToPending: wasRejected }
    }

    if (!isDbConfigured()) {
      return { error: 'Database service is currently unconfigured.' }
    }

    const currentRows = await sql`
      SELECT id, user_id, role, status, rejection_reason
      FROM public.profiles
      WHERE user_id = ${user.id}
      LIMIT 1
    `

    if (!currentRows || currentRows.length === 0) {
      return { error: 'Member profile record could not be found.' }
    }

    const currentProfile: any = currentRows[0]

    if (usn && usn.length > 30) {
      return { error: 'USN cannot exceed 30 characters.' }
    }
    if (phone && phone.length > 25) {
      return { error: 'Phone number cannot exceed 25 characters.' }
    }

    // URL validations
    if (githubUrl && !isValidHttpUrl(githubUrl)) {
      return { error: 'GitHub link must be a valid URL starting with http:// or https://' }
    }
    if (linkedinUrl && !isValidHttpUrl(linkedinUrl)) {
      return { error: 'LinkedIn link must be a valid URL starting with http:// or https://' }
    }
    if (instagramUrl && !isValidHttpUrl(instagramUrl)) {
      return { error: 'Instagram link must be a valid URL starting with http:// or https://' }
    }
    if (portfolioUrl && !isValidHttpUrl(portfolioUrl)) {
      return { error: 'Portfolio link must be a valid URL starting with http:// or https://' }
    }

    // Workflow rule: If profile was rejected, editing and resubmitting sets it back to 'pending'
    const wasRejected = currentProfile.status === 'rejected'
    const newStatus = wasRejected ? 'pending' : currentProfile.status
    const newRejectionReason = wasRejected ? null : currentProfile.rejection_reason

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
          status = ${newStatus},
          rejection_reason = ${newRejectionReason},
          updated_at = now()
      WHERE user_id = ${user.id}
    `

    revalidatePath('/member/dashboard')
    revalidatePath('/teams')
    revalidatePath('/admin')
    revalidatePath('/admin/profile')
    revalidatePath('/admin/members')

    await logActivity({
      action: 'MEMBER_UPDATED',
      actorId: user.id,
      actorEmail: user.email || 'unknown',
      actorName: fullName,
      actorRole: currentProfile.role || 'member',
      targetId: currentProfile.id,
      targetName: fullName,
      targetEmail: user.email,
      targetType: 'member',
      details: {
        updatedFields: ['full_name', 'branch', 'year', 'joining_year', 'designation_id', 'department', 'bio', 'social_links'],
        editorPortal: currentProfile.role === 'admin' || currentProfile.role === 'super_admin' ? 'Admin Dashboard' : 'Member Portal',
      },
    })

    return {
      success: true,
      statusTransitionedToPending: wasRejected,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update profile'
    console.error('[PROTON CMS Exception] updateMemberProfileAction:', msg)
    return { error: msg }
  }
}

/**
 * Handles avatar image upload to Cloudinary storage under 'proton/members/avatars'.
 * Validates file size (max 3MB), MIME type (JPEG/PNG/WebP), and uploads to a user-isolated path.
 */
export async function uploadMemberAvatarAction(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'Unauthorized. Please sign in.' }
    }

    const file = formData.get('file') as File | null
    if (!file || file.size === 0) {
      return { error: 'Please select an image file to upload.' }
    }

    // Server-side validation: File size limit (3MB)
    if (file.size > MAX_FILE_SIZE) {
      return { error: 'File size exceeds maximum allowed limit of 3MB.' }
    }

    // Server-side validation: MIME type check
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { error: 'Invalid file format. Only JPEG, PNG, and WebP images are allowed.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const currentProfile = store.profiles.find((p) => p.user_id === user.id)
      if (!currentProfile) {
        return { error: 'Member profile record could not be found.' }
      }
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`
      currentProfile.avatar_url = dataUrl
      currentProfile.updated_at = new Date().toISOString()
      writeLocalStore(store)
      revalidatePath('/member/dashboard')
      revalidatePath('/teams')
      revalidatePath('/admin')
      revalidatePath('/admin/profile')
      revalidatePath('/admin/members')

      await logActivity({
        action: 'MEMBER_UPDATED',
        actorId: user.id,
        actorEmail: user.email || 'unknown',
        actorName: currentProfile.full_name,
        actorRole: currentProfile.role || 'member',
        targetId: currentProfile.id,
        targetName: currentProfile.full_name,
        targetEmail: user.email,
        targetType: 'avatar',
        details: { action: 'Updated avatar image' },
      })

      return { success: true, avatarUrl: dataUrl }
    }

    if (!isDbConfigured()) {
      return { error: 'Database service unavailable' }
    }

    // Fetch previous avatar to clean up after successful upload
    const prevRows = await sql`
      SELECT avatar_url FROM public.profiles WHERE user_id = ${user.id} LIMIT 1
    `
    const oldAvatarUrl = prevRows?.[0]?.avatar_url

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Cloudinary using secure storage helper
    const uploadRes = await uploadToCloudinary({
      buffer,
      folder: `${STORAGE_PRESETS.MEMBER_AVATARS.folder}/${user.id}`,
      filename: `avatar_${Date.now()}`,
      maxSizeBytes: MAX_FILE_SIZE,
      allowedFormats: ['jpeg', 'png', 'webp'],
      tags: ['member-avatar', user.id],
    })

    if (!uploadRes.success || !uploadRes.url) {
      console.error('[PROTON CMS Cloudinary Upload Error]:', uploadRes.error)
      return { error: uploadRes.error || 'Failed to upload avatar to Cloudinary.' }
    }

    const publicUrl = uploadRes.url

    try {
      // Save avatar_url into profiles table in Neon strictly for authenticated user
      await sql`
        UPDATE public.profiles
        SET avatar_url = ${publicUrl}, updated_at = now()
        WHERE user_id = ${user.id}
      `
    } catch (dbErr: any) {
      // Atomic rollback: delete the newly uploaded asset if DB update fails
      await deleteFromCloudinary(publicUrl).catch((e) =>
        console.warn('[Avatar Atomic Rollback Warning]:', e)
      )
      throw dbErr
    }

    // Clean up old avatar from Cloudinary only after DB update is confirmed
    if (oldAvatarUrl && oldAvatarUrl.includes('cloudinary.com') && oldAvatarUrl !== publicUrl) {
      deleteFromCloudinary(oldAvatarUrl).catch((err) =>
        console.warn('[Avatar Old Cleanup Warning]:', err)
      )
    }

    revalidatePath('/member/dashboard')
    revalidatePath('/teams')
    revalidatePath('/admin')
    revalidatePath('/admin/profile')
    revalidatePath('/admin/members')

    await logActivity({
      action: 'MEMBER_UPDATED',
      actorId: user.id,
      actorEmail: user.email || 'unknown',
      actorName: user.email,
      actorRole: 'admin',
      targetId: user.id,
      targetName: user.email,
      targetEmail: user.email,
      targetType: 'avatar',
      details: { action: 'Updated avatar image' },
    })

    return { success: true, avatarUrl: publicUrl }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Avatar upload failed'
    console.error('[PROTON CMS Storage Exception]:', msg)
    return { error: msg }
  }
}

/**
 * Removes the member's profile avatar from Cloudinary Storage and clears avatar_url in the database.
 */
export async function removeMemberAvatarAction(targetUserId?: string): Promise<{
  success?: boolean
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'Unauthorized. Please log in to manage your avatar.' }
    }

    let effectiveUserId = user.id
    if (targetUserId && targetUserId !== user.id) {
      const perms = getAdminPermissions(user.email)
      if (!perms.canEditMembers && !perms.canApproveMembers && !perms.isFullAdmin) {
        return { error: 'Permission denied: Cannot remove another member\'s avatar.' }
      }
      effectiveUserId = targetUserId
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const currentProfile = store.profiles.find((p) => p.user_id === effectiveUserId || p.id === effectiveUserId)
      if (!currentProfile) {
        return { error: 'Profile record could not be found.' }
      }
      currentProfile.avatar_url = null
      currentProfile.updated_at = new Date().toISOString()
      writeLocalStore(store)

      revalidatePath('/member/dashboard')
      revalidatePath('/teams')
      revalidatePath('/admin')
      revalidatePath('/admin/profile')
      revalidatePath('/admin/members')

      await logActivity({
        action: 'MEMBER_UPDATED',
        actorId: user.id,
        actorEmail: user.email || 'unknown',
        actorName: currentProfile.full_name,
        actorRole: currentProfile.role || 'member',
        targetId: currentProfile.id,
        targetName: currentProfile.full_name,
        targetEmail: user.email,
        targetType: 'avatar',
        details: { action: 'Removed avatar image' },
      })

      return { success: true }
    }

    if (!isDbConfigured()) {
      return { error: 'Database service unconfigured.' }
    }

    // Fetch existing profile from Neon to get current avatar_url
    const rows = await sql`
      SELECT id, user_id, full_name, role, avatar_url
      FROM public.profiles
      WHERE user_id = ${effectiveUserId} OR id = ${effectiveUserId}
      LIMIT 1
    `

    if (!rows || rows.length === 0) {
      return { error: 'Profile not found.' }
    }

    const profile: any = rows[0]

    // If avatar_url exists and is in Cloudinary, delete it
    if (profile.avatar_url) {
      try {
        await deleteFromCloudinary(profile.avatar_url)
      } catch (storageErr) {
        console.warn('[Avatar Cleanup Warning]:', storageErr)
      }
    }

    // Clear avatar_url in profiles table in Neon
    await sql`
      UPDATE public.profiles
      SET avatar_url = NULL, updated_at = now()
      WHERE id = ${profile.id}
    `

    revalidatePath('/member/dashboard')
    revalidatePath('/teams')
    revalidatePath('/admin')
    revalidatePath('/admin/profile')
    revalidatePath('/admin/members')

    await logActivity({
      action: 'MEMBER_UPDATED',
      actorId: user.id,
      actorEmail: user.email || 'unknown',
      actorName: profile.full_name,
      actorRole: profile.role || 'member',
      targetId: profile.id,
      targetName: profile.full_name,
      targetEmail: user.email,
      targetType: 'avatar',
      details: { action: 'Removed avatar image' },
    })

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to remove avatar'
    console.error('[PROTON CMS Remove Avatar Exception]:', msg)
    return { error: msg }
  }
}

/**
 * Allows an authenticated user (Admin or Member) to update their account password via Supabase Auth.
 */
export async function changePasswordAction(formData: FormData): Promise<{
  success?: boolean
  error?: string
  message?: string
}> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'Unauthorized. Please log in to change your password.' }
    }

    const currentPassword = (formData.get('current_password') as string)?.trim()
    const newPassword = (formData.get('new_password') as string)?.trim()
    const confirmPassword = (formData.get('confirm_password') as string)?.trim()

    if (!newPassword || newPassword.length < 8) {
      return { error: 'New password must be at least 8 characters long.' }
    }

    if (newPassword !== confirmPassword) {
      return { error: 'New password and confirmation do not match.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const localUser = store.users.find((u) => u.id === user.id)
      if (!localUser) {
        return { error: 'User record could not be found.' }
      }

      if (currentPassword && localUser.passwordHash !== hashPassword(currentPassword)) {
        return { error: 'Current password is incorrect.' }
      }

      localUser.passwordHash = hashPassword(newPassword)
      writeLocalStore(store)

      await logActivity({
        action: 'PASSWORD_CHANGED',
        actorId: user.id,
        actorEmail: user.email || 'unknown',
        actorName: localUser.fullName,
        actorRole: localUser.role,
        targetId: user.id,
        targetName: 'Account Password',
        targetEmail: user.email,
        targetType: 'auth',
        details: { action: 'Password updated via Profile security settings' },
      })

      return { success: true, message: 'Password updated successfully!' }
    }

    // Neon Auth Mode
    const accountRows = await sql`
      SELECT password FROM neon_auth.account 
      WHERE "userId" = ${user.id} AND "providerId" = 'credential'
      LIMIT 1
    `

    if (!accountRows || accountRows.length === 0) {
      return { error: 'Account security record not found.' }
    }

    const currentHash = accountRows[0].password

    // If current password provided, verify with unified verifier
    if (currentPassword && currentHash) {
      let isValid = false
      if (currentHash.startsWith('$2a$') || currentHash.startsWith('$2b$') || currentHash.startsWith('$2y$')) {
        const bcrypt = (await import('bcryptjs')).default
        isValid = await bcrypt.compare(currentPassword, currentHash)
      } else {
        const { verifyPassword } = await import('better-auth/crypto')
        isValid = await verifyPassword({ hash: currentHash, password: currentPassword })
      }

      if (!isValid) {
        return { error: 'Current password is incorrect. Please verify your existing password.' }
      }
    }

    // Hash and update new password in Neon Auth account
    const { hashPassword: hashNewPassword } = await import('better-auth/crypto')
    const newHashedPassword = await hashNewPassword(newPassword)

    await sql`
      UPDATE neon_auth.account SET
        password = ${newHashedPassword},
        "updatedAt" = NOW()
      WHERE "userId" = ${user.id} AND "providerId" = 'credential'
    `

    // Lookup profile in Neon for accurate actor name & role in audit log
    let actorName = user.email || 'Admin'
    let actorRole = 'admin'
    if (isDbConfigured()) {
      const profRows = await sql`
        SELECT full_name, role FROM public.profiles WHERE user_id = ${user.id} LIMIT 1
      `
      if (profRows && profRows.length > 0) {
        actorName = (profRows as any[])[0].full_name || actorName
        actorRole = (profRows as any[])[0].role || actorRole
      }
    }

    await logActivity({
      action: 'PASSWORD_CHANGED',
      actorId: user.id,
      actorEmail: user.email || 'unknown',
      actorName,
      actorRole,
      targetId: user.id,
      targetName: 'Account Password',
      targetEmail: user.email,
      targetType: 'auth',
      details: { action: 'Password updated via Profile security settings' },
    })

    return { success: true, message: 'Password updated successfully! Your new password is now active.' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'An error occurred while changing password'
    return { error: msg }
  }
}
