import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import config from "../../config.js"

export const data = new SlashCommandBuilder()
  .setName("nowplaying")
  .setDescription("Show information about the currently playing song")

export async function execute(interaction, client) {
  const queue = client.musicPlayer.getQueue(interaction.guild.id)

  if (!queue || !queue.songs[0]) {
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("No Music Playing")
      .setDescription("There is no music currently playing.")
      .setFooter({ text: "NovaBot Music System" })

    return interaction.reply({ embeds: [errorEmbed], ephemeral: true })
  }

  const song = queue.songs[0]
  const progress = client.musicPlayer.createProgressBar(interaction.guild.id)

  const nowPlayingEmbed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle("Now Playing")
    .setDescription(`[${song.title}](${song.url})`)
    .setThumbnail(song.thumbnail)
    .addFields(
      { name: "Duration", value: song.duration, inline: true },
      { name: "Requested By", value: song.requestedBy, inline: true },
      { name: "Progress", value: progress },
    )
    .setFooter({ text: "NovaBot Music System" })

  await interaction.reply({ embeds: [nowPlayingEmbed] })
}

