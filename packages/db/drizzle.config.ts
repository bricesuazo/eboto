import "dotenv/config";

import type { Config } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
export default {
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
  schema: "./schema",
  out: "./generated",
} satisfies Config;
