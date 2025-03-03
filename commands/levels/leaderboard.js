import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { UserLevel } from "../../models/UserLevel.js"

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Show the XP leaderboard")
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
      leaderboard = await UserLevel.getServerLeaderboard(interaction.guild.id, pageSize, page)
      totalUsers = await UserLevel.countDocuments({ guildId: interaction.guild.id })
    } else {
      leaderboard = await UserLevel.getGlobalLeaderboard(pageSize, page)
      totalUsers = await UserLevel.countDocuments()
    }

    totalPages = Math.ceil(totalUsers / pageSize)

    if (page > totalPages) {
      return interaction.editReply({
        content: `Invalid page number. There are only ${totalPages} pages.`,
        ephemeral: true,
      })
    }

    // Format leaderboard entries
    const entries = await Promise.all(
      leaderboard.map(async (entry, index) => {
        const user = await interaction.client.users.fetch(entry.userId).catch(() => null)
        const position = (page - 1) * pageSize + index + 1
        const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : "•"
        const totalXP = entry.totalXP || 0 // Add default value
        const messagesCount = entry.stats?.messagesCount || 0 // Add default value
        const voiceMinutes = entry.stats?.voiceMinutes || 0 // Add default value

        return `${medal} **${position}.** ${user ? user.tag : "Unknown User"}
⭐ Level: ${entry.level || 0}
📊 XP: ${totalXP.toLocaleString()}
${entry.badges?.length ? `🏆 Badges: ${entry.badges.map((b) => b.name).join(", ")}` : ""}
📈 Stats: ${messagesCount} messages, ${Math.floor(voiceMinutes / 60)}h voice time`
      }),
    )

    // Get user's rank and data
    let userRank
    let userData
    if (type === "server") {
      userRank = await UserLevel.getServerRank(interaction.guild.id, interaction.user.id)
      userData = await UserLevel.findOne({ guildId: interaction.guild.id, userId: interaction.user.id })
    } else {
      userRank = await UserLevel.getGlobalRank(interaction.user.id)
      userData = await UserLevel.findOne({ userId: interaction.user.id })
    }

    const embed = createEmbed({
      title: `${type === "server" ? "🏆 Server" : "🌍 Global"} Level Leaderboard`,
      description: entries.join("\n\n"),
      fields: [
        {
          name: "📊 Statistics",
          value: `Total Users: ${totalUsers.toLocaleString()}
Your Rank: #${userRank ? userRank.toLocaleString() : "N/A"}
Your Level: ${userData?.level || 0}
Your XP: ${(userData?.totalXP || 0).toLocaleString()}
Page: ${page}/${totalPages}`,
        },
      ],
      footer: { text: `Use /leaderboard ${type} [page] to view other pages • Use /rank to see detailed stats` },
    })

    await interaction.editReply({ embeds: [embed] })
  } catch (error) {
    console.error(error)
    await interaction.editReply({
      content: "There was an error fetching the leaderboard!",
      ephemeral: true,
    })
  }
}

