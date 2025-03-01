import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"

export const data = new SlashCommandBuilder()
  .setName("restart")
  .setDescription("Restart the bot")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export async function execute(interaction) {
  const embed = createEmbed({
    title: "Bot Restart",
    description: "Bot is restarting...",
    color: "#FFA500",
  })

  await interaction.reply({ embeds: [embed] })

  // Trigger nodemon restart
  process.exit(1)
}

