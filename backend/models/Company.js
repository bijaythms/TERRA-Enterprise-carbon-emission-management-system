const { query } = require("../db/db")

function mapCompany(row) {
  if (!row) return null

  return {
    _id: row.company_id,
    company_id: row.company_id,
    company_name: row.company_name,
    email: row.email,
    password: row.password,
    industry: row.industry,
    location: row.location,
    role: row.role,
    created_at: row.created_at,
  }
}

async function findByEmail(email) {
  const result = await query(
    `SELECT company_id, company_name, email, password, industry, location, role, created_at
     FROM companies
     WHERE email = $1
     LIMIT 1`,
    [email]
  )

  return mapCompany(result.rows[0])
}

async function findByEmailAndPassword(email, password) {
  const result = await query(
    `SELECT company_id, company_name, email, password, industry, location, role, created_at
     FROM companies
     WHERE email = $1 AND password = $2
     LIMIT 1`,
    [email, password]
  )

  return mapCompany(result.rows[0])
}

async function updatePassword(companyId, password) {
  const result = await query(
    `UPDATE companies
     SET password = $2
     WHERE company_id = $1
     RETURNING company_id, company_name, email, password, industry, location, role, created_at`,
    [companyId, password]
  )

  return mapCompany(result.rows[0])
}

async function create({ company_name, email, password, industry = "", location = "", role = "company" }) {
  const result = await query(
    `INSERT INTO companies (company_name, email, password, industry, location, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING company_id, company_name, email, password, industry, location, role, created_at`,
    [company_name, email.toLowerCase(), password, industry, location, role]
  )

  return mapCompany(result.rows[0])
}

async function createMany(companies) {
  const created = []

  for (const company of companies) {
    created.push(await create(company))
  }

  return created
}

async function findById(id) {
  const result = await query(
    `SELECT company_id, company_name, email, password, industry, location, role, created_at
     FROM companies
     WHERE company_id = $1
     LIMIT 1`,
    [id]
  )

  return mapCompany(result.rows[0])
}

async function getAll() {
  const result = await query(
    `SELECT company_id, company_name, email, password, industry, location, role, created_at
     FROM companies
     ORDER BY created_at DESC`
  )

  return result.rows.map(mapCompany)
}

async function getByIndustry(industry) {
  const result = await query(
    `SELECT company_id, company_name, email, password, industry, location, role, created_at
     FROM companies
     WHERE industry = $1`,
    [industry]
  )

  return result.rows.map(mapCompany)
}

module.exports = {
  findByEmail,
  findByEmailAndPassword,
  create,
  createMany,
  findById,
  getAll,
  getByIndustry,
  updatePassword,
}
