import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/callback";

// Reuse one pool across dev hot reloads so HMR doesn't leak connections.
const globalForDb = globalThis as unknown as { dbPool?: Pool };
const pool = globalForDb.dbPool ?? new Pool({ connectionString });
if (process.env.NODE_ENV !== "production") globalForDb.dbPool = pool;

export const db = drizzle(pool, { schema });
