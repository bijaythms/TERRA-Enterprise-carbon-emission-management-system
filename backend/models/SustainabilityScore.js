const { query } = require("../db/db")

function mapScore(row) {
  if (!row) return null

  return {
    _id: row.score_id,
    id: row.score_id,
    company_id: row.company_id,
    emission_id: row.emission_id,
    score: Number(row.score),
    status: row.status,
    created_at: row.created_at,
  }
}

async function create({ company_id, emission_id = null, score = 0, status = "" }) {
  const result = await query(
    `INSERT INTO sustainability_scores (company_id, emission_id, score, status)
     VALUES ($1, $2, $3, $4)
     RETURNING score_id, company_id, emission_id, score, status, created_at`,
    [company_id, emission_id, score, status]
  )

  return mapScore(result.rows[0])
}

async function createMany(scores) {
  const created = []

  for (const score of scores) {
    created.push(await create(score))
  }

  return created
}

async function findLatestByCompanyId(companyId) {
  const result = await query(
    `SELECT score_id, company_id, emission_id, score, status, created_at
     FROM sustainability_scores
     WHERE company_id = $1
     ORDER BY created_at DESC, score_id DESC
     LIMIT 1`,
    [companyId]
  )

  return mapScore(result.rows[0])
}

async function findByEmissionId(emissionId) {
  const result = await query(
    `SELECT score_id, company_id, emission_id, score, status, created_at
     FROM sustainability_scores
     WHERE emission_id = $1
     LIMIT 1`,
    [emissionId]
  )

  return mapScore(result.rows[0])
}

async function getIndustryAverage(industry) {
  const result = await query(
    `SELECT AVG(ss.score) AS avg_score
     FROM sustainability_scores ss
     INNER JOIN companies c ON c.company_id = ss.company_id
     WHERE c.industry = $1`,
    [industry]
  )

  const value = result.rows[0]?.avg_score
  return value === null || value === undefined ? 0 : Math.round(Number(value))
}

async function getIndustryLatestScores(industry) {
  const result = await query(
    `SELECT DISTINCT ON (c.company_id)
        c.company_id,
        c.company_name,
        c.industry,
        ss.score,
        ss.status,
        ss.created_at
     FROM companies c
     INNER JOIN sustainability_scores ss ON ss.company_id = c.company_id
     WHERE c.industry = $1
     ORDER BY c.company_id, ss.created_at DESC, ss.score_id DESC`,
    [industry]
  )

  return result.rows.map((row) => ({
    company_id: row.company_id,
    company_name: row.company_name,
    industry: row.industry,
    score: Number(row.score),
    status: row.status,
    created_at: row.created_at,
  }))
}

module.exports = {
  create,
  createMany,
  findLatestByCompanyId,
  findByEmissionId,
  getIndustryAverage,
  getIndustryLatestScores,
}
