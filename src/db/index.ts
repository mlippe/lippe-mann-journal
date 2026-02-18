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
function createDb() {
  return isLocal
    ? drizzlePg(new pg.Pool({ connectionString: process.env.DATABASE_URL! }), {
        schema,
      })
    : drizzleNeon(new Pool({ connectionString: process.env.DATABASE_URL! }), {
        schema,
      });
}

// Cache on globalThis to prevent connection pool leaks during Next.js HMR
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createDb>;
};
export const db = (globalForDb.db ??= createDb());
