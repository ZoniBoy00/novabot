import { Events, EmbedBuilder } from "discord.js"
import config from "../config.js"
import { log } from "../utils/logger.js"

export const name = Events.GuildCreate
export const once = false

export async function execute(guild) {
  log(`Joined new guild: ${guild.name} (${guild.id})`, "info")

  // Update status immediately to reflect new server count
  if (guild.client.statusManager) {
    guild.client.statusManager.updateStatus()
  }

  // Find a suitable channel to send the welcome message
  const systemChannel = guild.systemChannel
  const generalChannel = guild.channels.cache.find(
    (channel) =>
      channel.name.includes("general") &&
      channel.type === 0 &&
      channel.permissionsFor(guild.members.me).has("SendMessages"),
  )

  const targetChannel =
    systemChannel ||
    generalChannel ||
    guild.channels.cache.find(
      (channel) => channel.type === 0 && channel.permissionsFor(guild.members.me).has("SendMessages"),
    )

  if (!targetChannel) return

  const welcomeEmbed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle("Thanks for adding NovaBot! 🎉")
    .setDescription("NovaBot uses slash commands! Simply type `/` to see all available commands.")
    .addFields(
      {
        name: "🚀 Getting Started",
        value: "Type `/help` to see a list of all commands organized by category.",
      },
      {
        name: "🛡️ Moderation",
        value: "Use `/ban`, `/kick`, `/mute`, or `/warn` to moderate your server.",
      },
      {
        name: "🎵 Music",
        value: "Start playing music with `/play` and manage it with `/queue`, `/skip`, `/pause`, and `/stop`.",
      },
      {
        name: "💰 Economy System",
        value:
          "Earn money with `/daily` and `/work`, start businesses with `/shop`, and play games like `/blackjack` and `/slots`!",
      },
      {
        name: "⭐ Level System",
        value: "Chat to earn XP, level up, and compete on the `/leaderboard`. Check your progress with `/rank`.",
      },
      {
        name: "💹 Cryptocurrency",
        value: "Check real-time crypto prices with `/crypto`.",
      },
      {
        name: "🔧 Utility",
        value:
          "Check bot stats with `/stats`, create embedded messages with `/embed`, and view server info with `/server-info`.",
      },
      {
        name: "❓ Need Help?",
        value: "Join our [support server](https://discord.gg/novabot) for assistance.",
      },
    )
    .setThumbnail(guild.client.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setFooter({ text: "Tip: Type / to see all available commands" })
    .setTimestamp()

  await targetChannel.send({ embeds: [welcomeEmbed] })
}

