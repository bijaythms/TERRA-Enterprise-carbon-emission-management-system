const Emission = require("../models/Emission")
const SustainabilityScore = require("../models/SustainabilityScore")
const { calculateSustainabilityScore } = require("../services/scoreService")

exports.getSustainabilityScore = async (req, res) => {
  try {
    const { company_id } = req.params

    const emission = await Emission.findLatestByCompanyId(company_id)

    if (!emission) {
      return res.json({ message: "No emission data found" })
    }

    let savedScore = emission.id ? await SustainabilityScore.findByEmissionId(emission.id) : null
    if (!savedScore) {
      const { score, status } = calculateSustainabilityScore(emission)
      savedScore = await SustainabilityScore.create({
        company_id,
        emission_id: emission.id || null,
        score,
        status,
      })
    }

    res.json({
      company_id,
      sustainability_score: savedScore.score,
      status: savedScore.status,
      submission_status: emission.submission_status,
      review_notes: emission.review_notes || "",
      reviewed_at: emission.reviewed_at,
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
}
