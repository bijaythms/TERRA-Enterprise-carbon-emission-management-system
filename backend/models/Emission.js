const { query } = require("../db/db")

function mapEmission(row) {
  if (!row) return null

  return {
    _id: row.emission_id,
    id: row.emission_id,
    emission_id: row.emission_id,
    company_id: row.company_id,
    energy_consumption: Number(row.energy_consumption),
    fuel_consumption: Number(row.fuel_consumption),
    transport_emissions: Number(row.transport_emissions),
    waste_production: Number(row.waste_production),
    water_usage: Number(row.water_usage),
    renewable_energy: Number(row.renewable_energy),
    submission_status: row.submission_status,
    created_by: row.created_by,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    review_notes: row.review_notes || "",
    updated_at: row.updated_at,
    created_at: row.created_at,
  }
}

async function create(data) {
  const result = await query(
    `INSERT INTO emissions (
      company_id,
      energy_consumption,
      fuel_consumption,
      transport_emissions,
      waste_production,
      water_usage,
      renewable_energy,
      submission_status,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING emission_id, company_id, energy_consumption, fuel_consumption,
              transport_emissions, waste_production, water_usage,
              renewable_energy, submission_status, created_by, reviewed_by,
              reviewed_at, review_notes, updated_at, created_at`,
    [
      data.company_id,
      data.energy_consumption || 0,
      data.fuel_consumption || 0,
      data.transport_emissions || 0,
      data.waste_production || 0,
      data.water_usage || 0,
      data.renewable_energy || 0,
      data.submission_status || "submitted",
      data.created_by || data.company_id,
    ]
  )

  return mapEmission(result.rows[0])
}

async function createMany(emissions) {
  const created = []

  for (const emission of emissions) {
    created.push(await create(emission))
  }

  return created
}

async function findLatestByCompanyId(companyId) {
  const result = await query(
    `SELECT emission_id, company_id, energy_consumption, fuel_consumption,
            transport_emissions, waste_production, water_usage,
            renewable_energy, submission_status, created_by, reviewed_by,
            reviewed_at, review_notes, updated_at, created_at
     FROM emissions
     WHERE company_id = $1
     ORDER BY created_at DESC, emission_id DESC
     LIMIT 1`,
    [companyId]
  )

  return mapEmission(result.rows[0])
}

async function getLatestForAllCompanies() {
  const result = await query(
    `SELECT DISTINCT ON (e.company_id)
        e.emission_id,
        e.company_id,
        e.energy_consumption,
        e.fuel_consumption,
        e.transport_emissions,
        e.waste_production,
        e.water_usage,
        e.renewable_energy,
        e.submission_status,
        e.created_by,
        e.reviewed_by,
        e.reviewed_at,
        e.review_notes,
        e.updated_at,
        e.created_at
     FROM emissions e
     ORDER BY e.company_id, e.created_at DESC, e.emission_id DESC`
  )

  return result.rows.map(mapEmission)
}

async function getReviewQueue() {
  const result = await query(
    `SELECT e.emission_id, e.company_id, e.energy_consumption, e.fuel_consumption,
            e.transport_emissions, e.waste_production, e.water_usage,
            e.renewable_energy, e.submission_status, e.created_by, e.reviewed_by,
            e.reviewed_at, e.review_notes, e.updated_at, e.created_at,
            c.company_name, c.industry, c.location
     FROM emissions e
     INNER JOIN companies c ON c.company_id = e.company_id
     WHERE e.submission_status IN ('submitted', 'changes_requested')
     ORDER BY e.created_at DESC, e.emission_id DESC`
  )

  return result.rows.map((row) => ({
    ...mapEmission(row),
    company_name: row.company_name,
    industry: row.industry,
    location: row.location,
  }))
}

async function reviewSubmission(emissionId, { submission_status, review_notes = "", reviewed_by }) {
  const result = await query(
    `UPDATE emissions
     SET submission_status = $2,
         review_notes = $3,
         reviewed_by = $4,
         reviewed_at = NOW(),
         updated_at = NOW()
     WHERE emission_id = $1
     RETURNING emission_id, company_id, energy_consumption, fuel_consumption,
               transport_emissions, waste_production, water_usage,
               renewable_energy, submission_status, created_by, reviewed_by,
               reviewed_at, review_notes, updated_at, created_at`,
    [emissionId, submission_status, review_notes, reviewed_by || null]
  )

  return mapEmission(result.rows[0])
}

module.exports = {
  create,
  createMany,
  findLatestByCompanyId,
  getLatestForAllCompanies,
  getReviewQueue,
  reviewSubmission,
}
