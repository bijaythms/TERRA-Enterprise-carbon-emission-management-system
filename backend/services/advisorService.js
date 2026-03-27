const OPENAI_API_URL = "https://api.openai.com/v1/responses"
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini"

function generateRuleBasedAdvice(data) {
  const energy = data.energy_consumption || 0
  const fuel = data.fuel_consumption || 0
  const transport = data.transport_emissions || 0
  const waste = data.waste_production || 0
  const water = data.water_usage || 0
  const renewable = data.renewable_energy || 0

  const advice = []

  if (energy > 5000) {
    advice.push({
      priority: "critical",
      scope: "Scope 1",
      icon: "🔥",
      title: "Critical: High Combustion Emissions Detected",
      description: `Your combustion emissions (${energy.toLocaleString()} t CO2e) are significantly above the industry benchmark of 3,000 t. Switching to low-carbon fuels or upgrading industrial burners to electric alternatives could reduce Scope 1 by up to 40%.`,
      impact: `-${Math.round(energy * 0.4).toLocaleString()} t CO2e`,
      scoreGain: "+12 pts",
      roi: "~18 months",
    })
  } else if (energy > 2000) {
    advice.push({
      priority: "high",
      scope: "Scope 1",
      icon: "🔥",
      title: "Reduce Combustion Emissions",
      description: `Your combustion level (${energy.toLocaleString()} t CO2e) is above average. Consider upgrading to more efficient heating systems or switching to biomass/electric alternatives. Estimated reduction: 25-30%.`,
      impact: `-${Math.round(energy * 0.28).toLocaleString()} t CO2e`,
      scoreGain: "+6 pts",
      roi: "~24 months",
    })
  }

  if (fuel > 2000) {
    advice.push({
      priority: "critical",
      scope: "Scope 1",
      icon: "⛽",
      title: "Critical: Fleet Fuel Consumption Too High",
      description: `Fugitive and fuel emissions of ${fuel.toLocaleString()} t CO2e indicate heavy fossil fuel dependency. A 50% fleet electrification program would cut this category nearly in half and significantly improve your Scope 1 score.`,
      impact: `-${Math.round(fuel * 0.48).toLocaleString()} t CO2e`,
      scoreGain: "+9 pts",
      roi: "~30 months",
    })
  } else if (fuel > 800) {
    advice.push({
      priority: "high",
      scope: "Scope 1",
      icon: "🚗",
      title: "Fleet Electrification Opportunity",
      description: `Fuel consumption of ${fuel.toLocaleString()} t CO2e can be reduced by transitioning delivery and company vehicles to EVs. Starting with 30% of fleet would yield meaningful short-term savings.`,
      impact: `-${Math.round(fuel * 0.3).toLocaleString()} t CO2e`,
      scoreGain: "+4 pts",
      roi: "~20 months",
    })
  }

  if (transport > 4000) {
    advice.push({
      priority: "critical",
      scope: "Scope 1",
      icon: "🚛",
      title: "Critical: Process & Transport Emissions Spike",
      description: `Process emissions of ${transport.toLocaleString()} t CO2e are in the top 20% highest for your sector. Reviewing manufacturing process efficiency, switching to cleaner production methods, and optimising logistics routing are immediate priorities.`,
      impact: `-${Math.round(transport * 0.35).toLocaleString()} t CO2e`,
      scoreGain: "+11 pts",
      roi: "~12 months",
    })
  } else if (transport > 1500) {
    advice.push({
      priority: "medium",
      scope: "Scope 1",
      icon: "🏭",
      title: "Optimise Process Emissions",
      description: `Process emissions (${transport.toLocaleString()} t CO2e) could be reduced by 20-25% through process heat recovery, insulation upgrades, and logistics route optimisation.`,
      impact: `-${Math.round(transport * 0.22).toLocaleString()} t CO2e`,
      scoreGain: "+4 pts",
      roi: "~15 months",
    })
  }

  if (renewable < 30) {
    advice.push({
      priority: "critical",
      scope: "Scope 2",
      icon: "☀️",
      title: `Critical: Only ${renewable}% Renewable - Far Below Benchmark`,
      description: `Your renewable energy mix (${renewable}%) is well below the sector benchmark of 55%. Switching to a renewable energy contract or installing on-site solar could reduce Scope 2 emissions by 60-70% and is the single highest-impact change you can make.`,
      impact: `-${Math.round((waste || 3000) * 0.65).toLocaleString()} t CO2e`,
      scoreGain: "+15 pts",
      roi: "~14 months",
    })
  } else if (renewable < 55) {
    advice.push({
      priority: "high",
      scope: "Scope 2",
      icon: "☀️",
      title: `Increase Renewable Energy from ${renewable}% to 70%+`,
      description: `You're at ${renewable}% renewable energy - good progress but below the 55% sector average. Signing a power purchase agreement or expanding rooftop solar could close this gap within 12 months.`,
      impact: `-${Math.round((55 - renewable) * 40)} t CO2e`,
      scoreGain: "+7 pts",
      roi: "~12 months",
    })
  } else {
    advice.push({
      priority: "low",
      scope: "Scope 2",
      icon: "✅",
      title: `Strong Renewable Mix at ${renewable}% - Push for 90%+`,
      description: `Your renewable energy use (${renewable}%) exceeds sector average. Consider green hydrogen for remaining thermal processes or battery storage to reach near-zero Scope 2 emissions.`,
      impact: "Marginal gains",
      scoreGain: "+3 pts",
      roi: "~36 months",
    })
  }

  if (waste > 1000) {
    advice.push({
      priority: "high",
      scope: "Scope 3",
      icon: "♻️",
      title: `High Waste Output: ${waste.toLocaleString()} tonnes`,
      description: `Waste production of ${waste.toLocaleString()} tonnes is above benchmark. Implementing a zero-landfill policy, supplier waste-exchange programme, and circular packaging can divert 500-700 tonnes annually.`,
      impact: `-${Math.round(waste * 0.35).toLocaleString()} tonnes`,
      scoreGain: "+5 pts",
      roi: "~10 months",
    })
  } else if (waste > 400) {
    advice.push({
      priority: "medium",
      scope: "Scope 3",
      icon: "♻️",
      title: "Implement Circular Waste Strategy",
      description: `Waste of ${waste.toLocaleString()} tonnes can be reduced through better segregation, composting, and supplier take-back schemes. Target 30% reduction in 12 months.`,
      impact: `-${Math.round(waste * 0.3).toLocaleString()} tonnes`,
      scoreGain: "+3 pts",
      roi: "~8 months",
    })
  }

  if (water > 15000) {
    advice.push({
      priority: "high",
      scope: "Scope 3",
      icon: "💧",
      title: `Water Usage Alert: ${water.toLocaleString()} m3`,
      description: `Water consumption of ${water.toLocaleString()} m3 is high for your sector. Installing water recycling systems and real-time leak detection sensors could reduce consumption by 25-35%.`,
      impact: `-${Math.round(water * 0.3).toLocaleString()} m3`,
      scoreGain: "+4 pts",
      roi: "~18 months",
    })
  } else if (water > 8000) {
    advice.push({
      priority: "medium",
      scope: "Scope 3",
      icon: "💧",
      title: "Water Efficiency Programme",
      description: `Your water usage (${water.toLocaleString()} m3) is above average. Simple measures like low-flow fixtures, rainwater harvesting, and process water recycling could cut consumption by 20%.`,
      impact: `-${Math.round(water * 0.2).toLocaleString()} m3`,
      scoreGain: "+2 pts",
      roi: "~6 months",
    })
  }

  if (advice.length === 0) {
    advice.push({
      priority: "low",
      scope: "All Scopes",
      icon: "🏆",
      title: "Excellent Sustainability Performance",
      description: "All your emission metrics are within or below benchmark levels. Focus on maintaining current practices, setting science-based targets, and publishing a TCFD-aligned disclosure report.",
      impact: "Maintain position",
      scoreGain: "+2 pts",
      roi: "Ongoing",
    })
  }

  const order = { critical: 0, high: 1, medium: 2, low: 3 }
  advice.sort((a, b) => order[a.priority] - order[b.priority])

  return advice
}

async function generateLLMAdvice(data) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const prompt = [
    "You are a sustainability advisor for enterprises.",
    "Return concise, practical recommendations based only on the supplied emissions data.",
    "Prioritize the biggest improvements first.",
    "Use natural, business-friendly wording.",
    "Do not invent regulatory claims or unsupported numeric benchmarks.",
    "",
    `energy_consumption: ${data.energy_consumption || 0}`,
    `fuel_consumption: ${data.fuel_consumption || 0}`,
    `transport_emissions: ${data.transport_emissions || 0}`,
    `waste_production: ${data.waste_production || 0}`,
    `water_usage: ${data.water_usage || 0}`,
    `renewable_energy_percent: ${data.renewable_energy || 0}`,
  ].join("\n")

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      reasoning: { effort: "low" },
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text: "Produce 3 to 5 sustainability recommendations as structured JSON. Each item must include priority, scope, icon, title, description, impact, scoreGain, and roi.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "sustainability_advice",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              advice: {
                type: "array",
                minItems: 1,
                maxItems: 5,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                    scope: { type: "string" },
                    icon: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    impact: { type: "string" },
                    scoreGain: { type: "string" },
                    roi: { type: "string" },
                  },
                  required: ["priority", "scope", "icon", "title", "description", "impact", "scoreGain", "roi"],
                },
              },
            },
            required: ["advice"],
          },
        },
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`)
  }

  const result = await response.json()
  const parsed = JSON.parse(result.output_text || "{}")
  return Array.isArray(parsed.advice) ? parsed.advice : null
}

async function generateAIAdvice(data) {
  try {
    const llmAdvice = await generateLLMAdvice(data)
    if (llmAdvice?.length) {
      return {
        advice: llmAdvice,
        source: "llm",
      }
    }
  } catch (err) {
    console.warn("Falling back to rule-based advisor:", err.message)
  }

  return {
    advice: generateRuleBasedAdvice(data),
    source: "rules",
  }
}

module.exports = {
  generateAIAdvice,
  generateRuleBasedAdvice,
}
