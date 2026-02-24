
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    // Production-specific settings like SSL can be added here
  });
} else {
  // In development, reuse the connection across hot reloads
  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });
  }
  pool = global._pgPool;
}

export default pool;
