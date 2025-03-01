import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import config from "../../config.js"

export const data = new SlashCommandBuilder().setName("shuffle").setDescription("Shuffle the music queue")

export async function execute(interaction, client) {
  const queue = client.musicPlayer.getQueue(interaction.guild.id)

  if (!queue || queue.songs.length <= 1) {
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Cannot Shuffle")
      .setDescription("Need at least 2 songs in the queue to shuffle.")
      .setFooter({ text: "NovaBot Music System" })

    return interaction.reply({ embeds: [errorEmbed], ephemeral: true })
  }

  try {
    await client.musicPlayer.shuffle(interaction.guild.id)

    const shuffleEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle("Queue Shuffled")
      .setDescription("The music queue has been shuffled!")
      .setFooter({ text: `Shuffled by ${interaction.user.tag}` })

    await interaction.reply({ embeds: [shuffleEmbed] })
  } catch (error) {
    console.error(error)
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Error")
      .setDescription("There was an error trying to shuffle the queue!")
      .setFooter({ text: "NovaBot Music System" })

    await interaction.reply({ embeds: [errorEmbed], ephemeral: true })
  }
}

