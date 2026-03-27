const Company = require("../models/Company")
const Emission = require("../models/Emission")
const SustainabilityScore = require("../models/SustainabilityScore")

exports.getDashboard = async (req, res) => {
  try {
    const { company_id } = req.params

    const company = await Company.findById(company_id)
    const latestEmission = await Emission.findLatestByCompanyId(company_id)
    const latestScore = await SustainabilityScore.findLatestByCompanyId(company_id)

    res.json({
      company: company
        ? {
            company_name: company.company_name,
            industry: company.industry,
            location: company.location,
          }
        : null,
      latest_emissions: latestEmission || null,
      latest_score: latestScore
        ? {
            score: latestScore.score,
            status: latestScore.status,
            emission_id: latestScore.emission_id,
          }
        : null,
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
}
