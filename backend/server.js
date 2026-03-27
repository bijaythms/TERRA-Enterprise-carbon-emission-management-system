const express = require("express")
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const { initDb } = require("./db/db")

const adminRoutes = require("./routes/adminRoutes")
const authRoutes = require("./routes/authRoutes")
const emissionRoutes = require("./routes/emissionRoutes")
const sustainabilityRoutes = require("./routes/sustainabilityRoutes")
const advisorRoutes = require("./routes/advisorRoutes")
const simulatorRoutes = require("./routes/simulatorRoutes")
const carbonRoutes = require("./routes/carbonRoutes")
const dashboardRoutes = require("./routes/dashboardRoutes")
const reportRoutes = require("./routes/reportRoutes")
const benchmarkRoutes = require("./routes/benchmarkRoutes")

async function startServer() {
  await initDb()

  const app = express()
  const port = Number(process.env.PORT || 5000)
  const frontendDirCandidates = [
    path.join(__dirname, "..", "frontend"),
    path.join(__dirname, "frontend"),
  ]
  const frontendDir =
    frontendDirCandidates.find((dir) => fs.existsSync(path.join(dir, "index.html"))) ||
    frontendDirCandidates[0]

  app.use(cors())
  app.use(express.json())

  app.use(express.static(frontendDir))

  app.get("/", (req, res) => {
    res.sendFile(path.join(frontendDir, "index.html"))
  })

  app.get("/health", (req, res) => {
    res.json({ status: "ok" })
  })

  app.use("/", authRoutes)
  app.use("/", emissionRoutes)
  app.use("/", sustainabilityRoutes)
  app.use("/", advisorRoutes)
  app.use("/", simulatorRoutes)
  app.use("/", carbonRoutes)
  app.use("/", dashboardRoutes)
  app.use("/", reportRoutes)
  app.use("/", benchmarkRoutes)
  app.use("/", adminRoutes)

  app.listen(port, () => {
    console.log(`Terra running on http://localhost:${port}`)
  })
}

startServer().catch((err) => {
  console.error("Failed to start Terra backend:", err.message)
  process.exit(1)
})
