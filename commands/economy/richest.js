import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { UserEconomy } from "../../models/UserEconomy.js"

export const data = new SlashCommandBuilder()
  .setName("richest")
  .setDescription("Show the wealthiest users")
  .addStringOption((option) =>
    option
      .setName("type")
      .setDescription("Leaderboard type")
      .setRequired(true)
      .addChoices({ name: "Server", value: "server" }, { name: "Global", value: "global" }),
  )
  .addIntegerOption((option) => option.setName("page").setDescription("Page number").setRequired(false).setMinValue(1))

export async function execute(interaction) {
  const type = interaction.options.getString("type")
  const page = interaction.options.getInteger("page") || 1
  const pageSize = 10

  try {
    await interaction.deferReply()

    let leaderboard
    let totalPages
    let totalUsers

    if (type === "server") {
      leaderboard = await UserEconomy.getServerLeaderboard(interaction.guild.id, pageSize)
      totalUsers = await UserEconomy.countDocuments({ guildId: interaction.guild.id })
    } else {
      leaderboard = await UserEconomy.getGlobalLeaderboard(pageSize)
      totalUsers = await UserEconomy.countDocuments()
    }

    totalPages = Math.ceil(totalUsers / pageSize)

    if (page > totalPages) {
      return interaction.editReply({
        content: `Invalid page number. There are only ${totalPages} pages.`,
        ephemeral: true,
      })
    }

    // Calculate total server/global wealth
    const totalWealth = leaderboard.reduce((sum, entry) => sum + entry.balance + (entry.bank || 0), 0)

    // Format leaderboard entries
    const entries = await Promise.all(
      leaderboard.map(async (entry, index) => {
        const user = await interaction.client.users.fetch(entry.userId).catch(() => null)
        const position = (page - 1) * pageSize + index + 1
        const medal = position === 1 ? "👑" : position === 2 ? "🥈" : position === 3 ? "🥉" : "💠"
        const netWorth = entry.balance + (entry.bank || 0)
        const percentage = ((netWorth / totalWealth) * 100).toFixed(1)

        return `${medal} **${position}.** ${user ? user.tag : "Unknown User"}
💰 Balance: ${entry.balance.toLocaleString()}
🏦 Bank: ${(entry.bank || 0).toLocaleString()}
📈 Net Worth: ${netWorth.toLocaleString()} (${percentage}% of total wealth)
${entry.job ? `💼 Job: ${entry.job.title} at ${entry.job.company}` : ""}
${entry.properties?.length ? `🏠 Properties: ${entry.properties.length}` : ""}
${entry.investments?.length ? `📊 Investments: ${entry.investments.length}` : ""}`
      }),
    )

    // Get user's data and rank
    let userRank
    let userData
    if (type === "server") {
      userData = await UserEconomy.findOne({ guildId: interaction.guild.id, userId: interaction.user.id })
      userRank =
        (await UserEconomy.countDocuments({
          guildId: interaction.guild.id,
          balance: { $gt: userData?.balance || 0 },
        })) + 1
    } else {
      userData = await UserEconomy.findOne({ userId: interaction.user.id })
      userRank =
        (await UserEconomy.countDocuments({
          balance: { $gt: userData?.balance || 0 },
        })) + 1
    }

    const embed = createEmbed({
      title: `${type === "server" ? "🏆 Server" : "🌍 Global"} Economy Leaderboard`,
      description: entries.join("\n\n"),
      fields: [
        {
          name: "📊 Economy Statistics",
          value: `Total Wealth: ${totalWealth.toLocaleString()}
Average Wealth: ${Math.floor(totalWealth / totalUsers).toLocaleString()}
Total Users: ${totalUsers.toLocaleString()}
Your Rank: #${userRank.toLocaleString()}`,
        },
        {
          name: "💰 Your Stats",
          value: `Balance: ${userData?.balance.toLocaleString() || "0"}
Bank: ${userData?.bank?.toLocaleString() || "0"}
Net Worth: ${((userData?.balance || 0) + (userData?.bank || 0)).toLocaleString()}
Businesses: ${userData?.businesses?.length || 0}
Properties: ${userData?.properties?.length || 0}
Investments: ${userData?.investments?.length || 0}`,
        },
      ],
      footer: { text: `Page ${page}/${totalPages} • Use /richest ${type} [page] to view other pages` },
    })

    // Add quick tips for bottom 50% of users
    if (userRank > totalUsers / 2) {
      embed.addFields({
        name: "💡 Quick Tips",
        value: `• Use \`/daily\` for free daily rewards
• Work regularly with \`/work\`
• Start businesses with \`/shop\`
• Invest wisely with \`/invest\`
• Buy properties with \`/property\`
• Try your luck with \`/slots\` or \`/blackjack\``,
      })
    }

    await interaction.editReply({ embeds: [embed] })
  } catch (error) {
    console.error(error)
    await interaction.editReply({
      content: "There was an error fetching the leaderboard!",
      ephemeral: true,
    })
  }
}

