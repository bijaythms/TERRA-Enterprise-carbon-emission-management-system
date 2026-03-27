const Company = require("../models/Company")
const {
  hashPassword,
  verifyPassword,
  isHashedPassword,
  normalizeEmail,
  isValidEmail,
  getPasswordValidationMessage,
} = require("../services/authService")

exports.register = async (req, res) => {
  try {
    const { company_name, email, password, industry, location } = req.body
    const normalizedEmail = normalizeEmail(email)
    const passwordError = getPasswordValidationMessage(password)

    if (!company_name || !normalizedEmail || !industry || !location) {
      return res.status(400).json({ message: "All fields are required" })
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address" })
    }

    if (passwordError) {
      return res.status(400).json({ message: passwordError })
    }

    const existing = await Company.findByEmail(normalizedEmail)
    if (existing) {
      return res.status(400).json({ message: "Email already registered" })
    }

    const company = await Company.create({
      company_name,
      email: normalizedEmail,
      password: hashPassword(password),
      industry,
      location,
    })
    const { password: _pwd, ...companyData } = company

    res.json(companyData)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    const normalizedEmail = normalizeEmail(email)

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address" })
    }

    const company = await Company.findByEmail(normalizedEmail)
    if (!company) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const valid = verifyPassword(password, company.password)
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    if (!isHashedPassword(company.password)) {
      await Company.updatePassword(company.company_id, hashPassword(password))
    }

    const { password: _pwd, ...companyData } = company
    res.json({ message: "Login successful", company: companyData })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body
    const normalizedEmail = normalizeEmail(email)
    const passwordError = getPasswordValidationMessage(password)

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and new password are required" })
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address" })
    }

    if (passwordError) {
      return res.status(400).json({ message: passwordError })
    }

    const company = await Company.findByEmail(normalizedEmail)
    if (!company) {
      return res.status(404).json({ message: "Account not found" })
    }

    await Company.updatePassword(company.company_id, hashPassword(password))

    res.json({ message: "Password reset successful" })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
}
