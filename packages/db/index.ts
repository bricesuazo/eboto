import { config } from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import mysql, { type Pool } from "mysql2/promise";

const globalForMySQL = globalThis as unknown as { poolConnection: Pool };

const poolConnection =
  globalForMySQL.poolConnection ||
  mysql.createPool({
    uri: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production")
  globalForMySQL.poolConnection = poolConnection;

export const db = drizzle(poolConnection);
