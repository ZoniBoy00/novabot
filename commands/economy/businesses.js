import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { businesses, calculateIncome } from "../../utils/businessConfig.js"
import { currencySystem } from "../../utils/currency.js"

export const data = new SlashCommandBuilder()
  .setName("businesses")
  .setDescription("View your owned businesses")
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to check businesses for").setRequired(false),
  )

export async function execute(interaction) {
  const target = interaction.options.getUser("user") || interaction.user
  const userData = await currencySystem.getUserData(interaction.guild.id, target.id)

  if (!userData.businesses || userData.businesses.length === 0) {
    const noBusinessEmbed = createEmbed({
      title: "🏪 No Businesses",
      description:
        target.id === interaction.user.id
          ? "You don't own any businesses yet! Use `/shop` to view available businesses."
          : `${target.username} doesn't own any businesses yet!`,
      color: "#FF0000",
      footer: { text: "💡 Start with a Lemonade Stand to begin your empire!" },
    })
    return interaction.reply({ embeds: [noBusinessEmbed] })
  }

  const now = new Date()
  let totalValue = 0
  let hourlyIncome = 0

  const businessFields = userData.businesses.map((business) => {
    const config = businesses[business.type]
    const income = calculateIncome(business.type, business.level)
    const hourly = (3600000 / config.cooldown) * income
    hourlyIncome += hourly

    const timeUntilCollection = Math.max(0, config.cooldown - (now.getTime() - business.lastCollected.getTime()))

    const value = calculateIncome(business.type, business.level) * 10 // Rough business value estimation
    totalValue += value

    return {
      name: `${config.name} (Level ${business.level})`,
      value: `💵 Income: ${income.toLocaleString()} coins / collection
⏰ Collection: Every ${config.cooldown / (60 * 1000)} minutes
📈 Hourly: ~${hourly.toLocaleString()} coins
🕒 Next collection: ${
        timeUntilCollection > 0
          ? `<t:${Math.floor((now.getTime() + timeUntilCollection) / 1000)}:R>`
          : "Ready to collect!"
      }`,
    }
  })

  const businessEmbed = createEmbed({
    title: `🏢 ${target.username}'s Business Empire`,
    description: `Managing ${userData.businesses.length} business${userData.businesses.length > 1 ? "es" : ""}!`,
    fields: [
      {
        name: "📊 Empire Statistics",
        value: `Total Businesses: ${userData.businesses.length}
Estimated Value: ${totalValue.toLocaleString()} coins
Hourly Income: ~${hourlyIncome.toLocaleString()} coins`,
      },
      ...businessFields,
    ],
    color: "#4169E1",
    thumbnail: target.displayAvatarURL({ dynamic: true }),
    footer: { text: "💡 Use /collect to gather income from your businesses!" },
  })

  await interaction.reply({ embeds: [businessEmbed] })
}

