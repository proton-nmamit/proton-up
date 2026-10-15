import { betterAuth } from 'better-auth';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { nextCookies } from 'better-auth/next-js';
import bcrypt from 'bcryptjs';
import pg from 'pg';

let pool: pg.Pool | null = null;

function getDbPool(): pg.Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      '';

    pool = new pg.Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export const auth = betterAuth({
  database: getDbPool(),
  secret: process.env.BETTER_AUTH_SECRET || 'proton-secret-key-32-chars-minimum-fallback',
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password: string) => {
        return hashPassword(password);
      },
      verify: async ({ hash, password }) => {
        if (!hash) return false;
        // Support legacy/migrated bcrypt hashes as well as standard scrypt hashes
        if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
          return bcrypt.compare(password, hash);
        }
        return verifyPassword({ hash, password });
      },
    },
  },
  advanced: {
    generateId: 'uuid',
    database: {
      generateId: 'uuid',
      validateSchema: false,
    },
  },
  plugins: [
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
