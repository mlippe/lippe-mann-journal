import * as schema from "./schema";
import { Pool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import pg from "pg";
import { validateServerEnv } from "@/env";

validateServerEnv();

const isLocal = process.env.DATABASE_PROVIDER === "local";

// Use 'pg' for local/docker development and 'neon-serverless' for serverless/production
// Neon serverless (via WebSockets) supports transactions, which neon-http does not.
function createPool() {
  return isLocal
    ? new pg.Pool({ connectionString: process.env.DATABASE_URL! })
    : new Pool({ connectionString: process.env.DATABASE_URL! });
}

// Cache connection pool on globalThis to prevent connection pool leaks during Next.js HMR,
// while allowing Drizzle ORM to use the latest schema on module re-evaluation.
const globalForDb = globalThis as unknown as {
  pool: ReturnType<typeof createPool>;
};
const pool = (globalForDb.pool ??= createPool());

export const db = isLocal
  ? drizzlePg(pool as pg.Pool, { schema })
  : drizzleNeon(pool as Pool, { schema });
