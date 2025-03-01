import { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { ownerOnly } from "../../utils/ownerUtils.js"
import { UserEconomy } from "../../models/UserEconomy.js"
import { UserLevel } from "../../models/UserLevel.js"

export const data = new SlashCommandBuilder()
  .setName("reset-all")
  .setDescription("Reset all users' economy and/or level data (Owner Only)")
  .addStringOption((option) =>
    option
      .setName("type")
      .setDescription("What to reset")
      .setRequired(true)
      .addChoices(
        { name: "Economy", value: "economy" },
        { name: "Levels", value: "levels" },
        { name: "Both", value: "both" },
      ),
  )

export async function execute(interaction) {
  // Check if user is owner
  const ownerCheck = ownerOnly(interaction)
  if (ownerCheck.error) {
    const errorEmbed = createEmbed({
      title: "Error",
      description: ownerCheck.message,
      color: "#FF0000",
    })
    return interaction.reply({ embeds: [errorEmbed], flags: ["Ephemeral"] })
  }

  const type = interaction.options.getString("type")

  // Create confirmation buttons
  const confirmButton = new ButtonBuilder()
    .setCustomId("confirm-reset")
    .setLabel("Confirm Reset")
    .setStyle(ButtonStyle.Danger)

  const cancelButton = new ButtonBuilder()
    .setCustomId("cancel-reset")
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Secondary)

  const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton)

  const confirmEmbed = createEmbed({
    title: "⚠️ Confirmation Required",
    description: `Are you sure you want to reset **${type}** data for **ALL** users in this server?
This action cannot be undone!`,
    color: "#FF0000",
    footer: { text: "This action will affect all users in the server" },
  })

  const response = await interaction.reply({
    embeds: [confirmEmbed],
    components: [row],
    fetchReply: true,
  })

  try {
    const confirmation = await response.awaitMessageComponent({
      filter: (i) => i.user.id === interaction.user.id,
      time: 30000,
    })

    if (confirmation.customId === "confirm-reset") {
      let resetCount = 0

      if (type === "economy" || type === "both") {
        const result = await UserEconomy.updateMany(
          { guildId: interaction.guild.id },
          {
            $set: {
              balance: 0,
              businesses: [],
              lastDaily: null,
              lastWork: null,
              lastRob: null,
            },
          },
        )
        resetCount += result.modifiedCount
      }

      if (type === "levels" || type === "both") {
        const result = await UserLevel.updateMany(
          { guildId: interaction.guild.id },
          {
            $set: {
              xp: 0,
              level: 0,
              lastMessageDate: new Date(),
            },
          },
        )
        resetCount += result.modifiedCount
      }

      const resetEmbed = createEmbed({
        title: "🔄 Server-Wide Reset Complete",
        description: `Successfully reset ${type} data for all users.`,
        fields: [
          {
            name: "Reset Type",
            value: type.charAt(0).toUpperCase() + type.slice(1),
          },
          {
            name: "Affected Records",
            value: `${resetCount} record${resetCount !== 1 ? "s" : ""} reset`,
          },
        ],
        color: "#FF9900",
        footer: { text: "All user data has been reset to default values" },
      })

      await confirmation.update({ embeds: [resetEmbed], components: [] })
    } else {
      const cancelEmbed = createEmbed({
        title: "Reset Cancelled",
        description: "The server-wide reset has been cancelled.",
        color: "#00FF00",
      })

      await confirmation.update({ embeds: [cancelEmbed], components: [] })
    }
  } catch (error) {
    if (error.code === "InteractionCollectorError") {
      const timeoutEmbed = createEmbed({
        title: "Reset Cancelled",
        description: "The confirmation timed out.",
        color: "#FF0000",
      })
      await interaction.editReply({ embeds: [timeoutEmbed], components: [] })
    } else {
      console.error(error)
      const errorEmbed = createEmbed({
        title: "Error",
        description: "There was an error processing the reset.",
        color: "#FF0000",
      })
      await interaction.editReply({ embeds: [errorEmbed], components: [] })
    }
  }
}

