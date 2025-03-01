import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { currencySystem } from "../../utils/currency.js"

export const data = new SlashCommandBuilder()
  .setName("balance")
  .setDescription("Check your or another user's balance")
  .addUserOption((option) => option.setName("user").setDescription("The user to check balance for").setRequired(false))

export async function execute(interaction) {
  const targetUser = interaction.options.getUser("user") || interaction.user

  try {
    const [balance, rank] = await Promise.all([
      currencySystem.getBalance(interaction.guild.id, targetUser.id),
      currencySystem.getRank(interaction.guild.id, targetUser.id),
    ])

    const balanceEmbed = createEmbed({
      title: `🏦 ${targetUser.username}'s Wallet`,
      description: `View your balance, earn daily rewards, and play games to earn more!`,
      fields: [
        {
          name: "💰 Current Balance",
          value: `${currencySystem.formatBalance(balance)}`,
          inline: true,
        },
        {
          name: "🏆 Rank",
          value: rank ? `#${rank}` : "N/A",
          inline: true,
        },
        {
          name: "💫 Quick Actions",
          value: `• \`/daily\` - Claim daily rewards
• \`/work\` - Work for money
• \`/slots\` - Try your luck!`,
        },
      ],
      thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
      color: "#FFD700", // Gold color
      footer: { text: "💡 Tip: Use /daily to get free daily rewards!" },
    })

    await interaction.reply({ embeds: [balanceEmbed] })
  } catch (error) {
    console.error("Error in balance command:", error)
    await interaction.reply({
      content: "An error occurred while fetching the balance. Please try again later.",
      flags: ["Ephemeral"],
    })
  }
}

