exports.calculateSustainabilityScore = (data) => {

  const energy    = data.energy_consumption  || 0
  const fuel      = data.fuel_consumption    || 0
  const transport = data.transport_emissions || 0
  const waste     = data.waste_production    || 0
  const water     = data.water_usage         || 0
  const renewable = data.renewable_energy    || 0

  // Carbon Intensity — lower total direct emissions = better
  const totalDirect = energy + fuel + transport
  const ciScore = Math.max(0, Math.min(100, 100 - (totalDirect / 150)))

  // Renewable Energy — higher % = better
  const reScore = Math.min(100, renewable * 1.5)

  // Waste Management — lower waste = better
  const wmScore = Math.max(0, Math.min(100, 100 - (waste / 40)))

  // Supply Chain Transparency — lower transport = better
  const scScore = Math.max(0, Math.min(100, 100 - (transport / 100)))

  // Water Stewardship — lower usage = better
  const wsScore = Math.max(0, Math.min(100, 100 - (water / 350)))

  // Weighted average
  const score = Math.round(
    ciScore * 0.30 +
    reScore * 0.25 +
    wmScore * 0.20 +
    scScore * 0.15 +
    wsScore * 0.10
  )

  const finalScore = Math.max(0, Math.min(100, score))

  let status = ""
  if (finalScore >= 75)  status = "Sustainable"
  else if (finalScore >= 50) status = "Moderate"
  else status = "Poor"

  return { score: finalScore, status }

}
