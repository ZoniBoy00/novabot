import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js"
import config from "../../config.js"
import { logModAction } from "../../utils/modLogger.js"

export const data = new SlashCommandBuilder()
  .setName("kick")
  .setDescription("Kick a user from the server")
  .addUserOption((option) => option.setName("user").setDescription("The user to kick").setRequired(true))
  .addStringOption((option) => option.setName("reason").setDescription("Reason for the kick").setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)

export async function execute(interaction) {
  const targetUser = interaction.options.getUser("user")
  const reason = interaction.options.getString("reason") || "No reason provided"

  // Check if the user is in the guild
  const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null)

  if (!targetMember) {
    return interaction.reply({
      content: "This user is not in the server.",
      ephemeral: true,
    })
  }

  // Check if the bot can kick the user
  if (!targetMember.kickable) {
    return interaction.reply({
      content: "I cannot kick this user. They may have higher permissions than me.",
      ephemeral: true,
    })
  }

  // Check if the command user has permission to kick the target
  if (interaction.member.roles.highest.position <= targetMember.roles.highest.position) {
    return interaction.reply({
      content: "You cannot kick this user as they have the same or higher role than you.",
      ephemeral: true,
    })
  }

  try {
    await targetMember.kick(`${interaction.user.tag}: ${reason}`)

    // Create kick embed
    const kickEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle("User Kicked")
      .setDescription(`**${targetUser.tag}** has been kicked from the server.`)
      .addFields(
        { name: "User ID", value: targetUser.id },
        { name: "Reason", value: reason },
        { name: "Moderator", value: interaction.user.tag },
      )
      .setTimestamp()

    await interaction.reply({ embeds: [kickEmbed] })

    // Log the kick action
    await logModAction(interaction.guild, {
      type: "Kick",
      user: targetUser,
      moderator: interaction.user,
      reason,
    })
  } catch (error) {
    console.error(error)
    await interaction.reply({
      content: `Failed to kick ${targetUser.tag}: ${error.message}`,
      ephemeral: true,
    })
  }
}

