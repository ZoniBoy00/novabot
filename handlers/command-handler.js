import { Collection } from "discord.js"
import { readdirSync, watch } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { log } from "../utils/logger.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export class CommandHandler {
  constructor(client) {
    this.client = client
    this.commands = new Collection()
    this.cooldowns = new Collection()
    this.commandCategories = new Collection()
    this.commandsPath = join(__dirname, "..", "commands")
    this.watchers = new Map()
  }

  async loadCommands() {
    // Clear existing collections
    this.commands.clear()
    this.commandCategories.clear()

    const commandFolders = readdirSync(this.commandsPath)

    for (const folder of commandFolders) {
      const folderPath = join(this.commandsPath, folder)
      const commandFiles = readdirSync(folderPath).filter((file) => file.endsWith(".js"))

      for (const file of commandFiles) {
        await this.loadCommand(folder, file)
      }

      // Watch for changes in this folder
      this.watchFolder(folder)
    }

    log(`Loaded ${this.commands.size} commands`, "success")
  }

  async loadCommand(category, file) {
    try {
      const filePath = join(this.commandsPath, category, file)
      const fileUrl = `file://${filePath}?update=${Date.now()}`

      // Clear the module from cache
      delete globalThis[Symbol.for("nodejs.util.inspect.custom")]
      const command = await import(fileUrl)

      if ("data" in command && "execute" in command) {
        const commandName = command.data.name
        // Store the command and its category separately
        this.commands.set(commandName, command)
        this.commandCategories.set(commandName, category)
        log(`Loaded command: ${commandName} (${category})`, "info")
      } else {
        log(`[WARNING] The command at ${filePath} is missing required properties`, "warn")
      }
    } catch (error) {
      log(`Error loading command ${file}: ${error.message}`, "error")
      throw error // Propagate the error
    }
  }

  getCommandCategory(commandName) {
    return this.commandCategories.get(commandName)
  }

  watchFolder(folder) {
    // Remove existing watcher for this folder
    if (this.watchers.has(folder)) {
      this.watchers.get(folder).close()
    }

    const folderPath = join(this.commandsPath, folder)
    const watcher = watch(folderPath, async (eventType, filename) => {
      if (!filename?.endsWith(".js")) return

      if (eventType === "change") {
        log(`Command file changed: ${filename}`, "info")
        await this.loadCommand(folder, filename)
        // Optionally redeploy commands
        await this.deployCommands()
      }
    })

    this.watchers.set(folder, watcher)
  }

  async deployCommands() {
    try {
      const commands = Array.from(this.commands.values()).map((cmd) => cmd.data.toJSON())
      await this.client.application.commands.set(commands)
      log("Slash commands redeployed successfully", "success")
    } catch (error) {
      log(`Error deploying commands: ${error.message}`, "error")
    }
  }

  stopWatching() {
    for (const watcher of this.watchers.values()) {
      watcher.close()
    }
    this.watchers.clear()
  }

  async reload() {
    log("Reloading all commands...", "info")
    await this.loadCommands()
    await this.deployCommands()
    log("Commands reloaded successfully", "success")
  }
}

