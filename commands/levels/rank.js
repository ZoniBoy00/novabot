import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { UserLevel } from "../../models/UserLevel.js"

export const data = new SlashCommandBuilder()
  .setName("rank")
  .setDescription("Check your or another user's rank")
  .addUserOption((option) => option.setName("user").setDescription("The user to check rank for").setRequired(false))
  .addStringOption((option) =>
    option
      .setName("type")
      .setDescription("Rank type")
      .setRequired(false)
      .addChoices({ name: "Server", value: "server" }, { name: "Global", value: "global" }),
  )

export async function execute(interaction) {
  const targetUser = interaction.options.getUser("user") || interaction.user
  const type = interaction.options.getString("type") || "server"

  try {
    await interaction.deferReply()

    let userData
    let rank
    let totalUsers

    if (type === "server") {
      userData = await UserLevel.findOne({
        guildId: interaction.guild.id,
        userId: targetUser.id,
      })
      rank = await UserLevel.getServerRank(interaction.guild.id, targetUser.id)
      totalUsers = await UserLevel.countDocuments({ guildId: interaction.guild.id })
    } else {
      userData = await UserLevel.findOne({ userId: targetUser.id })
      rank = await UserLevel.getGlobalRank(targetUser.id)
      totalUsers = await UserLevel.countDocuments()
    }

    if (!userData) {
      return interaction.editReply({
        content: "This user has not earned any XP yet!",
        ephemeral: true,
      })
    }

    // Calculate XP progress
    const nextLevelXP = Math.pow((userData.level + 1) * 4, 2)
    const currentXP = userData.xp
    const progress = Math.min((currentXP / nextLevelXP) * 100, 100).toFixed(1)

    // Create progress bar
    const progressBarLength = 20
    const filledBlocks = Math.floor((progress / 100) * progressBarLength)
    const progressBar = "█".repeat(filledBlocks) + "░".repeat(progressBarLength - filledBlocks)

    const embed = createEmbed({
      title: `${type === "server" ? "Server" : "Global"} Rank Card`,
      description: `**${targetUser.tag}**'s Stats`,
      thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
      fields: [
        {
          name: "📊 Rank",
          value: `#${rank}/${totalUsers}`,
          inline: true,
        },
        {
          name: "⭐ Level",
          value: userData.level.toString(),
          inline: true,
        },
        {
          name: "📈 Total XP",
          value: userData.totalXP.toLocaleString(),
          inline: true,
        },
        {
          name: "📊 Level Progress",
          value: `${progressBar} ${progress}%\n${currentXP.toLocaleString()} / ${nextLevelXP.toLocaleString()} XP`,
        },
        {
          name: "📈 Activity Stats",
          value: `Messages: ${userData.stats.messagesCount.toLocaleString()}
Commands Used: ${userData.stats.commandsUsed.toLocaleString()}
Voice Time: ${Math.floor(userData.stats.voiceMinutes / 60)} hours
Level Ups: ${userData.stats.levelUpCount}`,
        },
      ],
      footer: { text: `View the ${type} leaderboard with /leaderboard ${type}` },
    })

    if (userData.badges?.length > 0) {
      embed.addFields({
        name: "🏆 Badges",
        value: userData.badges
          .map((badge) => `${badge.name} - Earned ${new Date(badge.earnedAt).toLocaleDateString()}`)
          .join("\n"),
      })
    }

    await interaction.editReply({ embeds: [embed] })
  } catch (error) {
    console.error(error)
    await interaction.editReply({
      content: "There was an error fetching rank data!",
      ephemeral: true,
    })
  }
}

