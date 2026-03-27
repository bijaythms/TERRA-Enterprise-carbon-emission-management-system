const express = require("express")
const router = express.Router()

const { getSustainabilityScore } = require("../controllers/sustainabilityController")

router.get("/sustainability-score/:company_id",getSustainabilityScore)

module.exports = router