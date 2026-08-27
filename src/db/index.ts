import "server-only";
import postgres, { type Sql } from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { getDatabaseUrl } from "./connection-string";

type Schema = typeof schema;

const globalForDb = globalThis as unknown as {
  pgClient?: Sql;
  drizzleDb?: PostgresJsDatabase<Schema>;
};

// Opening the connection is deferred to first real use (not module load) so that
// importing this file — e.g. transitively, from any page that just checks auth state —
// doesn't fail Next's build-time page data collection or crash on missing env vars
// before the Postgres container is actually reachable.
function getDb(): PostgresJsDatabase<Schema> {
  if (globalForDb.drizzleDb) return globalForDb.drizzleDb;

  const client = postgres(getDatabaseUrl());
  const instance = drizzle(client, { schema });

  globalForDb.pgClient = client;
  globalForDb.drizzleDb = instance;
  return instance;
}

export const db: PostgresJsDatabase<Schema> = new Proxy({} as PostgresJsDatabase<Schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
