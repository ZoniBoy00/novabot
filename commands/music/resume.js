import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import config from "../../config.js"
import { ownerOnly } from "../../utils/ownerUtils.js"

export const data = new SlashCommandBuilder().setName("resume").setDescription("Resume the paused song")

export async function execute(interaction, client) {
  // Check if user is owner
  const ownerCheck = ownerOnly(interaction)
  if (ownerCheck.error) {
    const maintenanceEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("⚠️ Music System Maintenance")
      .setDescription(
        "The music system is currently under maintenance. We are working to improve the music features. Please try again later.",
      )
      .setFooter({ text: "NovaBot Music System" })

    return interaction.reply({ embeds: [maintenanceEmbed], flags: ["Ephemeral"] })
  }

  const queue = client.musicPlayer.getQueue(interaction.guild.id)

  if (!queue) {
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Nothing Playing")
      .setDescription("There is nothing in the queue!")
      .setFooter({ text: "NovaBot Music System" })

    return interaction.reply({ embeds: [errorEmbed], ephemeral: true })
  }

  try {
    const success = await client.musicPlayer.resume(interaction.guild.id)

    if (success) {
      const resumeEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle("▶️ Music Resumed")
        .setDescription("The current song has been resumed.")
        .setFooter({ text: `Resumed by ${interaction.user.tag}` })

      await interaction.reply({ embeds: [resumeEmbed] })
    } else {
      throw new Error("Failed to resume")
    }
  } catch (error) {
    console.error(error)
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Error")
      .setDescription("There was an error trying to resume the music!")
      .setFooter({ text: "NovaBot Music System" })

    await interaction.reply({ embeds: [errorEmbed], ephemeral: true })
  }
}

