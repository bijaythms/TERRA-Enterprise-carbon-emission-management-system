/**
 * Terra - PostgreSQL seed script
 * Run once: node seed.js
 * Populates companies, emissions, and sustainability_scores tables.
 */

const { initDb, query, closeDb } = require("./db/db")
const Company = require("./models/Company")
const Emission = require("./models/Emission")
const SustainabilityScore = require("./models/SustainabilityScore")

async function seed() {
  try {
    await initDb()

    await query(`
      TRUNCATE TABLE sustainability_scores, emissions, companies
      RESTART IDENTITY CASCADE
    `)
    console.log("Cleared existing PostgreSQL tables")

    const admin = await Company.create({
      company_name: "Terra Platform",
      email: "admin@terra.io",
      password: "admin123",
      industry: "Platform",
      location: "Global",
      role: "admin",
    })

    const [acme, greentech, vertex, meridian] = await Company.createMany([
      {
        company_name: "Acme Corp Ltd.",
        email: "anika@acmecorp.com",
        password: "company123",
        industry: "Manufacturing",
        location: "Mumbai, India",
        role: "company",
      },
      {
        company_name: "GreenTech PLC",
        email: "m.klein@greentech.io",
        password: "company123",
        industry: "Technology",
        location: "Bangalore, India",
        role: "company",
      },
      {
        company_name: "Vertex Industries",
        email: "vertex@vertex.com",
        password: "company123",
        industry: "Energy",
        location: "Delhi, India",
        role: "company",
      },
      {
        company_name: "Meridian Co.",
        email: "meridian@meridian.com",
        password: "company123",
        industry: "Retail",
        location: "Chennai, India",
        role: "company",
      },
    ])

    console.log("Companies seeded:", [admin, acme, greentech, vertex, meridian].map((c) => c.email))

    await Emission.createMany([
      {
        company_id: acme.company_id,
        energy_consumption: 3240,
        fuel_consumption: 1890,
        transport_emissions: 2110,
        waste_production: 800,
        water_usage: 14200,
        renewable_energy: 34,
      },
      {
        company_id: greentech.company_id,
        energy_consumption: 1200,
        fuel_consumption: 400,
        transport_emissions: 300,
        waste_production: 200,
        water_usage: 5000,
        renewable_energy: 72,
      },
      {
        company_id: vertex.company_id,
        energy_consumption: 5800,
        fuel_consumption: 2100,
        transport_emissions: 1900,
        waste_production: 1200,
        water_usage: 22000,
        renewable_energy: 41,
      },
      {
        company_id: meridian.company_id,
        energy_consumption: 2100,
        fuel_consumption: 950,
        transport_emissions: 780,
        waste_production: 500,
        water_usage: 9800,
        renewable_energy: 55,
      },
    ])

    console.log("Emissions seeded")

    await SustainabilityScore.createMany([
      { company_id: acme.company_id, score: 78, status: "Sustainable" },
      { company_id: greentech.company_id, score: 91, status: "Sustainable" },
      { company_id: vertex.company_id, score: 62, status: "Moderate" },
      { company_id: meridian.company_id, score: 74, status: "Sustainable" },
    ])

    console.log("Sustainability scores seeded")
    console.log("\nTerra PostgreSQL database seeded successfully")
  } catch (err) {
    console.error("Seeding failed:", err.message)
  } finally {
    await closeDb()
    console.log("Disconnected from PostgreSQL")
  }
}

seed()
