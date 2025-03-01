import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { businesses, calculateUpgradeCost, calculateIncome } from "../../utils/businessConfig.js"
import { currencySystem } from "../../utils/currency.js"

export const data = new SlashCommandBuilder()
  .setName("upgrade")
  .setDescription("Upgrade one of your businesses")
  .addStringOption((option) =>
    option
      .setName("business")
      .setDescription("The business to upgrade")
      .setRequired(true)
      .addChoices(
        ...Object.entries(businesses).map(([id, business]) => ({
          name: business.name,
          value: id,
        })),
      ),
  )

export async function execute(interaction) {
  const businessId = interaction.options.getString("business")
  const business = businesses[businessId]

  if (!business) {
    return interaction.reply({
      content: "Invalid business type!",
      flags: ["Ephemeral"],
    })
  }

  const userData = await currencySystem.getUserData(interaction.guild.id, interaction.user.id)
  const existingBusiness = userData.businesses.find((b) => b.type === businessId)

  if (!existingBusiness) {
    return interaction.reply({
      content: `You don't own a ${business.name}! Use \`/buy\` to purchase it first.`,
      flags: ["Ephemeral"],
    })
  }

  const upgradeCost = calculateUpgradeCost(businessId, existingBusiness.level + 1)
  if (userData.balance < upgradeCost) {
    return interaction.reply({
      content: `You need ${upgradeCost.toLocaleString()} coins to upgrade this business!`,
      flags: ["Ephemeral"],
    })
  }

  // Upgrade the business
  userData.balance -= upgradeCost
  existingBusiness.level += 1
  await userData.save()

  const currentIncome = calculateIncome(businessId, existingBusiness.level)
  const previousIncome = calculateIncome(businessId, existingBusiness.level - 1)

  const upgradeEmbed = createEmbed({
    title: "🔨 Business Upgraded!",
    description: `Your ${business.name} is now level ${existingBusiness.level}!`,
    fields: [
      {
        name: "💰 Upgrade Cost",
        value: `${upgradeCost.toLocaleString()} coins`,
        inline: true,
      },
      {
        name: "📈 Income Increase",
        value: `${previousIncome.toLocaleString()} → ${currentIncome.toLocaleString()} coins`,
        inline: true,
      },
      {
        name: "⭐ New Level",
        value: `Level ${existingBusiness.level}`,
        inline: true,
      },
      {
        name: "🏦 Remaining Balance",
        value: `${userData.balance.toLocaleString()} coins`,
      },
    ],
    color: "#4169E1",
    footer: { text: "💡 Higher levels mean more income!" },
  })

  await interaction.reply({ embeds: [upgradeEmbed] })
}

