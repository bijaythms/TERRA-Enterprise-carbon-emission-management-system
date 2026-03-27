const express = require("express")
const router = express.Router()

const { simulateReduction } = require("../controllers/simulatorController")

router.post("/simulate-reduction",simulateReduction)

module.exports = router