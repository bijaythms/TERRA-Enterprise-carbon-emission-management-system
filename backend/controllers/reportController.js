const fs = require("fs")
const path = require("path")
const Company = require("../models/Company")
const Emission = require("../models/Emission")
const SustainabilityScore = require("../models/SustainabilityScore")
const { generateRuleBasedAdvice } = require("../services/advisorService")
const PDFDocument = require("pdfkit")
const { ChartJSNodeCanvas } = require("chartjs-node-canvas")

const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width: 1100,
  height: 500,
  backgroundColour: "#ffffff",
})

const COLORS = {
  ink: "#0f172a",
  text: "#334155",
  muted: "#94a3b8",
  border: "#dbe4ee",
  panel: "#f8fafc",
  green: "#166534",
  greenSoft: "#dcfce7",
  amber: "#92400e",
  amberSoft: "#fef3c7",
  blue: "#1d4ed8",
  blueSoft: "#dbeafe",
  red: "#b91c1c",
  redSoft: "#fee2e2",
}

function formatNumber(value, suffix = "") {
  return `${Math.round(Number(value || 0)).toLocaleString()}${suffix}`
}

function safeFilename(name = "terra") {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "terra"
}

function titleCase(value = "") {
  return String(value)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getScoreBand(score) {
  if (score >= 85) return { label: "Excellent", color: COLORS.green, soft: COLORS.greenSoft }
  if (score >= 70) return { label: "Strong", color: COLORS.blue, soft: COLORS.blueSoft }
  if (score >= 50) return { label: "Moderate", color: COLORS.amber, soft: COLORS.amberSoft }
  return { label: "Needs Improvement", color: COLORS.red, soft: COLORS.redSoft }
}

function getPriorityTheme(priority = "medium") {
  const map = {
    critical: { label: "Critical", color: COLORS.red, soft: COLORS.redSoft },
    high: { label: "High Impact", color: COLORS.amber, soft: COLORS.amberSoft },
    medium: { label: "Medium Impact", color: COLORS.blue, soft: COLORS.blueSoft },
    low: { label: "Priority Action", color: COLORS.green, soft: COLORS.greenSoft },
  }

  return map[priority] || map.medium
}

function loadTerraLogo() {
  try {
    const logoPath = path.join(__dirname, "..", "assets", "logo.jpeg")
    return fs.readFileSync(logoPath)
  } catch (err) {
    return null
  }
}

function totalFootprint(emission) {
  return Number(emission.energy_consumption || 0) +
    Number(emission.fuel_consumption || 0) +
    Number(emission.transport_emissions || 0) +
    Number(emission.waste_production || 0) +
    Number(emission.water_usage || 0)
}

function drawFooter(doc, pageNumber) {
  const footerY = doc.page.height - 34
  doc.save()
  doc.moveTo(42, footerY - 8).lineTo(doc.page.width - 42, footerY - 8).strokeColor(COLORS.border).lineWidth(1).stroke()
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9)
  doc.text("Terra Sustainability Platform", 42, footerY, { width: 220 })
  doc.text(`Page ${pageNumber}`, doc.page.width - 90, footerY, { width: 44, align: "right" })
  doc.restore()
}

function drawPageHeader(doc, title, companyName, logoBuffer) {
  doc.save()
  doc.roundedRect(42, 26, doc.page.width - 84, 46, 12).fill(COLORS.panel)
  if (logoBuffer) {
    doc.image(logoBuffer, 54, 35, { fit: [22, 22] })
  } else {
    doc.circle(66, 46, 11).fill(COLORS.green)
  }
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(14).text(title, 88, 36)
  doc.fillColor(COLORS.text).font("Helvetica").fontSize(9.5).text(companyName, 88, 54)
  doc.restore()
}

function drawSectionTitle(doc, y, title, subtitle = "") {
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(17).text(title, 42, y)
  if (subtitle) {
    doc.fillColor(COLORS.text).font("Helvetica").fontSize(10.5).text(subtitle, 42, y + 22, {
      width: doc.page.width - 84,
    })
  }
}

function drawStatCard(doc, x, y, width, label, value, detail, theme) {
  doc.save()
  doc.roundedRect(x, y, width, 88, 14).fillAndStroke("#ffffff", COLORS.border)
  doc.roundedRect(x + 14, y + 14, width - 28, 6, 4).fill(theme.soft)
  doc.fillColor(COLORS.muted).font("Helvetica-Bold").fontSize(9).text(label.toUpperCase(), x + 16, y + 28, { width: width - 32 })
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(21).text(value, x + 16, y + 44, { width: width - 32 })
  doc.fillColor(theme.color).font("Helvetica").fontSize(9.5).text(detail, x + 16, y + 68, { width: width - 32 })
  doc.restore()
}

function drawLabeledRows(doc, x, y, rows) {
  let currentY = y
  rows.forEach((row, index) => {
    const bg = index % 2 === 0 ? "#ffffff" : COLORS.panel
    doc.save()
    doc.roundedRect(x, currentY, 250, 28, 8).fill(bg)
    doc.fillColor(COLORS.text).font("Helvetica-Bold").fontSize(9.5).text(row[0], x + 12, currentY + 9, { width: 100 })
    doc.fillColor(COLORS.ink).font("Helvetica").fontSize(10).text(row[1], x + 118, currentY + 9, { width: 120 })
    doc.restore()
    currentY += 31
  })
}

async function renderEmissionsChart(emission) {
  return chartJSNodeCanvas.renderToBuffer({
    type: "bar",
    data: {
      labels: ["Energy", "Fuel", "Transport", "Waste", "Water"],
      datasets: [
        {
          data: [
            Number(emission.energy_consumption || 0),
            Number(emission.fuel_consumption || 0),
            Number(emission.transport_emissions || 0),
            Number(emission.waste_production || 0),
            Number(emission.water_usage || 0),
          ],
          backgroundColor: ["#166534", "#1d4ed8", "#92400e", "#b91c1c", "#0f766e"],
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { color: COLORS.text, font: { size: 11 } },
          grid: { display: false },
        },
        y: {
          ticks: { color: COLORS.text, font: { size: 10 } },
          grid: { color: "#e2e8f0" },
        },
      },
    },
  })
}

async function renderRenewableChart(renewable) {
  const clean = Math.max(0, Math.min(100, Number(renewable || 0)))
  const nonClean = Math.max(0, 100 - clean)

  return chartJSNodeCanvas.renderToBuffer({
    type: "doughnut",
    data: {
      labels: ["Renewable", "Non-Renewable"],
      datasets: [
        {
          data: [clean, nonClean],
          backgroundColor: [COLORS.green, "#e2e8f0"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: false,
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: COLORS.text,
            boxWidth: 12,
            font: { size: 11 },
          },
        },
      },
    },
  })
}

function drawRecommendationCard(doc, x, y, width, item) {
  const theme = getPriorityTheme(item.priority)
  doc.save()
  doc.roundedRect(x, y, width, 110, 14).fillAndStroke("#ffffff", COLORS.border)
  doc.roundedRect(x + 14, y + 14, 96, 24, 12).fill(theme.soft)
  doc.fillColor(theme.color).font("Helvetica-Bold").fontSize(10).text(theme.label, x + 24, y + 21, { width: 76, align: "center" })
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(12.5).text(item.title || "Recommendation", x + 124, y + 16, {
    width: width - 140,
  })
  doc.fillColor(COLORS.text).font("Helvetica").fontSize(9.8).text(item.description || "", x + 124, y + 36, {
    width: width - 140,
    height: 42,
    ellipsis: true,
  })
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(9.2)
  doc.text(`Scope: ${item.scope || "Operational"}`, x + 124, y + 82, { width: 105 })
  doc.text(`Impact: ${item.impact || "TBD"}`, x + 236, y + 82, { width: 135 })
  doc.text(`ROI: ${item.roi || "N/A"}`, x + width - 108, y + 82, { width: 88, align: "right" })
  doc.restore()
}

exports.generateReport = async (req, res) => {
  try {
    const { company_id } = req.params

    const company = await Company.findById(company_id)
    if (!company) {
      return res.status(404).send("Company not found")
    }

    const emission = await Emission.findLatestByCompanyId(company_id)
    const score = await SustainabilityScore.findLatestByCompanyId(company_id)

    if (!emission || !score) {
      return res.status(400).send("A report can be generated only after emissions and sustainability score are available")
    }

    const footprint = totalFootprint(emission)
    const avgScore = await SustainabilityScore.getIndustryAverage(company.industry)
    const peers = await SustainabilityScore.getIndustryLatestScores(company.industry)
    const topScore = peers.reduce((max, peer) => Math.max(max, Number(peer.score || 0)), score.score)
    const scoreBand = getScoreBand(score.score)
    const progress2030 = Math.min(100, Math.round((Number(emission.renewable_energy || 0) / 67) * 100))
    const recommendations = generateRuleBasedAdvice(emission).slice(0, 3)
    const emissionsChart = await renderEmissionsChart(emission)
    const renewableChart = await renderRenewableChart(emission.renewable_energy)
    const logoBuffer = loadTerraLogo()
    const reportDate = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
    const reviewStatus = titleCase(emission.submission_status || "submitted")
    const reviewNotes = emission.review_notes || "No review notes were recorded for the latest submission."

    const doc = new PDFDocument({
      size: "A4",
      margin: 42,
      bufferPages: true,
      info: {
        Title: `${company.company_name} Sustainability Report`,
        Author: "Terra Sustainability Platform",
        Subject: "Enterprise Sustainability Report",
      },
    })

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `inline; filename=${safeFilename(company.company_name)}_sustainability_report.pdf`)
    doc.pipe(res)

    // Page 1
    doc.rect(0, 0, doc.page.width, 210).fill("#f0fdf4")
    doc.rect(0, 210, doc.page.width, 8).fill(COLORS.green)
    if (logoBuffer) {
      doc.image(logoBuffer, 42, 48, { fit: [56, 56] })
    } else {
      doc.circle(70, 76, 28).fill(COLORS.green)
    }
    doc.fillColor(COLORS.green).font("Helvetica-Bold").fontSize(18).text("TERRA", 124, 58)
    doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(29).text("Enterprise Sustainability Report", 42, 142, {
      width: 510,
    })
    doc.fillColor(COLORS.text).font("Helvetica").fontSize(12).text(
      "A professional sustainability summary covering profile, score, benchmark position, operational emissions, and recommended actions.",
      42,
      181,
      { width: 510 }
    )

    drawStatCard(doc, 42, 270, 242, "Prepared For", company.company_name, `${company.industry || "Industry not set"} · ${company.location || "Location not set"}`, { color: COLORS.green, soft: COLORS.greenSoft })
    drawStatCard(doc, 310, 270, 242, "Reporting Snapshot", `${score.score}/100`, `${score.status || scoreBand.label} · ${formatNumber(footprint)} t CO2e`, scoreBand)
    drawStatCard(doc, 42, 382, 160, "Industry Average", `${avgScore}/100`, "Peer benchmark", { color: COLORS.blue, soft: COLORS.blueSoft })
    drawStatCard(doc, 217, 382, 160, "Top Performer", `${topScore}/100`, "Best peer score", { color: COLORS.amber, soft: COLORS.amberSoft })
    drawStatCard(doc, 392, 382, 160, "2030 Progress", `${progress2030}%`, "Toward 67% renewable target", { color: COLORS.green, soft: COLORS.greenSoft })

    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(10)
    doc.text(`Issued on ${reportDate}`, 42, 505)
    doc.text("Powered by Terra Sustainability Platform", 42, 523)

    // Page 2
    doc.addPage()
    drawPageHeader(doc, "Executive Summary", company.company_name, logoBuffer)
    drawSectionTitle(doc, 92, "Company Profile", "Core company information and latest submission quality summary.")
    drawLabeledRows(doc, 42, 140, [
      ["Company", company.company_name],
      ["Industry", company.industry || "Not provided"],
      ["Location", company.location || "Not provided"],
      ["Reporting Period", "FY 2025-26"],
      ["Submission Status", reviewStatus],
      ["Report Date", reportDate],
    ])

    doc.roundedRect(320, 140, 232, 194, 14).fillAndStroke("#ffffff", COLORS.border)
    doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(14).text("Latest Review Notes", 338, 158)
    doc.fillColor(COLORS.text).font("Helvetica").fontSize(10.4).text(reviewNotes, 338, 184, {
      width: 196,
      height: 120,
      ellipsis: true,
    })

    drawSectionTitle(doc, 360, "Performance Snapshot", "Current sustainability position compared with the sector benchmark.")
    drawStatCard(doc, 42, 408, 160, "Sustainability Score", `${score.score}/100`, score.status || scoreBand.label, scoreBand)
    drawStatCard(doc, 217, 408, 160, "Industry Average", `${avgScore}/100`, score.score >= avgScore ? "Above sector average" : "Below sector average", { color: COLORS.blue, soft: COLORS.blueSoft })
    drawStatCard(doc, 392, 408, 160, "Renewable Share", `${formatNumber(emission.renewable_energy, "%")}`, "Current clean energy mix", { color: COLORS.green, soft: COLORS.greenSoft })

    // Page 3
    doc.addPage()
    drawPageHeader(doc, "Emissions Overview", company.company_name, logoBuffer)
    drawSectionTitle(doc, 92, "Operational Footprint", "Latest submitted activity values across key operational categories.")
    doc.image(emissionsChart, 42, 138, { fit: [510, 232] })

    drawLabeledRows(doc, 42, 392, [
      ["Energy", `${formatNumber(emission.energy_consumption)} t CO2e`],
      ["Fuel", `${formatNumber(emission.fuel_consumption)} t CO2e`],
      ["Transport", `${formatNumber(emission.transport_emissions)} t CO2e`],
      ["Waste", `${formatNumber(emission.waste_production)} t`],
      ["Water", `${formatNumber(emission.water_usage)} m3`],
      ["Total Footprint", `${formatNumber(footprint)} t CO2e`],
    ])

    doc.roundedRect(320, 392, 232, 186, 14).fillAndStroke("#ffffff", COLORS.border)
    doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(14).text("Renewable Energy Mix", 338, 410)
    doc.image(renewableChart, 338, 440, { fit: [196, 118] })

    // Page 4
    doc.addPage()
    drawPageHeader(doc, "Priority Recommendations", company.company_name, logoBuffer)
    drawSectionTitle(doc, 92, "Recommended Actions", "Top three actions selected from the current rule-based sustainability advisor.")
    drawRecommendationCard(doc, 42, 138, 510, recommendations[0] || {
      priority: "medium",
      title: "Maintain Current Practices",
      description: "Continue tracking emissions consistently and improve operational evidence quality for each reporting cycle.",
      scope: "All",
      impact: "Maintain baseline",
      roi: "Ongoing",
    })
    drawRecommendationCard(doc, 42, 260, 510, recommendations[1] || {
      priority: "low",
      title: "Increase Operational Visibility",
      description: "Improve internal tracking for energy, transport, and waste to support better reporting confidence and faster reviews.",
      scope: "Operational",
      impact: "Data quality uplift",
      roi: "Short term",
    })
    drawRecommendationCard(doc, 42, 382, 510, recommendations[2] || {
      priority: "low",
      title: "Build Reporting Readiness",
      description: "Strengthen internal governance and maintain a repeatable submission process for future sustainability cycles.",
      scope: "Governance",
      impact: "Process improvement",
      roi: "Ongoing",
    })

    doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(15).text("Management Commentary", 42, 518)
    doc.fillColor(COLORS.text).font("Helvetica").fontSize(10.5).text(
      `${company.company_name} reported a latest total footprint of ${formatNumber(footprint)} t CO2e with a sustainability score of ${score.score}/100. ` +
        `The organisation currently stands ${score.score >= avgScore ? "above" : "below"} its industry average of ${avgScore}/100, with renewable energy at ${formatNumber(emission.renewable_energy, "%")} and a latest submission status of ${reviewStatus}. ` +
        `Management should prioritise the listed operational actions and continue strengthening reporting quality for subsequent review cycles.`,
      42,
      544,
      { width: 510, height: 70, ellipsis: true }
    )

    const pageRange = doc.bufferedPageRange()
    for (let i = 0; i < pageRange.count; i += 1) {
      doc.switchToPage(i)
      drawFooter(doc, i + 1)
    }

    doc.end()
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
}
