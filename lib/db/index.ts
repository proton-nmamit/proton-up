import { neon, NeonQueryFunction } from '@neondatabase/serverless'

let sqlInstance: NeonQueryFunction<false, false> | null = null

export function getDb(): NeonQueryFunction<false, false> {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL / POSTGRES_URL environment variable is not defined.')
  }
  if (!sqlInstance) {
    sqlInstance = neon(connectionString)
  }
  return sqlInstance
}

export function isDbConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL
  )
}

/**
 * Direct tagged-template SQL executor for Neon PostgreSQL.
 * Example:
 * const profiles = await sql`SELECT * FROM public.profiles WHERE status = ${status}`;
 */
export const sql: NeonQueryFunction<false, false> = ((strings: TemplateStringsArray, ...values: any[]) => {
  const db = getDb()
  return db(strings, ...values)
}) as any
