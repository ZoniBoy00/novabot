import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

/**
 * Convert a file path to a file:// URL that works in ESM
 * @param {string} filePath - The file path to convert
 * @returns {URL} The file URL
 */
export function pathToFileURL(filePath) {
  // Ensure the path is absolute
  if (!filePath.match(/^[A-Za-z]:\\/)) {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    filePath = join(__dirname, "..", filePath)
  }

  // Convert backslashes to forward slashes
  filePath = filePath.replace(/\\/g, "/")

  // Ensure the path starts with a forward slash
  if (!filePath.startsWith("/")) {
    filePath = "/" + filePath
  }

  return new URL(`file://${filePath}`)
}

/**
 * Get the directory name of the current module
 * @param {string} importMetaUrl - import.meta.url of the calling module
 * @returns {string} The directory path
 */
export function getDirname(importMetaUrl) {
  return dirname(fileURLToPath(importMetaUrl))
}

