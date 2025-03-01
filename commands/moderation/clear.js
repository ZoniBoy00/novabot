import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js"
import config from "../../config.js"
import { logModAction } from "../../utils/modLogger.js"

export const data = new SlashCommandBuilder()
  .setName("clear")
  .setDescription("Clear messages from a channel")
  .addIntegerOption((option) =>
    option
      .setName("amount")
      .setDescription("Number of messages to clear (1-100)")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100),
  )
  .addUserOption((option) =>
    option.setName("user").setDescription("Only clear messages from this user").setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

export async function execute(interaction) {
  const amount = interaction.options.getInteger("amount")
  const user = interaction.options.getUser("user")

  try {
    // Fetch messages
    const messages = await interaction.channel.messages.fetch({ limit: amount })

    // Filter messages if user specified
    const filteredMessages = user ? messages.filter((msg) => msg.author.id === user.id) : messages

    // Delete messages
    const deleted = await interaction.channel.bulkDelete(filteredMessages, true)

    // Create response embed
    const clearEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle("Messages Cleared")
      .setDescription(`Successfully deleted ${deleted.size} messages.`)
      .addFields({ name: "Channel", value: `${interaction.channel}` })
      .setTimestamp()

    if (user) {
      clearEmbed.addFields({ name: "User Filter", value: user.tag })
    }

    await interaction.reply({ embeds: [clearEmbed] })

    // Log the action
    await logModAction(interaction.guild, {
      type: "Clear Messages",
      user: interaction.user,
      moderator: interaction.user,
      reason: `Cleared ${deleted.size} messages${user ? ` from ${user.tag}` : ""} in #${interaction.channel.name}`,
    })
  } catch (error) {
    console.error(error)
    await interaction.reply({
      content: "Failed to clear messages. Messages older than 14 days cannot be bulk deleted.",
      ephemeral: true,
    })
  }
}

