import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { currencySystem } from "../../utils/currency.js"

export const data = new SlashCommandBuilder()
  .setName("richest")
  .setDescription("Show the server's wealthiest users")
  .addIntegerOption((option) =>
    option.setName("page").setDescription("The page number to view").setRequired(false).setMinValue(1),
  )

export async function execute(interaction) {
  const page = interaction.options.getInteger("page") || 1
  const pageSize = 10
  const leaderboard = currencySystem.getLeaderboard(interaction.guild.id)

  if (leaderboard.length === 0) {
    const emptyEmbed = createEmbed({
      title: "💰 Server Economy",
      description: "No one has earned any money yet!\nBe the first to start earning with `/daily` and `/work`!",
      color: "#FFD700",
      footer: { text: "💡 Tip: Use /daily to get started!" },
    })
    return interaction.reply({ embeds: [emptyEmbed] })
  }

  const maxPages = Math.ceil(leaderboard.length / pageSize)
  if (page > maxPages) {
    const errorEmbed = createEmbed({
      title: "❌ Invalid Page",
      description: `There are only ${maxPages} pages available!`,
      color: "#FF0000",
    })
    return interaction.reply({ embeds: [errorEmbed], flags: ["Ephemeral"] })
  }

  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentPage = leaderboard.slice(startIndex, endIndex)

  const totalWealth = leaderboard.reduce((sum, [_, data]) => sum + data.balance, 0)
  const averageWealth = Math.floor(totalWealth / leaderboard.length)

  const leaderboardText = await Promise.all(
    currentPage.map(async ([userId, data], index) => {
      const user = await interaction.client.users.fetch(userId).catch(() => null)
      const position = startIndex + index + 1
      const medal = position === 1 ? "👑" : position === 2 ? "🥈" : position === 3 ? "🥉" : "💠"
      const percentage = ((data.balance / totalWealth) * 100).toFixed(1)
      return `${medal} **${position}.** ${user ? user.tag : "Unknown User"}
\`${currencySystem.formatBalance(data.balance)}\` (${percentage}% of total wealth)`
    }),
  )

  const richestEmbed = createEmbed({
    title: "🏆 Wealthiest Citizens",
    description: `Displaying the richest members of ${interaction.guild.name}!`,
    fields: [
      {
        name: "📊 Economy Statistics",
        value: `Total Wealth: \`${currencySystem.formatBalance(totalWealth)}\`
Average Wealth: \`${currencySystem.formatBalance(averageWealth)}\`
Active Users: \`${leaderboard.length}\``,
      },
      {
        name: "🎖️ Rankings",
        value: leaderboardText.join("\n\n"),
      },
    ],
    color: "#FFD700", // Gold color
    thumbnail: interaction.guild.iconURL({ dynamic: true }),
    footer: { text: `📄 Page ${page}/${maxPages} • ${leaderboard.length} total users • Use /richest [page]` },
  })

  // Add quick tips for bottom 50% of users
  if (page === maxPages && leaderboard.length > 1) {
    richestEmbed.addFields({
      name: "💡 Quick Tips",
      value: `• Use \`/daily\` for free daily rewards
• Work regularly with \`/work\`
• Try your luck with \`/slots\` or \`/blackjack\`
• Trade with other users using \`/give\``,
    })
  }

  await interaction.reply({ embeds: [richestEmbed] })
}

