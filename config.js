import { log } from "./utils/logger.js"

// Validate required environment variables
const requiredEnvVars = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  CLIENT_ID: process.env.CLIENT_ID,
  OWNER_ID: process.env.OWNER_ID,
}

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingVars.length > 0) {
  log(`Missing required environment variables: ${missingVars.join(", ")}`, "error")
  process.exit(1)
}

const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  ownerId: process.env.OWNER_ID,
  embedColor: "#5865F2",
  logChannelName: "mod-logs",
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID || null,
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || null,
  logWebhookUrl: process.env.LOG_WEBHOOK_URL || null,
}

// Validate owner ID format
if (!/^\d+$/.test(config.ownerId)) {
  log("OWNER_ID must be a valid Discord user ID (numbers only)", "error")
  process.exit(1)
}

export default config

