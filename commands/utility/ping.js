import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"

export const data = new SlashCommandBuilder().setName("ping").setDescription("Check the bot's latency")

export async function execute(interaction, client) {
  await interaction.deferReply()

  const sent = await interaction.fetchReply()
  const latency = sent.createdTimestamp - interaction.createdTimestamp

  const pingEmbed = createEmbed({
    title: "Pong! 🏓",
    description: `**Bot Latency:** ${latency}ms\n**API Latency:** ${Math.round(client.ws.ping)}ms`,
    color: "#00FF00",
    footer: { text: "NovaBot Ping System • Made with ❤️ by ZoniBoy00 (https://github.com/ZoniBoy00/novabot)" },
  })

  await interaction.editReply({ embeds: [pingEmbed] })
}

