const Emission = require("../models/Emission")
const SustainabilityScore = require("../models/SustainabilityScore")
const { calculateSustainabilityScore } = require("../services/scoreService")

exports.addEmission = async (req, res) => {
  try {
    const {
      company_id,
      energy_consumption,
      fuel_consumption,
      transport_emissions,
      waste_production,
      water_usage,
      renewable_energy,
    } = req.body

    const emission = await Emission.create({
      company_id,
      energy_consumption,
      fuel_consumption,
      transport_emissions,
      waste_production,
      water_usage,
      renewable_energy,
      submission_status: "submitted",
      created_by: company_id,
    })

    const { score, status } = calculateSustainabilityScore(emission)
    const savedScore = await SustainabilityScore.create({
      company_id,
      emission_id: emission.id,
      score,
      status,
    })

    res.json({
      ...emission,
      score_snapshot: {
        score: savedScore.score,
        status: savedScore.status,
      },
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
}
