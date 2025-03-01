import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import config from "../../config.js"

export const data = new SlashCommandBuilder()
  .setName("loop")
  .setDescription("Toggle loop mode")
  .addStringOption((option) =>
    option
      .setName("mode")
      .setDescription("Loop mode")
      .setRequired(true)
      .addChoices({ name: "Off", value: "off" }, { name: "Song", value: "song" }, { name: "Queue", value: "queue" }),
  )

export async function execute(interaction, client) {
  const mode = interaction.options.getString("mode")
  const queue = client.musicPlayer.getQueue(interaction.guild.id)

  if (!queue) {
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("No Music Playing")
      .setDescription("There is no music playing to loop.")
      .setFooter({ text: "NovaBot Music System" })

    return interaction.reply({ embeds: [errorEmbed], ephemeral: true })
  }

  try {
    await client.musicPlayer.setLoop(interaction.guild.id, mode)

    const loopEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle("Loop Mode Changed")
      .setDescription(`Loop mode has been set to: ${mode}`)
      .setFooter({ text: `Changed by ${interaction.user.tag}` })

    await interaction.reply({ embeds: [loopEmbed] })
  } catch (error) {
    console.error(error)
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Error")
      .setDescription("There was an error trying to change the loop mode!")
      .setFooter({ text: "NovaBot Music System" })

    await interaction.reply({ embeds: [errorEmbed], ephemeral: true })
  }
}

