const express = require("express")
const router = express.Router()

const { getAIAdvice } = require("../controllers/advisorController")

router.get("/ai-advisor/:company_id",getAIAdvice)

module.exports = router