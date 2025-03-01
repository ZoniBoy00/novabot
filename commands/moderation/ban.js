import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js"
import config from "../../config.js"
import { logModAction } from "../../utils/modLogger.js"

export const data = new SlashCommandBuilder()
  .setName("ban")
  .setDescription("Ban a user from the server")
  .addUserOption((option) => option.setName("user").setDescription("The user to ban").setRequired(true))
  .addStringOption((option) => option.setName("reason").setDescription("Reason for the ban").setRequired(false))
  .addIntegerOption((option) =>
    option
      .setName("days")
      .setDescription("Number of days of messages to delete (0-7)")
      .setMinValue(0)
      .setMaxValue(7)
      .setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)

export async function execute(interaction) {
  const targetUser = interaction.options.getUser("user")
  const reason = interaction.options.getString("reason") || "No reason provided"
  const deleteMessageDays = interaction.options.getInteger("days") || 0

  // Check if the bot can ban the user
  const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null)

  if (targetMember) {
    if (!targetMember.bannable) {
      return interaction.reply({
        content: "I cannot ban this user. They may have higher permissions than me.",
        ephemeral: true,
      })
    }

    if (interaction.member.roles.highest.position <= targetMember.roles.highest.position) {
      return interaction.reply({
        content: "You cannot ban this user as they have the same or higher role than you.",
        ephemeral: true,
      })
    }
  }

  try {
    await interaction.guild.members.ban(targetUser, {
      deleteMessageDays,
      reason: `${interaction.user.tag}: ${reason}`,
    })

    // Create ban embed
    const banEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle("User Banned")
      .setDescription(`**${targetUser.tag}** has been banned from the server.`)
      .addFields(
        { name: "User ID", value: targetUser.id },
        { name: "Reason", value: reason },
        { name: "Moderator", value: interaction.user.tag },
      )
      .setTimestamp()

    await interaction.reply({ embeds: [banEmbed] })

    // Log the ban action
    await logModAction(interaction.guild, {
      type: "Ban",
      user: targetUser,
      moderator: interaction.user,
      reason,
    })
  } catch (error) {
    console.error(error)
    await interaction.reply({
      content: `Failed to ban ${targetUser.tag}: ${error.message}`,
      ephemeral: true,
    })
  }
}

