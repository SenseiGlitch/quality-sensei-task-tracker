import "dotenv/config"; // Ensure .env variables are loaded
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";
import { setupDatabaseCleanup } from "./db-cleanup";
import { log } from "./vite";

// Ensure WebSockets are supported for Neon
neonConfig.webSocketConstructor = ws;

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing in .env file.");
  process.exit(1);
}

// Initialize NeonDB Pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Test NeonDB Connection
(async () => {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT version()");
    console.log("✅ Connected to NeonDB:", res.rows[0].version);
    client.release();
  } catch (error) {
    console.error("❌ Failed to connect to NeonDB:", error);
  }
})();

// Initialize database cleanup
setupDatabaseCleanup().catch(error => {
  log("❌ Failed to setup database cleanup:", error);
});
