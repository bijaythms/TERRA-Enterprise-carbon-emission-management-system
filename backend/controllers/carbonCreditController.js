const Emission = require("../models/Emission")

exports.getCarbonCredits = async (req, res) => {
  try {
    const { company_id } = req.params

    const emission = await Emission.findLatestByCompanyId(company_id)

    if (!emission) {
      return res.json({ message: "No emission data available" })
    }

    const totalEmission =
      emission.energy_consumption +
      emission.fuel_consumption +
      emission.transport_emissions +
      emission.waste_production

    const carbonCredits = Math.round(totalEmission / 100)

    res.json({ company_id, total_emission: totalEmission, estimated_carbon_credits: carbonCredits })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
}
