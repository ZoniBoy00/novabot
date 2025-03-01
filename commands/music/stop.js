import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import config from "../../config.js"
import { ownerOnly } from "../../utils/ownerUtils.js"

export const data = new SlashCommandBuilder().setName("skip").setDescription("Skip the current song")

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
      .setDescription("There is nothing playing that I could skip!")
      .setFooter({ text: "NovaBot Music System" })

    return interaction.reply({ embeds: [errorEmbed] })
  }

  try {
    const currentSong = queue.songs[0]
    await client.musicPlayer.skip(interaction.guild.id)

    const skipEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle("Skipped Song")
      .setDescription(`Skipped [${currentSong.title}](${currentSong.url})`)
      .setFooter({ text: `Skipped by ${interaction.user.tag}` })

    await interaction.reply({ embeds: [skipEmbed] })
  } catch (error) {
    console.error(error)
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Error")
      .setDescription("There was an error trying to skip the song!")
      .setFooter({ text: "NovaBot Music System" })

    await interaction.reply({ embeds: [errorEmbed] })
  }
}

