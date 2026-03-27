const express = require("express")
const router = express.Router()

const {
  getAllCompanies,
  getAdminStats,
  getReviewQueue,
  reviewEmission,
} = require("../controllers/adminController")

router.get("/admin/stats", getAdminStats)
router.get("/admin/companies", getAllCompanies)
router.get("/admin/review-queue", getReviewQueue)
router.post("/admin/emissions/:emission_id/review", reviewEmission)

module.exports = router
