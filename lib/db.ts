
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

// ── Validate required env var ──
const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  console.error(
    '[RIZQ DB] ❌ POSTGRES_URL is not set. Database connections will fail. ' +
    'Set this in your Vercel project settings → Environment Variables.'
  );
}

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Required for Vercel/Neon/Supabase
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
  });
} else {
  // In development, reuse the connection across hot reloads
  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString,
      connectionTimeoutMillis: 5000,
    });
  }
  pool = global._pgPool;
}

export default pool;

