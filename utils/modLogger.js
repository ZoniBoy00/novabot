import { EmbedBuilder, ChannelType } from "discord.js"
import config from "../config.js"
import { log } from "./logger.js"
import { logToWebhook } from "./webhookLogger.js"

export async function logModAction(guild, action) {
  try {
    // Find or create the logging channel
    let logChannel = guild.channels.cache.find(
      (channel) => channel.name === config.logChannelName && channel.type === ChannelType.GuildText,
    )

    if (!logChannel) {
      // Try to create the channel if it doesn't exist
      try {
        logChannel = await guild.channels.create({
          name: config.logChannelName,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: ["ViewChannel"],
            },
            {
              id: guild.roles.cache.find((role) => role.name === "Moderator")?.id || guild.id,
              allow: ["ViewChannel"],
            },
          ],
          reason: "Created for logging moderation actions",
        })
      } catch (error) {
        log("Failed to create log channel: " + error.message, "error")
        return
      }
    }

    // Create the log embed
    const logEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(`${action.type} | Case ${generateCaseId()}`)
      .addFields(
        { name: "User", value: `${action.user.tag} (${action.user.id})` },
        { name: "Moderator", value: `${action.moderator.tag} (${action.moderator.id})` },
        { name: "Reason", value: action.reason },
      )
      .setTimestamp()

    // Add duration field for timeouts
    if (action.duration) {
      logEmbed.addFields({ name: "Duration", value: action.duration })
    }

    await logChannel.send({ embeds: [logEmbed] })

    // Also log to webhook if configured
    await logToWebhook(`[${action.type}] ${action.user.tag} by ${action.moderator.tag}: ${action.reason}`, "info")
  } catch (error) {
    log("Error logging moderation action: " + error.message, "error")
  }
}

// Generate a random case ID
function generateCaseId() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

