import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  connectionString: process.env.DATABASE_URL,
  schema: ["./schemas/auth.ts", "./schemas/schema.ts"],
} satisfies Config;
