import { Client, GatewayIntentBits } from "discord.js"
import { CommandHandler } from "./handlers/command-handler.js"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { readdirSync } from "node:fs"
import "dotenv/config"
import config from "./config.js"
import { initWebhook } from "./utils/webhookLogger.js"
import { db } from "./utils/database.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
})

// Initialize webhook logger
initWebhook()

// Initialize database connection
await db.connect()

// Initialize command handler
client.handler = new CommandHandler(client)

// Load events
const eventsPath = join(__dirname, "events")
const eventFiles = readdirSync(eventsPath).filter((file) => file.endsWith(".js"))

for (const file of eventFiles) {
  const filePath = join(eventsPath, file)
  const event = await import(`file://${filePath}`)

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client))
  } else {
    client.on(event.name, (...args) => event.execute(...args, client))
  }
}

// Load commands
await client.handler.loadCommands()

// Login to Discord
client.login(config.token)

// Handle process termination
process.on("SIGINT", async () => {
  client.handler.stopWatching()
  await db.cleanup()
  client.destroy()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  client.handler.stopWatching()
  await db.cleanup()
  client.destroy()
  process.exit(0)
})

