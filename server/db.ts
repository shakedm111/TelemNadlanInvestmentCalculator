import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

neonConfig.fetchConnectionCache = true;

// Use the DATABASE_URL environment variable for connection
const sql = neon(process.env.DATABASE_URL!);

// Create the database connection
export const db = drizzle(sql, { schema });
