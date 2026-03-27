const express = require("express")
const router = express.Router()

const { getBenchmark, getCompanyComparison } = require("../controllers/benchmarkController")

router.get("/benchmark/:company_id",getBenchmark)
router.get("/benchmark/compare/:company_id",getCompanyComparison)

module.exports = router
