const Emission = require("../models/Emission")
const { generateAIAdvice } = require("../services/advisorService")

exports.getAIAdvice = async (req, res) => {
  try {
    const { company_id } = req.params

    const emission = await Emission.findLatestByCompanyId(company_id)

    if (!emission) {
      return res.json({ message: "No emission data available" })
    }

    const result = await generateAIAdvice(emission)

    res.json({
      company_id,
      ai_advice: result.advice,
      advisor_source: result.source,
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
}
