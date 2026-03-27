const crypto = require("crypto")

const HASH_PREFIX = "scrypt$"
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex")
  const derived = crypto.scryptSync(password, salt, 64).toString("hex")
  return `${HASH_PREFIX}${salt}$${derived}`
}

function isHashedPassword(value = "") {
  return typeof value === "string" && value.startsWith(HASH_PREFIX)
}

function verifyPassword(password, storedValue = "") {
  if (!storedValue) return false
  if (!isHashedPassword(storedValue)) {
    return password === storedValue
  }

  const [, salt, storedHash] = storedValue.split("$")
  const derived = crypto.scryptSync(password, salt, 64)
  const storedBuffer = Buffer.from(storedHash, "hex")
  return storedBuffer.length === derived.length && crypto.timingSafeEqual(storedBuffer, derived)
}

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase()
}

function isValidEmail(email = "") {
  return EMAIL_REGEX.test(normalizeEmail(email))
}

function getPasswordValidationMessage(password = "") {
  if (String(password).length < 8) {
    return "Password must be at least 8 characters"
  }

  if (!PASSWORD_REGEX.test(String(password))) {
    return "Password must include uppercase, lowercase, number, and special character"
  }

  return ""
}

module.exports = {
  hashPassword,
  verifyPassword,
  isHashedPassword,
  normalizeEmail,
  isValidEmail,
  getPasswordValidationMessage,
}
