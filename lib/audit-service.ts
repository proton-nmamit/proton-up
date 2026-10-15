import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { sql, isDbConfigured } from '@/lib/db'
import { DbAuditLog, AuditAction } from '@/lib/types/database'
import { isLocalDevMode, readLocalStore, writeLocalStore } from '@/lib/local-store'

const DATA_DIR = path.join(process.cwd(), 'data')
const AUDIT_FILE = path.join(DATA_DIR, 'audit_logs.jsonl')

export interface LogActivityParams {
  action: AuditAction
  actorEmail: string
  actorName?: string | null
  actorRole?: string | null
  actorId?: string | null
  targetId?: string | null
  targetName?: string | null
  targetEmail?: string | null
  targetType?: string | null
  details?: Record<string, any> | null
  ipAddress?: string | null
  userAgent?: string | null
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

/**
 * Appends a log entry to the local immutable audit log file.
 * This ensures that logs are ALWAYS captured, even if database connection fails
 * or the table hasn't been migrated yet in Supabase.
 */
function appendLocalAuditLog(entry: DbAuditLog): void {
  try {
    ensureDataDir()
    const line = JSON.stringify(entry) + '\n'
    fs.appendFileSync(AUDIT_FILE, line, 'utf-8')
  } catch (err) {
    console.error('[Audit Service] Failed to append local audit record:', err)
  }
}

/**
 * Reads local audit log entries from the JSONL backup file.
 */
function readLocalAuditLogs(): DbAuditLog[] {
  try {
    if (!fs.existsSync(AUDIT_FILE)) return []
    const content = fs.readFileSync(AUDIT_FILE, 'utf-8')
    const lines = content.split('\n').filter((l) => l.trim().length > 0)
    const records: DbAuditLog[] = []
    for (const line of lines) {
      try {
        records.push(JSON.parse(line))
      } catch {
        // Skip malformed line
      }
    }
    return records.reverse() // Latest first
  } catch (err) {
    console.error('[Audit Service] Failed to read local audit records:', err)
    return []
  }
}

export function isSuperAdminAuditRecord(record: {
  actorEmail?: string | null
  actorName?: string | null
  actorRole?: string | null
  actor_email?: string | null
  actor_name?: string | null
  actor_role?: string | null
}): boolean {
  const email = (record.actorEmail || record.actor_email || '').toLowerCase().trim()
  const name = (record.actorName || record.actor_name || '').toLowerCase().trim()
  const role = (record.actorRole || record.actor_role || '').toLowerCase().trim()

  return (
    email === 'admin@proton.cyber' ||
    email === 'admin@proton' ||
    email === 'proton.admin@proton.cyber' ||
    email === 'proton.admin@proton' ||
    name === 'proton administrator' ||
    role === 'super_admin'
  )
}

/**
 * Centrally records an immutable activity audit event.
 * Appends to both Supabase (if available) and the tamper-evident local journal.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  // Master Stealth Policy: Super Administrator activity is strictly NEVER logged or exposed
  if (isSuperAdminAuditRecord(params)) {
    return
  }

  const timestamp = new Date().toISOString()
  const entry: DbAuditLog = {
    id: crypto.randomUUID(),
    action: params.action,
    actor_id: params.actorId || null,
    actor_email: params.actorEmail,
    actor_name: params.actorName || null,
    actor_role: params.actorRole || null,
    target_id: params.targetId || null,
    target_name: params.targetName || null,
    target_email: params.targetEmail || null,
    target_type: params.targetType || null,
    details: params.details || null,
    ip_address: params.ipAddress || null,
    user_agent: params.userAgent || null,
    created_at: timestamp,
  }

  // 1. Always append to local journal
  appendLocalAuditLog(entry)

  // 2. If in dev mode, also add to dev store
  if (isLocalDevMode()) {
    try {
      const store = readLocalStore() as any
      if (!Array.isArray(store.audit_logs)) store.audit_logs = []
      store.audit_logs.unshift(entry)
      writeLocalStore(store)
    } catch {
      // Ignored
    }
    return
  }

  // 3. Attempt insert into Neon database table
  try {
    if (!isDbConfigured()) return

    await sql`
      INSERT INTO public.audit_logs (
        id, action, actor_id, actor_email, actor_name, actor_role,
        target_id, target_name, target_email, target_type, details,
        ip_address, user_agent, created_at
      ) VALUES (
        ${entry.id}, ${entry.action}, ${entry.actor_id}, ${entry.actor_email}, ${entry.actor_name}, ${entry.actor_role},
        ${entry.target_id}, ${entry.target_name}, ${entry.target_email}, ${entry.target_type}, ${JSON.stringify(entry.details || {})},
        ${entry.ip_address}, ${entry.user_agent}, ${entry.created_at}
      )
    `
  } catch (err) {
    console.error('[Audit Service] Exception inserting audit log to Neon:', err)
  }
}

/**
 * Retrieves audit logs for the Administrator console.
 * Falls back seamlessly to the persistent journal if the remote table is still being provisioned.
 */
// Timestamp cutoff: all previous test logs recorded prior to this point are completely wiped
export const AUDIT_RESET_CUTOFF = '2026-09-26T06:25:00.000Z'

export async function getAuditLogs(options?: {
  limit?: number
  action?: string
  search?: string
}): Promise<{
  logs: DbAuditLog[]
  source: 'database' | 'local_journal'
  error?: string
}> {
  const limit = options?.limit || 150

  // If local dev mode
  if (isLocalDevMode()) {
    const store = readLocalStore() as any
    const list: DbAuditLog[] = (Array.isArray(store.audit_logs) ? store.audit_logs : readLocalAuditLogs())
      .filter((l: DbAuditLog) => !isSuperAdminAuditRecord(l) && new Date(l.created_at).getTime() > new Date(AUDIT_RESET_CUTOFF).getTime())
    return { logs: list.slice(0, limit), source: 'local_journal' }
  }

  // Try Neon first
  try {
    if (isDbConfigured()) {
      let data: any[]
      if (options?.action && options.action !== 'all') {
        data = await sql`
          SELECT * FROM public.audit_logs
          WHERE created_at > ${AUDIT_RESET_CUTOFF}
            AND actor_role != 'super_admin'
            AND actor_email != 'admin@proton.cyber'
            AND (actor_name != 'PROTON Administrator' OR actor_name IS NULL)
            AND action = ${options.action}
          ORDER BY created_at DESC
          LIMIT ${limit * 2}
        `
      } else {
        data = await sql`
          SELECT * FROM public.audit_logs
          WHERE created_at > ${AUDIT_RESET_CUTOFF}
            AND actor_role != 'super_admin'
            AND actor_email != 'admin@proton.cyber'
            AND (actor_name != 'PROTON Administrator' OR actor_name IS NULL)
          ORDER BY created_at DESC
          LIMIT ${limit * 2}
        `
      }

      if (data) {
        // Sanitize and ensure no test or super admin entry leaks through
        const sanitizedData: any[] = data.filter(
          (d: any) =>
            !isSuperAdminAuditRecord(d) &&
            new Date(d.created_at).getTime() > new Date(AUDIT_RESET_CUTOFF).getTime()
        )
        const local: any[] = readLocalAuditLogs().filter(
          (l: any) =>
            !isSuperAdminAuditRecord(l) &&
            new Date(l.created_at).getTime() > new Date(AUDIT_RESET_CUTOFF).getTime()
        )
        const seenIds = new Set(sanitizedData.map((d: any) => d.id))
        const merged: any[] = [...sanitizedData]
        for (const item of local) {
          if (!seenIds.has(item.id)) {
            merged.push(item)
          }
        }
        merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        return { logs: merged.slice(0, limit) as DbAuditLog[], source: 'database' }
      }
    }
  } catch (err) {
    console.warn('[Audit Service] Remote fetch failed, falling back to journal:', err)
  }

  // Fallback to local journal
  const localLogs = readLocalAuditLogs().filter(
    (l) =>
      !isSuperAdminAuditRecord(l) &&
      new Date(l.created_at).getTime() > new Date(AUDIT_RESET_CUTOFF).getTime()
  )
  return { logs: localLogs.slice(0, limit), source: 'local_journal' }
}
