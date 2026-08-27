import { defineConfig } from "drizzle-kit";
import { getDatabaseUrl } from "./src/db/connection-string";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
