import { Client, GatewayIntentBits, Partials } from "discord.js"
import { CommandHandler } from "./handlers/command-handler.js"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { readdirSync } from "node:fs"
import "dotenv/config"
import config from "./config.js"
import { initWebhook } from "./utils/webhookLogger.js"
import { db } from "./utils/database.js"
import { LogManager } from "./utils/logManager.js"
import { WelcomeManager } from "./utils/welcomeManager.js"
import { AutomodManager } from "./utils/automodManager.js"
import { ReactionRolesManager } from "./utils/reactionRolesManager.js"
import { TicketManager } from "./utils/ticketManager.js"
import { StatusManager } from "./utils/statusManager.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Create a new client instance with all necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember],
})

// Initialize managers
async function initializeManagers() {
  try {
    // Initialize webhook logger
    initWebhook()

    // Initialize database connection
    await db.connect()

    // Initialize command handler
    client.handler = new CommandHandler(client)

    // Initialize all managers
    client.logManager = new LogManager(client)

    // Initialize log channels
    await client.logManager.initializeLogChannels()

    client.welcomeManager = new WelcomeManager(client)
    client.automodManager = new AutomodManager(client)
    client.reactionRolesManager = new ReactionRolesManager(client)
    client.ticketManager = new TicketManager(client)
    client.statusManager = new StatusManager(client)

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

    return true
  } catch (error) {
    console.error("Error initializing managers:", error)
    return false
  }
}

// Initialize everything and login
async function startBot() {
  try {
    const initialized = await initializeManagers()
    if (!initialized) {
      throw new Error("Failed to initialize managers")
    }

    await client.login(config.token)
  } catch (error) {
    console.error("Failed to start bot:", error)
    process.exit(1)
  }
}

startBot()

// Handle process termination
async function shutdown() {
  console.log("Shutting down...")

  // Stop all managers
  client.handler.stopWatching()
  client.statusManager.stopRotation()

  // Close database connection
  await db.cleanup()

  // Destroy client
  client.destroy()

  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
  shutdown()
})
process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error)
  shutdown()
})

