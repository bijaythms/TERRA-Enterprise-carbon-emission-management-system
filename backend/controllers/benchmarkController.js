const Company = require("../models/Company")
const SustainabilityScore = require("../models/SustainabilityScore")

exports.getBenchmark = async (req, res) => {
  try {
    const { company_id } = req.params

    const company = await Company.findById(company_id)
    if (!company) {
      return res.status(404).json({ message: "Company not found" })
    }

    const { industry } = company
    const companyScore = await SustainabilityScore.findLatestByCompanyId(company_id)

    if (!companyScore) {
      return res.json({ message: "No sustainability score available" })
    }

    const score = companyScore.score
    const avgScore = await SustainabilityScore.getIndustryAverage(industry)

    let performance = ""
    if (score > avgScore) performance = "Above Industry Average"
    else if (score === avgScore) performance = "Equal to Industry Average"
    else performance = "Below Industry Average"

    res.json({ company_id, industry, company_score: score, industry_average: avgScore, performance })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
}

exports.getCompanyComparison = async (req, res) => {
  try {
    const { company_id } = req.params

    const company = await Company.findById(company_id)
    if (!company) {
      return res.status(404).json({ message: "Company not found" })
    }

    const peers = await SustainabilityScore.getIndustryLatestScores(company.industry)
    if (!peers.length) {
      return res.json({ message: "No benchmark data available" })
    }

    const sortedPeers = peers.sort((a, b) => b.score - a.score)
    const topScore = sortedPeers[0]?.score || 0
    const current = sortedPeers.find((peer) => Number(peer.company_id) === Number(company_id)) || null

    res.json({
      company_id: Number(company_id),
      industry: company.industry,
      top_score: topScore,
      peers: sortedPeers,
      current_company: current,
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
}
