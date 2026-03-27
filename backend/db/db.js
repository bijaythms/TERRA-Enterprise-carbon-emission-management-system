const { Pool } = require("pg")

const config = {
  host: process.env.POSTGRES_HOST || "postgres",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres123",
  database: process.env.POSTGRES_DB || "terra",
}

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    })
  : new Pool(config)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForDatabaseReady() {
  const maxAttempts = Number(process.env.DB_CONNECT_RETRIES || 20)
  const retryDelayMs = Number(process.env.DB_CONNECT_DELAY_MS || 5000)
  let lastError = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await pool.query("SELECT 1")
      return
    } catch (err) {
      lastError = err
      console.warn(`Database connection attempt ${attempt}/${maxAttempts} failed: ${err.message}`)
      if (attempt < maxAttempts) {
        await sleep(retryDelayMs)
      }
    }
  }

  throw lastError
}

async function query(text, params = []) {
  return pool.query(text, params)
}

async function initDb() {
  await waitForDatabaseReady()

  await query(`
    CREATE TABLE IF NOT EXISTS companies (
      company_id SERIAL PRIMARY KEY,
      company_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      industry TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'company',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT companies_role_check CHECK (role IN ('company', 'admin'))
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS emissions (
      emission_id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      energy_consumption DOUBLE PRECISION NOT NULL DEFAULT 0,
      fuel_consumption DOUBLE PRECISION NOT NULL DEFAULT 0,
      transport_emissions DOUBLE PRECISION NOT NULL DEFAULT 0,
      waste_production DOUBLE PRECISION NOT NULL DEFAULT 0,
      water_usage DOUBLE PRECISION NOT NULL DEFAULT 0,
      renewable_energy DOUBLE PRECISION NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS sustainability_scores (
      score_id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      score INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await query(`
    CREATE INDEX IF NOT EXISTS idx_emissions_company_created_at
    ON emissions (company_id, created_at DESC)
  `)

  await query(`
    CREATE INDEX IF NOT EXISTS idx_scores_company_created_at
    ON sustainability_scores (company_id, created_at DESC)
  `)

  await query(`
    ALTER TABLE emissions
    ADD COLUMN IF NOT EXISTS submission_status TEXT NOT NULL DEFAULT 'submitted'
  `)

  await query(`
    ALTER TABLE emissions
    ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES companies(company_id) ON DELETE SET NULL
  `)

  await query(`
    ALTER TABLE emissions
    ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES companies(company_id) ON DELETE SET NULL
  `)

  await query(`
    ALTER TABLE emissions
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ
  `)

  await query(`
    ALTER TABLE emissions
    ADD COLUMN IF NOT EXISTS review_notes TEXT NOT NULL DEFAULT ''
  `)

  await query(`
    ALTER TABLE emissions
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `)

  await query(`
    ALTER TABLE sustainability_scores
    ADD COLUMN IF NOT EXISTS emission_id INTEGER REFERENCES emissions(emission_id) ON DELETE CASCADE
  `)

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_scores_emission_id_unique
    ON sustainability_scores (emission_id)
    WHERE emission_id IS NOT NULL
  `)

  console.log("Connected to Terra PostgreSQL")
}

async function closeDb() {
  await pool.end()
}

module.exports = {
  pool,
  query,
  initDb,
  closeDb,
  waitForDatabaseReady,
}
