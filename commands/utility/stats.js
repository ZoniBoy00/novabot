import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { version as discordJSVersion } from "discord.js"
import os from "os"

export const data = new SlashCommandBuilder().setName("stats").setDescription("Display detailed bot statistics")

export async function execute(interaction, client) {
  const serverCount = client.guilds.cache.size
  const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
  const channelCount = client.channels.cache.size
  const uptime = formatUptime(client.uptime)

  // Calculate memory usage
  const memoryUsage = process.memoryUsage()
  const totalMemoryMB = Math.round(os.totalmem() / 1024 / 1024)
  const usedMemoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
  const memoryUsagePercent = ((usedMemoryMB / totalMemoryMB) * 100).toFixed(2)

  const statsEmbed = createEmbed({
    title: "📊 NovaBot Statistics",
    description: "Current statistics and performance metrics",
    fields: [
      {
        name: "🌐 Server Stats",
        value: `Servers: ${serverCount}
Members: ${totalMembers.toLocaleString()}
Channels: ${channelCount}`,
        inline: true,
      },
      {
        name: "🎵 Music Stats",
        value: `Active Players: ${client.musicPlayer ? Object.keys(client.musicPlayer.players || {}).length : 0}
Total Songs: ${client.musicPlayer ? Array.from(client.musicPlayer.queues.values()).reduce((acc, queue) => acc + queue.songs.length, 0) : 0}`,
        inline: true,
      },
      {
        name: "⚡ Performance",
        value: `Memory: ${usedMemoryMB}MB/${totalMemoryMB}MB (${memoryUsagePercent}%)
Ping: ${Math.round(client.ws.ping)}ms
Uptime: ${uptime}`,
        inline: true,
      },
      {
        name: "🤖 Bot Info",
        value: `Commands: ${client.handler.commands.size}
Discord.js: v${discordJSVersion}
Node.js: ${process.version}`,
        inline: true,
      },
      {
        name: "🔧 System",
        value: `Platform: ${os.platform()}
CPU: ${os.cpus()[0].model}
Arch: ${os.arch()}`,
        inline: true,
      },
    ],
    thumbnail: client.user.displayAvatarURL({ dynamic: true, size: 256 }),
    footer: { text: "NovaBot • Statistics" },
  })

  await interaction.reply({ embeds: [statsEmbed] })
}

function formatUptime(uptime) {
  const totalSeconds = Math.floor(uptime / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0) parts.push(`${seconds}s`)

  return parts.join(" ") || "0s"
}

