const Company = require("../models/Company")
const Emission = require("../models/Emission")
const { query } = require("../db/db")

exports.getAllCompanies = async (req, res) => {
  try {
    const [companies, latestEmissions] = await Promise.all([
      Company.getAll(),
      Emission.getLatestForAllCompanies(),
    ])

    const companyOnly = companies.filter((company) => company.role === "company")

    const emissionMap = new Map(latestEmissions.map((item) => [item.company_id, item]))

    res.json(
      companyOnly.map(({ password, ...company }) => ({
        ...company,
        latest_submission: emissionMap.get(company.company_id) || null,
      }))
    )
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
}

exports.getReviewQueue = async (req, res) => {
  try {
    const queue = await Emission.getReviewQueue()
    res.json(queue)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
}

exports.reviewEmission = async (req, res) => {
  try {
    const { emission_id } = req.params
    const { submission_status, review_notes = "", reviewed_by } = req.body
    const parsedEmissionId = Number.parseInt(emission_id, 10)
    const parsedReviewedBy = Number.isInteger(Number.parseInt(reviewed_by, 10))
      ? Number.parseInt(reviewed_by, 10)
      : null

    if (!Number.isInteger(parsedEmissionId)) {
      return res.status(400).json({ message: "Invalid emission id" })
    }

    if (!["verified", "changes_requested"].includes(submission_status)) {
      return res.status(400).json({ message: "Invalid review status" })
    }

    const reviewed = await Emission.reviewSubmission(parsedEmissionId, {
      submission_status,
      review_notes,
      reviewed_by: parsedReviewedBy,
    })

    if (!reviewed) {
      return res.status(404).json({ message: "Submission not found" })
    }

    res.json(reviewed)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
}

exports.getAdminStats = async (req, res) => {
  try {
    const companiesResult = await query(
      `SELECT company_id, company_name, industry, location, role
       FROM companies
       WHERE role = 'company'
       ORDER BY created_at DESC`
    )

    const latestEmissionsResult = await query(
      `SELECT DISTINCT ON (e.company_id)
          e.company_id,
          c.company_name,
          c.industry,
          c.location,
          e.energy_consumption,
          e.fuel_consumption,
          e.transport_emissions,
          e.waste_production,
          e.water_usage,
          e.renewable_energy,
          e.created_at
       FROM emissions e
       INNER JOIN companies c ON c.company_id = e.company_id
       WHERE c.role = 'company'
       ORDER BY e.company_id, e.created_at DESC, e.emission_id DESC`
    )

    const latestScoresResult = await query(
      `SELECT DISTINCT ON (s.company_id)
          s.company_id,
          s.score,
          s.status,
          s.created_at
       FROM sustainability_scores s
       INNER JOIN companies c ON c.company_id = s.company_id
       WHERE c.role = 'company'
       ORDER BY s.company_id, s.created_at DESC, s.score_id DESC`
    )

    const companies = companiesResult.rows
    const latestEmissions = latestEmissionsResult.rows.map((row) => {
      const total =
        Number(row.energy_consumption || 0) +
        Number(row.fuel_consumption || 0) +
        Number(row.transport_emissions || 0) +
        Number(row.waste_production || 0)

      return {
        company_id: row.company_id,
        company_name: row.company_name,
        industry: row.industry || "Unspecified",
        location: row.location || "",
        renewable_energy: Number(row.renewable_energy || 0),
        total_emission: total,
        created_at: row.created_at,
      }
    })

    const latestScores = latestScoresResult.rows.map((row) => ({
      company_id: row.company_id,
      score: Number(row.score || 0),
      status: row.status || "",
      created_at: row.created_at,
    }))

    const scoresByCompany = new Map(latestScores.map((score) => [score.company_id, score]))
    const emissionsByCompany = new Map(latestEmissions.map((emission) => [emission.company_id, emission]))

    const registeredCompanies = companies.length
    const submissionsFiled = latestEmissions.length
    const totalPlatformEmission = latestEmissions.reduce((sum, item) => sum + item.total_emission, 0)
    const avgScoreRaw =
      latestScores.length > 0
        ? latestScores.reduce((sum, item) => sum + item.score, 0) / latestScores.length
        : 0
    const platformAvgScore = Math.round(avgScoreRaw)

    const activeAlerts = companies.reduce((count, company) => {
      const score = scoresByCompany.get(company.company_id)
      const emission = emissionsByCompany.get(company.company_id)
      const lowScore = score && score.score < 50
      const lowRenewable = emission && emission.renewable_energy < 30
      return count + (lowScore || lowRenewable ? 1 : 0)
    }, 0)

    const scoreDistribution = {
      A: latestScores.filter((item) => item.score >= 90).length,
      B: latestScores.filter((item) => item.score >= 70 && item.score < 90).length,
      C: latestScores.filter((item) => item.score >= 50 && item.score < 70).length,
      D: latestScores.filter((item) => item.score < 50).length,
    }

    const totalSectorEmission = totalPlatformEmission || 1
    const sectorMap = new Map()

    for (const emission of latestEmissions) {
      const current = sectorMap.get(emission.industry) || {
        industry: emission.industry,
        company_count: 0,
        total_emission: 0,
      }

      current.company_count += 1
      current.total_emission += emission.total_emission
      sectorMap.set(emission.industry, current)
    }

    const sectorEmissions = Array.from(sectorMap.values())
      .sort((a, b) => b.total_emission - a.total_emission)
      .map((sector) => ({
        ...sector,
        share_percent: Math.round((sector.total_emission / totalSectorEmission) * 100),
      }))

    const pendingSubmissions = Math.max(registeredCompanies - submissionsFiled, 0)
    const topSector = sectorEmissions[0]?.industry || "No sector data yet"

    res.json({
      summary: {
        total_platform_co2e: Math.round(totalPlatformEmission),
        registered_companies: registeredCompanies,
        submissions_filed: submissionsFiled,
        platform_avg_score: platformAvgScore,
        active_alerts: activeAlerts,
        pending_submissions: pendingSubmissions,
        top_sector: topSector,
      },
      score_distribution: scoreDistribution,
      sector_emissions: sectorEmissions,
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
}
