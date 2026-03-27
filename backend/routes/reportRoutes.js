const express = require("express")
const router = express.Router()

const { generateReport } = require("../controllers/reportController")

router.get("/report/:company_id",generateReport)

module.exports = router