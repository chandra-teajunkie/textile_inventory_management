// Safe JSON parsing helper
export function parseJsonSafe(input, fallback = {}) {
  if (input === null || input === undefined) return fallback
  if (typeof input === "object") return input
  try {
    return JSON.parse(input)
  } catch (e) {
    // Gracefully return fallback when parse fails
    console.warn("parseJsonSafe: failed to parse JSON", e)
    return fallback
  }
}
