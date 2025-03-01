import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import config from "../../config.js"
import { ownerOnly } from "../../utils/ownerUtils.js"

export const data = new SlashCommandBuilder()
  .setName("play")
  .setDescription("Play a song from YouTube or Spotify")
  .addStringOption((option) =>
    option.setName("query").setDescription("Song name, YouTube URL, or Spotify URL").setRequired(true),
  )

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

  // Rest of the original play command code...
  await interaction.deferReply()

  const query = interaction.options.getString("query")
  const voiceChannel = interaction.member.voice.channel

  if (!voiceChannel) {
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Error")
      .setDescription("You need to be in a voice channel to use this command!")
      .setFooter({ text: "NovaBot Music System" })

    return interaction.followUp({ embeds: [errorEmbed] })
  }

  try {
    const result = await client.musicPlayer.play(interaction, query, voiceChannel)

    if (!result.success) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Error")
        .setDescription(result.message)
        .setFooter({ text: "NovaBot Music System" })

      return interaction.followUp({ embeds: [errorEmbed] })
    }

    const songEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle("Added to Queue")
      .setDescription(`[${result.song.title}](${result.song.url})`)
      .setThumbnail(result.song.thumbnail)
      .addFields(
        { name: "Duration", value: result.song.duration },
        { name: "Requested By", value: interaction.user.tag },
      )

    await interaction.followUp({ embeds: [songEmbed] })
  } catch (error) {
    console.error(error)
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Error")
      .setDescription("There was an error trying to play that song!")
      .setFooter({ text: "NovaBot Music System" })

    await interaction.followUp({ embeds: [errorEmbed] })
  }
}

