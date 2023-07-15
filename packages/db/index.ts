import { drizzle } from "drizzle-orm/planetscale-serverless";
import { connect } from "@planetscale/database";

const connection = connect({ url: process.env.DATABASE_URL });

export const db = drizzle(connection);
