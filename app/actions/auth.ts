'use server'

import { sql, isDbConfigured } from '@/lib/db'
import { auth } from '@/lib/auth/better-auth'
import { hashPassword } from 'better-auth/crypto'
import { uploadToCloudinary, deleteFromCloudinary, STORAGE_PRESETS } from '@/lib/storage/cloudinary'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import crypto from 'crypto'
import { verifyInvitationToken } from '@/lib/auth/invitations'
import { isLocalDevMode, readLocalStore, writeLocalStore, hashPassword as hashDevPassword } from '@/lib/local-store'
import { logActivity } from '@/lib/audit-service'
import { getAdminPermissions } from '@/lib/auth/admin-privileges'
import { sendPasswordResetEmail } from '@/lib/email/resend'

async function resolveAppUrl(): Promise<string> {
  try {
    const headerList = await headers()
    const host = headerList.get('x-forwarded-host') || headerList.get('host')
    const proto = headerList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
    if (host) {
      return `${proto}://${host}`
    }
  } catch {
    // Ignore error if invoked outside request context
  }

  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  if (process.env.BETTER_AUTH_URL && !process.env.BETTER_AUTH_URL.includes('localhost')) {
    return process.env.BETTER_AUTH_URL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'https://protonnmamit.com'
}

function sanitizeRedirectUrl(url: string | null | undefined, fallback: string): string {
  if (!url) return fallback
  const trimmed = url.trim()
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.includes(':') &&
    !trimmed.includes('\\')
  ) {
    return trimmed
  }
  return fallback
}

export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const redirectParam = formData.get('redirect') as string | null

  if (!email || !password) {
    return { error: 'Please enter both email and password.' }
  }

  if (isLocalDevMode()) {
    const store = readLocalStore()
    const user = store.users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() ||
        u.email.toLowerCase() === `${email.toLowerCase()}.cyber` ||
        u.email.toLowerCase().replace('.cyber', '') === email.toLowerCase()
    )
    if (!user || user.passwordHash !== hashDevPassword(password)) {
      return { error: 'Invalid email or password.' }
    }

    const cookieStore = await cookies()
    cookieStore.set('proton_dev_user_id', user.id, { path: '/', httpOnly: true })
    cookieStore.set('proton_dev_role', user.role, { path: '/', httpOnly: true })

    const profile = store.profiles.find((p) => p.user_id === user.id)
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
    const adminPerms = getAdminPermissions(user.email)
    const defaultUrl = isAdmin
      ? adminPerms.isEventsManager
        ? '/admin/events'
        : '/admin'
      : '/member/dashboard'

    const redirectUrl = sanitizeRedirectUrl(redirectParam, defaultUrl)

    await logActivity({
      action: 'LOGIN',
      actorId: user.id,
      actorEmail: user.email,
      actorName: profile?.full_name || user.fullName,
      actorRole: user.role,
      targetType: 'session',
      details: { redirectUrl, status: profile?.status, mode: 'local_dev' },
    })

    return { success: true, redirectUrl }
  }

  let finalEmail = email.toLowerCase()
  let authResult: any = null

  try {
    authResult = await auth.api.signInEmail({
      body: {
        email: finalEmail,
        password,
      },
    })
  } catch (err: any) {
    // If email has no TLD (e.g. president@proton), attempt with .cyber domain
    if (!email.includes('.')) {
      try {
        const fallbackEmail = `${email.toLowerCase()}.cyber`
        authResult = await auth.api.signInEmail({
          body: {
            email: fallbackEmail,
            password,
          },
        })
        if (authResult?.user) {
          finalEmail = fallbackEmail
        }
      } catch (retryErr: any) {
        return { error: 'Invalid email or password.' }
      }
    } else {
      return { error: 'Invalid email or password.' }
    }
  }

  if (!authResult || !authResult.user) {
    return { error: 'Invalid email or password.' }
  }

  const authenticatedUser = authResult.user

  // Lookup profile in Neon PostgreSQL to enforce zero-trust server-side RBAC
  let defaultRedirectUrl = '/member/dashboard'
  let profileName = authenticatedUser.name || finalEmail
  let profileRole = 'member'
  let profileStatus = 'approved'

  if (isDbConfigured()) {
    const profileRows = await sql`
      SELECT full_name, role, status
      FROM public.profiles
      WHERE user_id = ${authenticatedUser.id}
      LIMIT 1
    `

    if (profileRows && profileRows.length > 0) {
      const profile: any = profileRows[0]
      profileName = profile.full_name || profileName
      profileRole = profile.role || 'member'
      profileStatus = profile.status || 'approved'

      if (profile.role === 'admin' || profile.role === 'super_admin') {
        const adminPerms = getAdminPermissions(authenticatedUser.email || finalEmail)
        defaultRedirectUrl = adminPerms.isEventsManager ? '/admin/events' : '/admin'
      }
    } else {
      const adminPerms = getAdminPermissions(authenticatedUser.email || finalEmail)
      if (adminPerms.isFullAdmin || adminPerms.isEventsManager || adminPerms.isVicePresident) {
        defaultRedirectUrl = adminPerms.isEventsManager ? '/admin/events' : '/admin'
        profileRole = adminPerms.isSuperAdmin ? 'super_admin' : 'admin'
        profileName = adminPerms.roleLabel
      } else {
        // Fail closed for members without a database profile record
        try {
          await auth.api.signOut({ headers: await headers() })
        } catch {}
        return {
          error:
            'No active member profile found for this account. If you were recently registered, please contact an administrator.',
        }
      }
    }
  } else {
    const adminPerms = getAdminPermissions(authenticatedUser.email || finalEmail)
    if (adminPerms.isFullAdmin || adminPerms.isEventsManager || adminPerms.isVicePresident) {
      defaultRedirectUrl = adminPerms.isEventsManager ? '/admin/events' : '/admin'
      profileRole = adminPerms.isSuperAdmin ? 'super_admin' : 'admin'
      profileName = adminPerms.roleLabel
    }
  }

  const redirectUrl = sanitizeRedirectUrl(redirectParam, defaultRedirectUrl)

  await logActivity({
    action: 'LOGIN',
    actorId: authenticatedUser.id,
    actorEmail: authenticatedUser.email || finalEmail,
    actorName: profileName,
    actorRole: profileRole,
    targetType: 'session',
    details: { redirectUrl, status: profileStatus },
  })

  return { success: true, redirectUrl }
}

export async function logoutAction() {
  if (isLocalDevMode()) {
    const cookieStore = await cookies()
    const devUserId = cookieStore.get('proton_dev_user_id')?.value
    if (devUserId) {
      const store = readLocalStore()
      const user = store.users.find((u) => u.id === devUserId)
      if (user) {
        await logActivity({
          action: 'LOGOUT',
          actorId: user.id,
          actorEmail: user.email,
          actorName: user.fullName,
          actorRole: user.role,
          targetType: 'session',
          details: { sessionTerminated: true },
        })
      }
    }
    cookieStore.delete('proton_dev_user_id')
    cookieStore.delete('proton_dev_role')
    redirect('/member/login')
  }

  let userId: string | undefined
  let userEmail: string | undefined
  let userName: string | undefined
  let userRole: string | undefined

  try {
    const reqHeaders = await headers()
    const session = await auth.api.getSession({ headers: reqHeaders })
    if (session && session.user) {
      userId = session.user.id
      userEmail = session.user.email
      userName = session.user.name || session.user.email
      userRole = (session.user as any).role || 'member'

      if (isDbConfigured()) {
        const profileRows = await sql`
          SELECT full_name, role FROM public.profiles WHERE user_id = ${userId} LIMIT 1
        `
        if (profileRows && profileRows.length > 0) {
          const profile: any = profileRows[0]
          if (profile.full_name) userName = profile.full_name
          if (profile.role) userRole = profile.role
        }
      }

      await logActivity({
        action: 'LOGOUT',
        actorId: userId,
        actorEmail: userEmail,
        actorName: userName || userEmail,
        actorRole: userRole || 'member',
        targetType: 'session',
        details: { sessionTerminated: true },
      })

      await auth.api.signOut({ headers: reqHeaders })
    }
  } catch (e) {
    console.error('[logoutAction] Error during signOut:', e)
  }

  redirect('/member/login')
}

export async function registerWithInvitationAction(formData: FormData) {
  const token = formData.get('token') as string
  const password = formData.get('password') as string
  const fullName = (formData.get('full_name') as string)?.trim()
  const usn = (formData.get('usn') as string)?.trim()
  const branch = (formData.get('branch') as string)?.trim()
  const year = (formData.get('year') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim()
  const bio = (formData.get('bio') as string)?.trim()
  const github_url = (formData.get('github_url') as string)?.trim()
  const linkedin_url = (formData.get('linkedin_url') as string)?.trim()
  const instagram_url = (formData.get('instagram_url') as string)?.trim()
  const portfolio_url = (formData.get('portfolio_url') as string)?.trim()

  if (!token || !password) {
    return { error: 'Token and password are required.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' }
  }

  const verification = await verifyInvitationToken(token)
  if (!verification.valid || !verification.invitation) {
    return { error: verification.reason || 'Invalid or expired invitation token.' }
  }

  const invitation = verification.invitation

  if (isLocalDevMode()) {
    const store = readLocalStore()
    let targetUser = store.users.find((u) => u.email.toLowerCase() === invitation.email.toLowerCase())
    let targetUserId: string

    if (targetUser) {
      targetUser.passwordHash = hashDevPassword(password)
      targetUser.fullName = fullName || invitation.name
      targetUserId = targetUser.id
    } else {
      targetUserId = `user-${Date.now()}`
      targetUser = {
        id: targetUserId,
        email: invitation.email,
        passwordHash: hashDevPassword(password),
        role: 'member',
        fullName: fullName || invitation.name,
      }
      store.users.push(targetUser)
    }

    const designation = store.designations.find((d) => d.id === invitation.designation_id)

    let localAvatarUrl: string | null = null
    const avatarFile = formData.get('avatar_file') as File | null
    if (avatarFile && avatarFile.size > 0) {
      const buffer = Buffer.from(await avatarFile.arrayBuffer())
      localAvatarUrl = `data:${avatarFile.type};base64,${buffer.toString('base64')}`
    }

    const existingProfileIdx = store.profiles.findIndex((p) => p.user_id === targetUserId)
    const profilePayload = {
      id: existingProfileIdx >= 0 ? store.profiles[existingProfileIdx].id : `profile-${Date.now()}`,
      user_id: targetUserId,
      full_name: fullName || invitation.name,
      avatar_url: localAvatarUrl || (existingProfileIdx >= 0 ? store.profiles[existingProfileIdx].avatar_url : null),
      usn: usn || null,
      branch: 'Cybersecurity',
      year: year || '3rd Year',
      phone: phone || null,
      bio: bio || null,
      github_url: github_url || null,
      linkedin_url: linkedin_url || null,
      instagram_url: instagram_url || null,
      portfolio_url: portfolio_url || null,
      designation_id: invitation.designation_id || null,
      status: 'pending' as const,
      role: 'member' as const,
      created_at: existingProfileIdx >= 0 ? store.profiles[existingProfileIdx].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      designations: designation,
    }

    if (existingProfileIdx >= 0) {
      store.profiles[existingProfileIdx] = profilePayload
    } else {
      store.profiles.push(profilePayload)
    }

    const inv = store.invitations.find((i) => i.id === invitation.id)
    if (inv) {
      inv.accepted_at = new Date().toISOString()
    }

    writeLocalStore(store)
    return { success: true }
  }

  // 1. Check or create user account in Neon Auth (neon_auth.user & neon_auth.account)
  let userId: string | null = null
  const email = invitation.email.toLowerCase()

  const existingUsers = await sql`
    SELECT id FROM neon_auth.user WHERE lower(email) = ${email} LIMIT 1
  `

  if (existingUsers && existingUsers.length > 0) {
    userId = existingUsers[0].id
    const hashed = await hashPassword(password)
    await sql`
      UPDATE neon_auth.user SET
        name = ${fullName || invitation.name},
        "updatedAt" = NOW()
      WHERE id = ${userId}
    `
    await sql`
      UPDATE neon_auth.account SET
        password = ${hashed},
        "updatedAt" = NOW()
      WHERE "userId" = ${userId} AND "providerId" = 'credential'
    `
  } else {
    try {
      const res = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: fullName || invitation.name,
        },
      })
      if (res?.user) {
        userId = res.user.id
      }
    } catch (createErr: any) {
      return { error: 'Failed to create security account: ' + (createErr.message || 'Unknown error') }
    }
  }

  if (!userId) {
    return { error: 'Failed to establish user identity.' }
  }

  // 2. Upload avatar to Cloudinary Storage if provided
  let avatarUrl: string | null = null
  const avatarFile = formData.get('avatar_file') as File | null
  if (avatarFile && avatarFile.size > 0) {
    try {
      if (avatarFile.size <= STORAGE_PRESETS.MEMBER_AVATARS.maxSizeBytes) {
        const buffer = Buffer.from(await avatarFile.arrayBuffer())
        const uploadRes = await uploadToCloudinary({
          buffer,
          folder: `${STORAGE_PRESETS.MEMBER_AVATARS.folder}/${userId}`,
          filename: `avatar_${Date.now()}`,
          maxSizeBytes: STORAGE_PRESETS.MEMBER_AVATARS.maxSizeBytes,
          allowedFormats: ['jpeg', 'png', 'webp'],
          tags: ['member-avatar', userId],
        })
        if (uploadRes.success && uploadRes.url) {
          avatarUrl = uploadRes.url
        }
      }
    } catch (e) {
      console.error('Registration avatar upload warning:', e)
    }
  }

  // 3. Upsert Profile in Neon with pending status and member role
  try {
    await sql`
      INSERT INTO public.profiles (
        user_id, full_name, avatar_url, usn, branch, year,
        phone, bio, github_url, linkedin_url, instagram_url,
        portfolio_url, designation_id, status, role, updated_at
      ) VALUES (
        ${userId}, ${fullName || invitation.name}, ${avatarUrl}, ${usn || null},
        'Cybersecurity', ${year || '3rd Year'}, ${phone || null}, ${bio || null},
        ${github_url || null}, ${linkedin_url || null}, ${instagram_url || null},
        ${portfolio_url || null}, ${invitation.designation_id || null},
        'pending', 'member', now()
      ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        usn = EXCLUDED.usn,
        branch = EXCLUDED.branch,
        year = EXCLUDED.year,
        phone = EXCLUDED.phone,
        bio = EXCLUDED.bio,
        github_url = EXCLUDED.github_url,
        linkedin_url = EXCLUDED.linkedin_url,
        instagram_url = EXCLUDED.instagram_url,
        portfolio_url = EXCLUDED.portfolio_url,
        designation_id = EXCLUDED.designation_id,
        status = 'pending',
        role = 'member',
        updated_at = now()
    `
  } catch (profileErr: any) {
    if (avatarUrl) {
      deleteFromCloudinary(avatarUrl).catch((err) =>
        console.warn('[Registration Storage Rollback Failed]:', err)
      )
    }
    return { error: 'Failed to create member profile in database: ' + profileErr.message }
  }

  // 4. Mark invitation as accepted in Neon
  await sql`
    UPDATE public.invitations
    SET accepted_at = now()
    WHERE id = ${invitation.id}
  `

  await logActivity({
    action: 'INVITATION_ACCEPT',
    actorId: userId,
    actorEmail: email,
    actorName: fullName || invitation.name,
    actorRole: 'member',
    targetType: 'invitation',
    targetId: invitation.id,
    details: { invitationId: invitation.id, email },
  })

  return { success: true }
}

const GENERIC_RESET_MESSAGE =
  'If an account exists for this email, a password reset link has been sent.'

export async function requestPasswordResetAction(formData: FormData) {
  const emailRaw = (formData.get('email') as string)?.trim()
  if (!emailRaw) {
    return { error: 'Please enter your registered member email.' }
  }

  const email = emailRaw.toLowerCase()

  // 1. ADMIN EXCLUSION: Administrators cannot reset password via member reset flow
  const adminPerms = getAdminPermissions(email)
  if (adminPerms.isFullAdmin || adminPerms.isEventsManager || adminPerms.isVicePresident) {
    return { error: 'Administrator accounts cannot reset passwords via self-service. Please contact the Tech Team.' }
  }

  if (isLocalDevMode()) {
    const store = readLocalStore()
    const user = store.users.find((u) => u.email.toLowerCase() === email)
    if (!user) {
      return { error: 'This email is not registered as a PROTON member.' }
    }
    if (user.role === 'admin' || user.role === 'super_admin') {
      return { error: 'Administrator accounts cannot reset passwords via self-service. Please contact the Tech Team.' }
    }
    const token = `dev-reset-${Date.now()}`
    const appUrl = await resolveAppUrl()
    const resetUrl = `${appUrl}/member/reset-password?token=${token}`
    await sendPasswordResetEmail({
      to: email,
      name: user.fullName,
      resetUrl,
    })
    return {
      success: true,
      name: user.fullName || 'Member',
      email,
      message: 'Password recovery link dispatched successfully.',
    }
  }

  if (!isDbConfigured()) {
    return { error: 'Database service is currently unreachable.' }
  }

  try {
    // 2. Check if user exists in neon_auth.user and verify they are a member (not admin)
    const userRows = await sql`
      SELECT u.id, u.name, u.email, p.role, p.full_name
      FROM neon_auth.user u
      LEFT JOIN public.profiles p ON u.id = p.user_id
      WHERE lower(u.email) = ${email}
      LIMIT 1
    `

    if (!userRows || userRows.length === 0) {
      return { error: 'This email is not registered as a PROTON member.' }
    }

    const user: any = userRows[0]

    // Ensure role is not admin / super_admin
    if (user.role === 'admin' || user.role === 'super_admin') {
      return { error: 'Administrator accounts cannot reset passwords via self-service. Please contact the Tech Team.' }
    }

    const memberName = user.full_name || user.name || 'Member'

    // 3. Invalidate any prior active reset tokens for this user
    const identifier = `reset-password:${email}`
    await sql`
      DELETE FROM neon_auth.verification
      WHERE identifier = ${identifier}
    `

    // 4. Generate high-entropy cryptographic reset token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiration

    await sql`
      INSERT INTO neon_auth.verification (
        id, identifier, value, "expiresAt", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        ${identifier},
        ${token},
        ${expiresAt.toISOString()},
        NOW(),
        NOW()
      )
    `

    // 5. Send password reset email via Resend
    const appUrl = await resolveAppUrl()
    const resetUrl = `${appUrl}/member/reset-password?token=${token}`

    const emailRes = await sendPasswordResetEmail({
      to: email,
      name: memberName,
      resetUrl,
    })

    if (!emailRes.success) {
      return { error: emailRes.error || 'Failed to dispatch email via Resend.' }
    }

    await logActivity({
      action: 'PASSWORD_RESET_REQUEST',
      actorId: user.id,
      actorEmail: email,
      actorName: memberName,
      actorRole: 'member',
      targetType: 'account',
      details: { email },
    })

    return {
      success: true,
      name: memberName,
      email,
      message: 'Password recovery link dispatched successfully.',
    }
  } catch (err: any) {
    console.error('[Password Reset Error] Error in requestPasswordResetAction:', err.message || err)
    return { error: 'An unexpected error occurred while processing password reset.' }
  }
}

export async function resetPasswordAction(formData: FormData) {
  const token = (formData.get('token') as string)?.trim()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!token) {
    return { error: 'Invalid or missing password reset token.' }
  }

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  if (isLocalDevMode()) {
    return { success: true }
  }

  if (!isDbConfigured()) {
    return { error: 'Database service unavailable.' }
  }

  try {
    // 1. Validate token from neon_auth.verification
    const rows = await sql`
      SELECT id, identifier, value, "expiresAt"
      FROM neon_auth.verification
      WHERE value = ${token} AND "expiresAt" > NOW()
      LIMIT 1
    `

    if (!rows || rows.length === 0) {
      return {
        error: 'This password reset link is invalid or has expired. Please request a new one.',
      }
    }

    const verification: any = rows[0]
    const identifier = verification.identifier as string
    if (!identifier.startsWith('reset-password:')) {
      return { error: 'Invalid verification token type.' }
    }

    const email = identifier.replace('reset-password:', '').toLowerCase()

    // 2. Admin protection: double check email is not an administrator
    const adminPerms = getAdminPermissions(email)
    if (adminPerms.isFullAdmin || adminPerms.isEventsManager || adminPerms.isVicePresident) {
      // Invalidate token immediately and reject
      await sql`DELETE FROM neon_auth.verification WHERE id = ${verification.id}`
      return { error: 'Administrator passwords cannot be reset via this portal.' }
    }

    // 3. Find user
    const userRows = await sql`
      SELECT id, role, name FROM neon_auth.user WHERE lower(email) = ${email} LIMIT 1
    `

    if (!userRows || userRows.length === 0) {
      await sql`DELETE FROM neon_auth.verification WHERE id = ${verification.id}`
      return { error: 'User account not found.' }
    }

    const user: any = userRows[0]
    if (user.role === 'admin' || user.role === 'super_admin') {
      await sql`DELETE FROM neon_auth.verification WHERE id = ${verification.id}`
      return { error: 'Administrator passwords cannot be reset via this portal.' }
    }

    // 4. Hash new password and update in neon_auth.account
    const hashedPassword = await hashPassword(password)

    await sql`
      UPDATE neon_auth.account SET
        password = ${hashedPassword},
        "updatedAt" = NOW()
      WHERE "userId" = ${user.id} AND "providerId" = 'credential'
    `

    // 5. Invalidate the used token to prevent replay
    await sql`DELETE FROM neon_auth.verification WHERE id = ${verification.id}`

    // 6. Invalidate all active sessions for this user across devices
    await sql`DELETE FROM neon_auth.session WHERE "userId" = ${user.id}`

    await logActivity({
      action: 'PASSWORD_RESET_COMPLETE',
      actorId: user.id,
      actorEmail: email,
      actorName: user.name,
      actorRole: 'member',
      targetType: 'account',
      details: { email },
    })

    return { success: true }
  } catch (err: any) {
    console.error('[Password Reset Error] Error in resetPasswordAction:', err.message || err)
    return { error: 'An unexpected error occurred while resetting your password.' }
  }
}
