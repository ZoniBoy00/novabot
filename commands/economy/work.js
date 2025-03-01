import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { currencySystem } from "../../utils/currency.js"

export const data = new SlashCommandBuilder().setName("work").setDescription("Work to earn some money")

const jobs = [
  { name: "🖥️ Programmer", pay: [100, 200] }, // Reduced from [300, 500]
  { name: "🎨 Artist", pay: [75, 150] }, // Reduced from [200, 400]
  { name: "👨‍🍳 Chef", pay: [80, 160] }, // Reduced from [250, 450]
  { name: "🎮 Game Tester", pay: [50, 100] }, // Reduced from [150, 350]
  { name: "📦 Delivery Driver", pay: [70, 140] }, // Reduced from [200, 400]
  { name: "🌿 Gardener", pay: [60, 120] }, // Reduced from [150, 300]
  { name: "📱 Social Media Manager", pay: [90, 180] }, // Reduced from [250, 450]
  { name: "🎥 Content Creator", pay: [100, 200] }, // Reduced from [300, 500]
]

export async function execute(interaction) {
  const cooldownCheck = await currencySystem.checkCooldown(interaction.guild.id, interaction.user.id, "Work")

  if (cooldownCheck.onCooldown) {
    const timeLeft = Math.ceil(cooldownCheck.timeLeft / 1000)
    const errorEmbed = createEmbed({
      title: "Work - Cooldown",
      description: `You're still tired from your last shift! You can work again <t:${Math.floor(
        Date.now() / 1000 + timeLeft,
      )}:R>`,
      color: "#FF0000",
    })
    return interaction.reply({ embeds: [errorEmbed], flags: ["Ephemeral"] })
  }

  const job = jobs[Math.floor(Math.random() * jobs.length)]
  const pay = Math.floor(Math.random() * (job.pay[1] - job.pay[0] + 1)) + job.pay[0]
  const newBalance = await currencySystem.addBalance(interaction.guild.id, interaction.user.id, pay)

  const workEmbed = createEmbed({
    title: `💼 Work Complete!`,
    description: `**${interaction.user.username}** worked hard as a ${job.name}`,
    fields: [
      {
        name: "💰 Earnings",
        value: `${currencySystem.formatBalance(pay)}`,
        inline: true,
      },
      {
        name: "🏦 New Balance",
        value: `${currencySystem.formatBalance(newBalance)}`,
        inline: true,
      },
      {
        name: "⏰ Next Shift",
        value: `You can work again <t:${Math.floor(Date.now() / 1000 + 30 * 60)}:R>`,
      },
      {
        name: "💡 Tip",
        value: "Want passive income? Check out `/shop` to start a business!",
      },
    ],
    color: "#4169E1",
    thumbnail: interaction.user.displayAvatarURL({ dynamic: true }),
    footer: { text: "💪 Keep working to earn more rewards!" },
  })

  await interaction.reply({ embeds: [workEmbed] })
}

