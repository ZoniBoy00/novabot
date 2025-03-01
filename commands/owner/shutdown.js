import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { ownerOnly } from "../../utils/ownerUtils.js"

export const data = new SlashCommandBuilder()
  .setName("shutdown")
  .setDescription("Safely shuts down the bot (Owner Only)")

export async function execute(interaction) {
  // Check if user is owner
  const ownerCheck = ownerOnly(interaction)
  if (ownerCheck.error) {
    const errorEmbed = createEmbed({
      title: "Error",
      description: ownerCheck.message,
      color: "#FF0000",
    })
    return interaction.reply({ embeds: [errorEmbed], ephemeral: true })
  }

  const shutdownEmbed = createEmbed({
    title: "Bot Shutdown",
    description: "Bot is shutting down...",
    color: "#FF0000",
  })

  await interaction.reply({ embeds: [shutdownEmbed] })

  // Graceful shutdown
  setTimeout(() => {
    process.exit(0)
  }, 1000)
}

