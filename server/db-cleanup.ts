import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { log } from "./vite";
import ws from 'ws';

const CLEANUP_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

neonConfig.webSocketConstructor = ws;

export async function setupDatabaseCleanup() {
  const mainPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  async function recreateDatabase() {
    try {
      // Connect to the database
      const client = await mainPool.connect();

      try {
        // Drop all existing tables
        await client.query(`
          DO $$ DECLARE
            r RECORD;
          BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
              EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
          END $$;
        `);

        log('Cleared all tables from database');

        // Run migrations using Drizzle
        // Note: The actual migrations will be handled by npm run db:push
        // which will be triggered after the server restarts

      } finally {
        client.release();
      }

    } catch (error) {
      log('Error during database cleanup:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Schedule periodic cleanup
  setInterval(recreateDatabase, CLEANUP_INTERVAL);

  // Initial cleanup
  await recreateDatabase();
}