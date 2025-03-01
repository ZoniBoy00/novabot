import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import config from "../../config.js"

export const data = new SlashCommandBuilder()
  .setName("seek")
  .setDescription("Seek to a specific position in the current song")
  .addStringOption((option) => option.setName("time").setDescription("Time to seek to (e.g., 1:30)").setRequired(true))

export async function execute(interaction, client) {
  const timeString = interaction.options.getString("time")
  const queue = client.musicPlayer.getQueue(interaction.guild.id)

  if (!queue) {
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("No Music Playing")
      .setDescription("There is no music playing to seek through.")
      .setFooter({ text: "NovaBot Music System" })

    return interaction.reply({ embeds: [errorEmbed], ephemeral: true })
  }

  try {
    // Parse time string (e.g., "1:30" to seconds)
    const seconds = timeString.split(":").reduce((acc, time) => 60 * acc + +time, 0)

    await client.musicPlayer.seek(interaction.guild.id, seconds)

    const seekEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle("Seeked Position")
      .setDescription(`Seeked to ${timeString}`)
      .setFooter({ text: `Adjusted by ${interaction.user.tag}` })

    await interaction.reply({ embeds: [seekEmbed] })
  } catch (error) {
    console.error(error)
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Error")
      .setDescription("There was an error trying to seek!")
      .setFooter({ text: "NovaBot Music System" })

    await interaction.reply({ embeds: [errorEmbed], ephemeral: true })
  }
}

