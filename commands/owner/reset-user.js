import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { ownerOnly } from "../../utils/ownerUtils.js"
import { UserEconomy } from "../../models/UserEconomy.js"
import { UserLevel } from "../../models/UserLevel.js"

export const data = new SlashCommandBuilder()
  .setName("reset-user")
  .setDescription("Reset a user's economy and/or level data (Owner Only)")
  .addUserOption((option) => option.setName("user").setDescription("The user to reset").setRequired(true))
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

  const target = interaction.options.getUser("user")
  const type = interaction.options.getString("type")

  try {
    let resetEconomy = false
    let resetLevels = false

    if (type === "economy" || type === "both") {
      await UserEconomy.findOneAndUpdate(
        { guildId: interaction.guild.id, userId: target.id },
        {
          $set: {
            balance: 0,
            businesses: [],
            lastDaily: null,
            lastWork: null,
            lastRob: null,
          },
        },
        { upsert: true },
      )
      resetEconomy = true
    }

    if (type === "levels" || type === "both") {
      await UserLevel.findOneAndUpdate(
        { guildId: interaction.guild.id, userId: target.id },
        {
          $set: {
            xp: 0,
            level: 0,
            lastMessageDate: new Date(),
          },
        },
        { upsert: true },
      )
      resetLevels = true
    }

    const resetEmbed = createEmbed({
      title: "🔄 User Reset Complete",
      description: `Reset completed for ${target.tag}`,
      fields: [
        {
          name: "Reset Type",
          value: type.charAt(0).toUpperCase() + type.slice(1),
        },
        {
          name: "Details",
          value: `${resetEconomy ? "✅ Economy data reset\n" : ""}${resetLevels ? "✅ Level data reset" : ""}`,
        },
      ],
      color: "#FF9900",
      footer: { text: "User data has been reset to default values" },
    })

    await interaction.reply({ embeds: [resetEmbed] })
  } catch (error) {
    console.error(error)
    const errorEmbed = createEmbed({
      title: "Error",
      description: "There was an error resetting the user's data.",
      color: "#FF0000",
    })
    await interaction.reply({ embeds: [errorEmbed], flags: ["Ephemeral"] })
  }
}

