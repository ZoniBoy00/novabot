/**
 * Logs a message to the console
 * @param {string} message - The message to log
 * @param {'info'|'warn'|'error'|'success'} [level='info'] - The log level
 */
export function log(message, level = "info") {
  const timestamp = new Date().toISOString()

  // Console logging
  switch (level) {
    case "warn":
      console.warn(`[${timestamp}] [WARN] ${message}`)
      break
    case "error":
      console.error(`[${timestamp}] [ERROR] ${message}`)
      break
    case "success":
      console.log(`[${timestamp}] [SUCCESS] ${message}`)
      break
    default:
      console.log(`[${timestamp}] [INFO] ${message}`)
  }
}

