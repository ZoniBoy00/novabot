import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js"
import config from "../../config.js"
import { logModAction } from "../../utils/modLogger.js"

export const data = new SlashCommandBuilder()
  .setName("mute")
  .setDescription("Timeout a user for a specified duration")
  .addUserOption((option) => option.setName("user").setDescription("The user to timeout").setRequired(true))
  .addStringOption((option) =>
    option.setName("duration").setDescription("Duration of the timeout (e.g., 1m, 1h, 1d)").setRequired(true),
  )
  .addStringOption((option) => option.setName("reason").setDescription("Reason for the timeout").setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

export async function execute(interaction) {
  const targetUser = interaction.options.getUser("user")
  const durationString = interaction.options.getString("duration")
  const reason = interaction.options.getString("reason") || "No reason provided"

  // Parse duration
  const duration = parseDuration(durationString)

  if (!duration) {
    return interaction.reply({
      content: "Invalid duration format. Please use formats like 1m, 1h, 1d.",
      ephemeral: true,
    })
  }

  // Check if the duration is within Discord's limits (max 28 days)
  if (duration > 28 * 24 * 60 * 60 * 1000) {
    return interaction.reply({
      content: "Timeout duration cannot exceed 28 days.",
      ephemeral: true,
    })
  }

  // Get the member
  const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null)

  if (!targetMember) {
    return interaction.reply({
      content: "This user is not in the server.",
      ephemeral: true,
    })
  }

  // Check if the bot can timeout the user
  if (!targetMember.moderatable) {
    return interaction.reply({
      content: "I cannot timeout this user. They may have higher permissions than me.",
      ephemeral: true,
    })
  }

  // Check if the command user has permission to timeout the target
  if (interaction.member.roles.highest.position <= targetMember.roles.highest.position) {
    return interaction.reply({
      content: "You cannot timeout this user as they have the same or higher role than you.",
      ephemeral: true,
    })
  }

  try {
    await targetMember.timeout(duration, `${interaction.user.tag}: ${reason}`)

    // Format duration for display
    const formattedDuration = formatDuration(duration)

    // Create timeout embed
    const timeoutEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle("User Timed Out")
      .setDescription(`**${targetUser.tag}** has been timed out for ${formattedDuration}.`)
      .addFields(
        { name: "User ID", value: targetUser.id },
        { name: "Duration", value: formattedDuration },
        { name: "Reason", value: reason },
        { name: "Moderator", value: interaction.user.tag },
      )
      .setTimestamp()

    await interaction.reply({ embeds: [timeoutEmbed] })

    // Log the timeout action
    await logModAction(interaction.guild, {
      type: "Timeout",
      user: targetUser,
      moderator: interaction.user,
      reason,
      duration: formattedDuration,
    })
  } catch (error) {
    console.error(error)
    await interaction.reply({
      content: `Failed to timeout ${targetUser.tag}: ${error.message}`,
      ephemeral: true,
    })
  }
}

// Helper function to parse duration string to milliseconds
function parseDuration(durationString) {
  const regex = /^(\d+)([mhd])$/
  const match = durationString.match(regex)

  if (!match) return null

  const value = Number.parseInt(match[1])
  const unit = match[2]

  switch (unit) {
    case "m":
      return value * 60 * 1000 // minutes
    case "h":
      return value * 60 * 60 * 1000 // hours
    case "d":
      return value * 24 * 60 * 60 * 1000 // days
    default:
      return null
  }
}

// Helper function to format duration in a readable format
function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days !== 1 ? "s" : ""}`
  if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""}`
  if (minutes > 0) return `${minutes} minute${minutes !== 1 ? "s" : ""}`
  return `${seconds} second${seconds !== 1 ? "s" : ""}`
}

