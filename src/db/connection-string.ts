/**
 * Builds a Postgres connection string from either a single DATABASE_URL
 * override (handy for a managed provider that just gives you one string), or
 * discrete POSTGRES_* parts. Those are the same variable names the official
 * `postgres` Docker image reads for its own setup, so one .env file can
 * configure both the container (via docker-compose.yml) and this app.
 *
 * No "server-only" import here on purpose: this file is also imported by
 * drizzle.config.ts and scripts/seed.ts, which run outside Next's bundler
 * and would crash on that guard.
 */
export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = process.env.POSTGRES_HOST ?? "localhost";
  const port = process.env.POSTGRES_PORT ?? "5432";
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const database = process.env.POSTGRES_DB;

  if (!user || !password || !database) {
    throw new Error(
      "Set DATABASE_URL, or all of POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB, in your .env file.",
    );
  }

  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}
