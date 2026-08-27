import "server-only";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

type Schema = typeof schema;

const globalForDb = globalThis as unknown as {
  libsqlClient?: Client;
  drizzleDb?: LibSQLDatabase<Schema>;
};

// Opening the database file is deferred to first real use (not module load) so that
// importing this file — e.g. transitively, from any page that just checks auth state —
// doesn't fail Next's build-time page data collection. That step runs before deploy
// platforms like Railway mount a persistent volume, so the DB file/directory may not
// exist yet at build time even though it will at request time.
function getDb(): LibSQLDatabase<Schema> {
  if (globalForDb.drizzleDb) return globalForDb.drizzleDb;

  const client = createClient({ url: `file:${process.env.DATABASE_URL ?? "app.sqlite"}` });
  const instance = drizzle(client, { schema });

  globalForDb.libsqlClient = client;
  globalForDb.drizzleDb = instance;
  return instance;
}

export const db: LibSQLDatabase<Schema> = new Proxy({} as LibSQLDatabase<Schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
