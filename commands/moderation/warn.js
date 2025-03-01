import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js"
import config from "../../config.js"
import { logModAction } from "../../utils/modLogger.js"

export const data = new SlashCommandBuilder()
  .setName("warn")
  .setDescription("Warn a user")
  .addUserOption((option) => option.setName("user").setDescription("The user to warn").setRequired(true))
  .addStringOption((option) => option.setName("reason").setDescription("Reason for the warning").setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

export async function execute(interaction) {
  const targetUser = interaction.options.getUser("user")
  const reason = interaction.options.getString("reason")

  // Check if user is in the guild
  const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null)

  if (!targetMember) {
    return interaction.reply({
      content: "This user is not in the server.",
      ephemeral: true,
    })
  }

  // Check if the command user has permission to warn the target
  if (interaction.member.roles.highest.position <= targetMember.roles.highest.position) {
    return interaction.reply({
      content: "You cannot warn this user as they have the same or higher role than you.",
      ephemeral: true,
    })
  }

  try {
    // Create warning embed
    const warnEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle("User Warned")
      .setDescription(`**${targetUser.tag}** has been warned.`)
      .addFields(
        { name: "User ID", value: targetUser.id },
        { name: "Reason", value: reason },
        { name: "Moderator", value: interaction.user.tag },
      )
      .setTimestamp()

    // Send warning to user
    const userEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle("Warning Received")
      .setDescription(`You have been warned in ${interaction.guild.name}`)
      .addFields({ name: "Reason", value: reason })
      .setTimestamp()

    await targetUser.send({ embeds: [userEmbed] }).catch(() => {
      warnEmbed.addFields({ name: "Note", value: "Could not DM user" })
    })

    await interaction.reply({ embeds: [warnEmbed] })

    // Log the warning
    await logModAction(interaction.guild, {
      type: "Warning",
      user: targetUser,
      moderator: interaction.user,
      reason,
    })
  } catch (error) {
    console.error(error)
    await interaction.reply({
      content: `Failed to warn ${targetUser.tag}: ${error.message}`,
      ephemeral: true,
    })
  }
}

