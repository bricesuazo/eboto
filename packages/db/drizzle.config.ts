import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
  driver: "mysql2",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  schema: "./schema",
  out: "./generated",
} satisfies Config;
