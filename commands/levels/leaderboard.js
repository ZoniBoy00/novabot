import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { levelSystem } from "../../utils/levels.js"
import { getDirname } from "../../utils/paths.js"

const __dirname = getDirname(import.meta.url)

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Show the server's XP leaderboard")
  .addIntegerOption((option) =>
    option.setName("page").setDescription("The page number to view").setRequired(false).setMinValue(1),
  )

export async function execute(interaction) {
  const page = interaction.options.getInteger("page") || 1
  const pageSize = 10
  const leaderboard = levelSystem.getLeaderboard(interaction.guild.id)

  if (leaderboard.length === 0) {
    return interaction.reply({
      content: "No one has earned any XP yet!",
      flags: ["Ephemeral"],
    })
  }

  const maxPages = Math.ceil(leaderboard.length / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentPage = leaderboard.slice(startIndex, endIndex)

  const leaderboardText = await Promise.all(
    currentPage.map(async ([userId, data], index) => {
      const user = await interaction.client.users.fetch(userId).catch(() => null)
      const position = startIndex + index + 1
      const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : "•"
      return `${medal} **${position}.** ${user ? user.tag : "Unknown User"}
Level ${data.level} • ${data.xp} XP`
    }),
  )

  const leaderboardEmbed = createEmbed({
    title: "🏆 XP Leaderboard",
    description: leaderboardText.join("\n\n"),
    footer: { text: `Page ${page}/${maxPages} • ${leaderboard.length} total users` },
  })

  await interaction.reply({ embeds: [leaderboardEmbed] })
}

