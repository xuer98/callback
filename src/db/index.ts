import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/callback";

// Reuse one pool across dev hot reloads so HMR doesn't leak connections.
// Keep the pool small: the hosted Postgres allows few connections, and both
// the build's parallel export workers and serverless instances each open
// their own pool — pg's default of 10 per pool exhausts the server.
const globalForDb = globalThis as unknown as { dbPool?: Pool };
const pool =
  globalForDb.dbPool ??
  new Pool({ connectionString, max: 4, idleTimeoutMillis: 5_000 });
if (process.env.NODE_ENV !== "production") globalForDb.dbPool = pool;

export const db = drizzle(pool, { schema });
