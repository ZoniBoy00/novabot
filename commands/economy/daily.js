import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { currencySystem } from "../../utils/currency.js"

export const data = new SlashCommandBuilder().setName("daily").setDescription("Claim your daily reward")

export async function execute(interaction) {
  const cooldownCheck = await currencySystem.checkCooldown(interaction.guild.id, interaction.user.id, "Daily")

  if (cooldownCheck.onCooldown) {
    const timeLeft = Math.ceil(cooldownCheck.timeLeft / 1000)
    const errorEmbed = createEmbed({
      title: "Daily Reward - Cooldown",
      description: `You can claim your next daily reward <t:${Math.floor(Date.now() / 1000 + timeLeft)}:R>`,
      color: "#FF0000",
    })
    return interaction.reply({ embeds: [errorEmbed], flags: ["Ephemeral"] })
  }

  const reward = 500 // Reduced from 1000
  const newBalance = await currencySystem.addBalance(interaction.guild.id, interaction.user.id, reward)

  const dailyEmbed = createEmbed({
    title: "🎁 Daily Reward Claimed!",
    description: `**${interaction.user.username}** claimed their daily reward!`,
    fields: [
      {
        name: "💰 Reward Received",
        value: `${currencySystem.formatBalance(reward)}`,
        inline: true,
      },
      {
        name: "🏦 New Balance",
        value: `${currencySystem.formatBalance(newBalance)}`,
        inline: true,
      },
      {
        name: "⏰ Next Reward",
        value: `Come back <t:${Math.floor(Date.now() / 1000 + 24 * 60 * 60)}:R>!`,
      },
      {
        name: "💡 Tip",
        value: "Want to earn more? Start a business with `/shop`!",
      },
    ],
    color: "#32CD32",
    thumbnail: "https://i.imgur.com/Tq7RBn4.png",
    footer: { text: "🎯 Daily Streak: Keep claiming daily rewards!" },
  })

  await interaction.reply({ embeds: [dailyEmbed] })
}

