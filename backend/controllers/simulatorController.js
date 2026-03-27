const Emission = require("../models/Emission")
const { calculateSustainabilityScore } = require("../services/scoreService")

exports.simulateReduction = async (req, res) => {
  try {
    const { company_id, fuel_reduction, renewable_increase } = req.body

    const emission = await Emission.findLatestByCompanyId(company_id)

    if (!emission) {
      return res.json({ message: "No emission data available" })
    }

    const simulated = {
      ...emission,
      fuel_consumption: emission.fuel_consumption * (1 - (fuel_reduction || 0) / 100),
      energy_consumption: emission.energy_consumption * (1 - (fuel_reduction || 0) / 100 * 0.5),
      transport_emissions: emission.transport_emissions * (1 - (fuel_reduction || 0) / 100 * 0.3),
      renewable_energy: Math.min(100, (emission.renewable_energy || 0) + (renewable_increase || 0)),
    }

    const { score: currentScore } = calculateSustainabilityScore(emission)
    const { score: predictedScore } = calculateSustainabilityScore(simulated)

    res.json({
      company_id,
      current_fuel: Math.round(emission.fuel_consumption),
      simulated_fuel: Math.round(simulated.fuel_consumption),
      current_renewable: emission.renewable_energy,
      simulated_renewable: Math.round(simulated.renewable_energy),
      current_score: currentScore,
      predicted_score: predictedScore,
      score_gain: predictedScore - currentScore,
      co2_reduction: Math.round(
        (emission.fuel_consumption - simulated.fuel_consumption) +
        (emission.energy_consumption - simulated.energy_consumption) +
        (emission.transport_emissions - simulated.transport_emissions)
      ),
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
}
