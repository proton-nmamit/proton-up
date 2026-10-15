'use server'

import { sql, isDbConfigured } from '@/lib/db'
import { requireAdminSession } from '@/lib/auth/session'
import { generateInvitationToken, hashToken } from '@/lib/auth/invitations'
import { DbInvitation } from '@/lib/types/database'
import { isLocalDevMode, readLocalStore, writeLocalStore } from '@/lib/local-store'
import { getAdminPermissions } from '@/lib/auth/admin-privileges'

export async function createInvitationAction(formData: FormData) {
  try {
    const { user } = await requireAdminSession()
    const permissions = getAdminPermissions(user.email)
    if (!permissions.canManageInvitations) {
      return { error: 'Permission denied: Your account cannot create invitations.' }
    }
    const email = (formData.get('email') as string)?.trim().toLowerCase()
    const name = (formData.get('name') as string)?.trim()
    const designation_id = (formData.get('designation_id') as string)?.trim() || null

    if (!email || !name) {
      return { error: 'Name and email are required.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const nowIso = new Date().toISOString()
      const existing = store.invitations.find(
        (inv) =>
          inv.email.toLowerCase() === email.toLowerCase() &&
          !inv.accepted_at &&
          !inv.revoked_at &&
          inv.expires_at > nowIso
      )
      if (existing) {
        return { error: 'An active invitation already exists for this email address.' }
      }

      const rawToken = generateInvitationToken()
      const tokenHash = hashToken(rawToken)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const newInv: DbInvitation = {
        id: `inv-${Date.now()}`,
        email,
        name,
        token_hash: tokenHash,
        designation_id,
        invited_by: user.id,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      }
      store.invitations.unshift(newInv)
      writeLocalStore(store)

      return {
        success: true,
        token: rawToken,
        inviteUrl: `/member/register?token=${rawToken}`,
        invitation: newInv,
      }
    }

    if (!isDbConfigured()) {
      return { error: 'Database service unavailable.' }
    }

    // Check if there is already an active (unaccepted, unexpired, unrevoked) invitation for this email
    const existing = await sql`
      SELECT id, expires_at, accepted_at, revoked_at
      FROM public.invitations
      WHERE lower(email) = ${email}
        AND accepted_at IS NULL
        AND revoked_at IS NULL
        AND expires_at > now()
      LIMIT 1
    `

    if (existing && existing.length > 0) {
      return { error: 'An active invitation already exists for this email address.' }
    }

    const rawToken = generateInvitationToken()
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

    // Invalidate any pre-existing active sessions for this email immediately in Neon Auth
    try {
      const authUserRows = await sql`SELECT id FROM neon_auth.user WHERE lower(email) = ${email} LIMIT 1`
      if (authUserRows && authUserRows.length > 0) {
        const existingUserId = authUserRows[0].id
        await sql`DELETE FROM neon_auth.session WHERE "userId" = ${existingUserId}`
      }
    } catch (e) {
      console.warn('Could not invalidate old sessions during invitation dispatch:', e)
    }

    const rows = await sql`
      INSERT INTO public.invitations (
        email, name, token_hash, designation_id, expires_at, invited_by
      ) VALUES (
        ${email}, ${name}, ${tokenHash}, ${designation_id}, ${expiresAt}, ${user.id}
      )
      RETURNING *
    `

    const data = (rows as any[])[0]

    return {
      success: true,
      token: rawToken,
      inviteUrl: `/member/register?token=${rawToken}`,
      invitation: data,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate invitation'
    return { error: message }
  }
}

export async function revokeInvitationAction(invitationId: string) {
  try {
    const { user } = await requireAdminSession()
    const permissions = getAdminPermissions(user.email)
    if (!permissions.canManageInvitations) {
      return { error: 'Permission denied: Your account cannot revoke invitations.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const inv = store.invitations.find((i) => i.id === invitationId)
      if (inv) {
        inv.revoked_at = new Date().toISOString()
        writeLocalStore(store)
      }
      return { success: true }
    }

    if (!isDbConfigured()) return { error: 'Database client unavailable.' }

    await sql`
      UPDATE public.invitations
      SET revoked_at = now()
      WHERE id = ${invitationId}
    `

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to revoke invitation'
    return { error: message }
  }
}

export async function getInvitationsList(): Promise<{ invitations: DbInvitation[]; error?: string }> {
  try {
    const { user } = await requireAdminSession()
    const permissions = getAdminPermissions(user.email)
    if (!permissions.canManageInvitations) {
      return { invitations: [], error: 'Permission denied: Access restricted.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const invitations = store.invitations.map((inv) => ({
        ...inv,
        designation: store.designations.find((d) => d.id === inv.designation_id),
      }))
      return { invitations }
    }

    if (!isDbConfigured()) return { invitations: [], error: 'Database unconfigured' }

    const rows = await sql`
      SELECT 
        i.*,
        d.id AS des_id,
        d.name AS des_name,
        d.category AS des_category,
        d.category_label AS des_category_label,
        d.display_order AS des_display_order,
        d.description AS des_description,
        d.is_core AS des_is_core,
        d.is_active AS des_is_active
      FROM public.invitations i
      LEFT JOIN public.designations d ON i.designation_id = d.id
      ORDER BY i.created_at DESC
    `

    const invitations: DbInvitation[] = (rows as any[]).map((r) => {
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
        : null

      const { des_id, des_name, des_category, des_category_label, des_display_order, des_description, des_is_core, des_is_active, ...inv } = r
      return {
        ...inv,
        designation,
      }
    })

    return { invitations }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized'
    return { invitations: [], error: message }
  }
}

/**
 * Retrieves or generates an active cryptographic registration link for a pending invitation.
 * Allows administrators to copy and resend unique invitation links anytime from the roster.
 */
export async function getOrCreateInvitationLinkAction(invitationId: string): Promise<{
  success: boolean
  inviteUrl?: string
  token?: string
  error?: string
}> {
  try {
    const { user } = await requireAdminSession()
    const permissions = getAdminPermissions(user.email)
    if (!permissions.canManageInvitations) {
      return { success: false, error: 'Permission denied: Cannot manage invitations.' }
    }

    if (isLocalDevMode()) {
      const store = readLocalStore()
      const inv = store.invitations.find((i) => i.id === invitationId)
      if (!inv) return { success: false, error: 'Invitation not found.' }
      if (inv.revoked_at) return { success: false, error: 'Invitation has been revoked.' }
      if (inv.accepted_at) return { success: false, error: 'Invitation has already been accepted.' }

      const rawToken = generateInvitationToken()
      const tokenHash = hashToken(rawToken)
      inv.token_hash = tokenHash
      inv.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      writeLocalStore(store)

      return {
        success: true,
        token: rawToken,
        inviteUrl: `/member/register?token=${rawToken}`,
      }
    }

    if (!isDbConfigured()) return { success: false, error: 'Database client unavailable.' }

    const rows = await sql`
      SELECT id, email, accepted_at, revoked_at, expires_at
      FROM public.invitations
      WHERE id = ${invitationId}
      LIMIT 1
    `

    if (!rows || rows.length === 0) {
      return { success: false, error: 'Invitation not found.' }
    }

    const inv: any = rows[0]
    if (inv.revoked_at) return { success: false, error: 'This invitation has been revoked.' }
    if (inv.accepted_at) return { success: false, error: 'This invitation has already been accepted.' }

    const rawToken = generateInvitationToken()
    const tokenHash = hashToken(rawToken)
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await sql`
      UPDATE public.invitations
      SET token_hash = ${tokenHash},
          expires_at = ${newExpiresAt}
      WHERE id = ${invitationId}
    `

    return {
      success: true,
      token: rawToken,
      inviteUrl: `/member/register?token=${rawToken}`,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve invitation link'
    return { success: false, error: msg }
  }
}
