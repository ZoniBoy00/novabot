import { SlashCommandBuilder, EmbedBuilder, ChannelType } from "discord.js"
import config from "../../config.js"

export const data = new SlashCommandBuilder()
  .setName("server-info")
  .setDescription("Display detailed information about the server")

export async function execute(interaction) {
  const { guild } = interaction

  // Fetch more guild data if needed
  await guild.fetch()

  // Get member counts
  const totalMembers = guild.memberCount
  const botCount = guild.members.cache.filter((member) => member.user.bot).size
  const humanCount = totalMembers - botCount
  const onlineCount = guild.members.cache.filter((member) => member.presence?.status === "online").size

  // Get channel counts
  const textChannels = guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildText).size
  const voiceChannels = guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildVoice).size
  const categoryChannels = guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildCategory).size
  const forumChannels = guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildForum).size
  const threadCount = guild.channels.cache.filter(
    (channel) => channel.type === ChannelType.PublicThread || channel.type === ChannelType.PrivateThread,
  ).size

  // Get role information
  const roles = guild.roles.cache.size - 1 // Subtract @everyone role
  const emojis = guild.emojis.cache.size
  const stickers = guild.stickers.cache.size
  const boostCount = guild.premiumSubscriptionCount || 0
  const boostLevel = guild.premiumTier

  // Create embed
  const serverEmbed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle(guild.name)
    .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
    .addFields(
      {
        name: "📊 General Info",
        value: `Owner: <@${guild.ownerId}>
Created: <t:${Math.floor(guild.createdTimestamp / 1000)}:R>
Boost Level: ${boostLevel} (${boostCount} boosts)
Verification: ${guild.verificationLevel}`,
        inline: true,
      },
      {
        name: "👥 Members",
        value: `Total: ${totalMembers}
Humans: ${humanCount}
Bots: ${botCount}
Online: ${onlineCount}`,
        inline: true,
      },
      {
        name: "📝 Channels",
        value: `Text: ${textChannels}
Voice: ${voiceChannels}
Categories: ${categoryChannels}
Forums: ${forumChannels}
Threads: ${threadCount}`,
        inline: true,
      },
      {
        name: "✨ Features",
        value:
          guild.features.length > 0
            ? guild.features.map((f) => `\`${f.toLowerCase().replace(/_/g, " ")}\``).join(", ")
            : "No special features",
      },
      {
        name: "🎨 Customization",
        value: `Roles: ${roles}
Emojis: ${emojis}
Stickers: ${stickers}`,
        inline: true,
      },
      {
        name: "🔐 Moderation",
        value: `Content Filter: ${guild.explicitContentFilter}
2FA Required: ${guild.mfaLevel === 1 ? "Yes" : "No"}
AFK Timeout: ${guild.afkTimeout / 60} minutes`,
        inline: true,
      },
    )
    .setFooter({ text: `ID: ${guild.id} • ${guild.preferredLocale}` })
    .setTimestamp()

  // Add server banner if available
  if (guild.banner) {
    serverEmbed.setImage(guild.bannerURL({ size: 1024 }))
  }

  await interaction.reply({ embeds: [serverEmbed] })
}

