import { connect } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";
import { migrate } from "drizzle-orm/planetscale-serverless/migrator";

import * as schema from "./schema";

const connection = connect({ url: process.env.DATABASE_URL });

export const db = drizzle(connection, { schema });

await migrate(db, { migrationsFolder: "generated" });

export * from "drizzle-orm";
