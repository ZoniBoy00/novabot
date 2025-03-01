import { Events } from "discord.js"
import { MusicPlayer } from "../utils/musicPlayer.js"
import { StatusManager } from "../utils/statusManager.js"
import { log } from "../utils/logger.js"

export const name = Events.ClientReady
export const once = true

export async function execute(client) {
  log(`Ready! Logged in as ${client.user.tag}`, "success")

  // Initialize music player
  client.musicPlayer = new MusicPlayer(client)

  // Initialize and start status rotation
  client.statusManager = new StatusManager(client)
  client.statusManager.startRotation(30000) // Rotate every 30 seconds

  // Deploy commands
  await client.handler.deployCommands()

  // Log initial stats
  const serverCount = client.guilds.cache.size
  const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
  const commandCount = client.handler.commands.size

  log(`Bot is active in ${serverCount} servers with a total of ${totalMembers} members`, "info")
  log(`Successfully loaded ${commandCount} slash commands`, "info")

  // Handle reconnection
  if (client.shard) {
    log(`Shard ${client.shard.ids[0]} reconnected`, "info")
  }
}

