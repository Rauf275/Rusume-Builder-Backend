import pg from 'pg';

const { Pool } = pg;

// DATABASE_URL is provided automatically by Railway (and most other hosts)
// once a PostgreSQL instance is attached to the project. Locally, copy
// .env.example to .env and point it at your own Postgres instance.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set. Add a PostgreSQL database and connect it to this service.');
  process.exit(1);
}

// Most managed Postgres providers (Railway included) require SSL, but use
// self-signed certs, so the default strict verification fails. This is the
// standard workaround for that specific case.
export const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
});

// A resume is stored as a single JSONB blob rather than being normalized
// into separate columns per field. This mirrors the shape already used by
// the frontend's zustand store ({ resume, sectionOrder, hiddenSections }),
// so no mapping layer is needed between the client state and the DB row —
// the whole object is saved and loaded as-is.
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

export async function initDb() {
  // gen_random_uuid() lives in pgcrypto on older Postgres versions;
  // Postgres 13+ (which Railway provisions) has it built in, but this
  // keeps things working on older/self-hosted instances too.
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
  await pool.query(SCHEMA);
}
