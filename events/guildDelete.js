import { Events } from "discord.js"
import { log } from "../utils/logger.js"

export const name = Events.GuildDelete
export const once = false

export async function execute(guild) {
  log(`Left guild: ${guild.name} (${guild.id})`, "info")

  // Update status immediately to reflect new server count
  if (guild.client.statusManager) {
    guild.client.statusManager.updateStatus()
  }
}

