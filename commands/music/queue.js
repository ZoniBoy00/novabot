import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import config from "../../config.js"
import { ownerOnly } from "../../utils/ownerUtils.js"

export const data = new SlashCommandBuilder().setName("queue").setDescription("Display the current music queue")

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

  if (!queue || queue.songs.length === 0) {
    const emptyQueueEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle("Empty Queue")
      .setDescription("There are no songs in the queue!")
      .setFooter({ text: "NovaBot Music System" })

    return interaction.reply({ embeds: [emptyQueueEmbed] })
  }

  const totalPages = Math.ceil(queue.songs.length / 10) || 1
  const page = 1

  const queueString = queue.songs
    .slice((page - 1) * 10, page * 10)
    .map((song, i) => {
      return `**${(page - 1) * 10 + i + 1}.** [${song.title}](${song.url}) - \`${song.duration}\``
    })
    .join("\n")

  const currentSong = queue.songs[0]

  const queueEmbed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle("Music Queue")
    .setDescription(
      `**Currently Playing:**\n[${currentSong.title}](${currentSong.url}) - \`${currentSong.duration}\`\n\n**Queue:**\n${queueString}`,
    )
    .setFooter({ text: `Page ${page} of ${totalPages} | ${queue.songs.length} song(s) in queue` })

  await interaction.reply({ embeds: [queueEmbed] })
}

