
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

// ── Resolve database connection string ──
// Try multiple common env var names used by different providers
const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  undefined;

const envVarUsed = process.env.POSTGRES_URL
  ? 'POSTGRES_URL'
  : process.env.DATABASE_URL
    ? 'DATABASE_URL'
    : process.env.POSTGRES_URL_NON_POOLING
      ? 'POSTGRES_URL_NON_POOLING'
      : 'NONE';

if (!connectionString) {
  console.error(
    '[RIZQ DB] ❌ No database URL found. Checked: POSTGRES_URL, DATABASE_URL, POSTGRES_URL_NON_POOLING. ' +
    'Set one of these in Vercel → Settings → Environment Variables.'
  );
} else {
  console.log(`[RIZQ DB] ✅ Using ${envVarUsed} for database connection.`);
}

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString,
    ssl: connectionString?.includes('sslmode=')
      ? undefined                         // let the URL handle SSL
      : { rejectUnauthorized: false },    // force SSL for providers that require it
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
  });
} else {
  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString,
      connectionTimeoutMillis: 5000,
    });
  }
  pool = global._pgPool;
}

export default pool;

