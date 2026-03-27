const express = require("express")
const router = express.Router()

const {addEmission} = require("../controllers/emissionsController")

router.post("/emissions",addEmission)

module.exports = router