import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Use a dummy URL during build time
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/dummy';

// Create postgres client
const client = postgres(connectionString);

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export schema for use in queries
export * from './schema';
