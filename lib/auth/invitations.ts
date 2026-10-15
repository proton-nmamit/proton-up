import crypto from 'crypto'
import { sql, isDbConfigured } from '@/lib/db'
import { DbInvitation } from '@/lib/types/database'
import { isLocalDevMode, readLocalStore } from '@/lib/local-store'

/**
 * Computes SHA-256 hash of raw invitation token for database storage and comparison.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex')
}

/**
 * Generates a cryptographically secure 32-byte hexadecimal invitation token.
 */
export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export interface VerificationResult {
  valid: boolean
  reason?: string
  invitation?: DbInvitation
}

/**
 * Verifies if an invitation token is valid, active, and unused.
 */
export async function verifyInvitationToken(rawToken: string): Promise<VerificationResult> {
  if (!rawToken || typeof rawToken !== 'string') {
    return { valid: false, reason: 'Invalid token format.' }
  }

  if (isLocalDevMode()) {
    const store = readLocalStore()
    const tokenHash = hashToken(rawToken)
    const invitation = store.invitations.find((i) => i.token_hash === tokenHash)

    if (!invitation) {
      return { valid: false, reason: 'Invitation not found or invalid link.' }
    }
    if (invitation.revoked_at) {
      return { valid: false, reason: 'This invitation has been revoked by an administrator.' }
    }
    if (invitation.accepted_at) {
      return { valid: false, reason: 'This invitation has already been used to create an account.' }
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return { valid: false, reason: 'This invitation link has expired. Please request a new one from an administrator.' }
    }

    const designation = store.designations.find((d) => d.id === invitation.designation_id)
    return { valid: true, invitation: { ...invitation, designation } as any }
  }

  if (!isDbConfigured()) {
    return {
      valid: false,
      reason: 'Database is currently offline. Please configure DATABASE_URL in .env.local.',
    }
  }

  const tokenHash = hashToken(rawToken)

  try {
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
      WHERE i.token_hash = ${tokenHash}
      LIMIT 1
    `

    if (!rows || rows.length === 0) {
      return { valid: false, reason: 'Invitation not found or invalid link.' }
    }

    const r: any = rows[0]
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
    const invitation: DbInvitation = {
      ...inv,
      designation: designation as any,
    }

    if (invitation.revoked_at) {
      return { valid: false, reason: 'This invitation has been revoked by an administrator.' }
    }

    if (invitation.accepted_at) {
      return { valid: false, reason: 'This invitation has already been used to create an account.' }
    }

    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt < now) {
      return { valid: false, reason: 'This invitation link has expired. Please request a new one from an administrator.' }
    }

    return { valid: true, invitation }
  } catch (err) {
    console.error('[Invitation Error] Failed to verify invitation token in Neon:', err)
    return { valid: false, reason: 'An error occurred while validating the invitation.' }
  }
}
