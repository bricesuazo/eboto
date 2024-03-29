import "dotenv/config";

import type { Config } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
export default {
  driver: "mysql2",
  dbCredentials: {
    uri: process.env.DATABASE_URL,
  },
  schema: "./schema",
  out: "./generated",
} satisfies Config;
