import { Events } from "discord.js"
import { log } from "../utils/logger.js"

export const name = Events.GuildCreate
export const once = false

export async function execute(guild) {
  try {
    log(`Joined new guild: ${guild.name} (${guild.id})`, "info")

    // Set up log channels
    await guild.client.logManager.setupLogChannels(guild)

    // Update status
    guild.client.statusManager.updateStatus()

    // Send welcome message using WelcomeManager's methods
    const systemChannel =
      guild.systemChannel ||
      guild.channels.cache.find(
        (channel) => channel.name.includes("general") && channel.permissionsFor(guild.members.me).has("SendMessages"),
      )

    if (systemChannel) {
      await guild.client.welcomeManager.sendWelcomeMessage(systemChannel)
    }

    // Log the join
    await guild.client.logManager.log(guild, "server", {
      action: "Bot Joined",
      changes: [`Added to ${guild.name} (${guild.id})`],
    })
  } catch (error) {
    log(`Error in guildCreate event: ${error}`, "error")
  }
}

