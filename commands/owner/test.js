import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { ownerOnly } from "../../utils/ownerUtils.js"

export const data = new SlashCommandBuilder().setName("test").setDescription("Test command (Owner Only)")

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

  const testEmbed = createEmbed({
    title: "Test Command",
    description: "If you see this, owner commands are working!",
    color: "#00FF00",
  })

  await interaction.reply({ embeds: [testEmbed], flags: ["Ephemeral"] })
}

