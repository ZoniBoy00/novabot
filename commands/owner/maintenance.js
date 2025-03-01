import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { ownerOnly } from "../../utils/ownerUtils.js"

export const data = new SlashCommandBuilder()
  .setName("maintenance")
  .setDescription("Toggle maintenance mode (Owner Only)")
  .addBooleanOption((option) =>
    option.setName("enabled").setDescription("Enable or disable maintenance mode").setRequired(true),
  )
  .addStringOption((option) => option.setName("reason").setDescription("Reason for maintenance").setRequired(false))

export async function execute(interaction, client) {
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

  const enabled = interaction.options.getBoolean("enabled")
  const reason = interaction.options.getString("reason") || "No reason provided"

  // Set maintenance mode
  client.maintenance = enabled
  client.maintenanceReason = reason

  const maintenanceEmbed = createEmbed({
    title: "Maintenance Mode",
    description: `Maintenance mode has been ${enabled ? "enabled" : "disabled"}.`,
    fields: [
      {
        name: "Reason",
        value: reason,
      },
    ],
    color: enabled ? "#FF0000" : "#00FF00",
  })

  await interaction.reply({ embeds: [maintenanceEmbed] })

  // Update bot status if maintenance mode is enabled
  if (enabled) {
    client.user.setPresence({
      activities: [{ name: "🛠️ Maintenance Mode" }],
      status: "dnd",
    })
  } else {
    // Reset status
    client.statusManager.updateStatus()
  }
}

