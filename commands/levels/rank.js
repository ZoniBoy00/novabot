import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { levelSystem } from "../../utils/levels.js"

export const data = new SlashCommandBuilder()
  .setName("rank")
  .setDescription("Check your or another user's rank")
  .addUserOption((option) => option.setName("user").setDescription("The user to check rank for").setRequired(false))

export async function execute(interaction) {
  const targetUser = interaction.options.getUser("user") || interaction.user

  try {
    // Await both promises
    const [userData, rank] = await Promise.all([
      levelSystem.getUserData(interaction.guild.id, targetUser.id),
      levelSystem.getRank(interaction.guild.id, targetUser.id),
    ])

    if (!userData) {
      return interaction.reply({
        content: "Could not fetch user data. Please try again.",
        flags: ["Ephemeral"],
      })
    }

    const nextLevelXP = levelSystem.calculateXPForLevel(userData.level + 1)
    const currentXP = userData.xp || 0
    const progress = (currentXP / nextLevelXP) * 100

    // Create progress bar
    const progressBarLength = 20
    const filled = Math.round((progress / 100) * progressBarLength)
    const progressBar = "▰".repeat(filled) + "▱".repeat(progressBarLength - filled)

    const rankEmbed = createEmbed({
      title: `${targetUser.username}'s Rank`,
      description: `Current Level: ${userData.level || 0}`,
      thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
      fields: [
        { name: "Rank", value: `#${rank || "?"}`, inline: true },
        { name: "Total XP", value: currentXP.toString(), inline: true },
        { name: "Level Progress", value: `${Math.round(progress)}%`, inline: true },
        {
          name: "Progress Bar",
          value: `${progressBar}\n${currentXP} / ${nextLevelXP} XP`,
        },
      ],
      footer: { text: "Keep chatting to earn more XP!" },
    })

    await interaction.reply({ embeds: [rankEmbed] })
  } catch (error) {
    console.error("Error in rank command:", error)
    await interaction.reply({
      content: "An error occurred while fetching rank data. Please try again later.",
      flags: ["Ephemeral"],
    })
  }
}

