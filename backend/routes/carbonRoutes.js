const express = require("express")
const router = express.Router()

const { getCarbonCredits } = require("../controllers/carbonCreditController")

router.get("/carbon-credit/:company_id",getCarbonCredits)

module.exports = router