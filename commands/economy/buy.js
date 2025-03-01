import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { businesses, calculateUpgradeCost } from "../../utils/businessConfig.js"
import { currencySystem } from "../../utils/currency.js"

export const data = new SlashCommandBuilder()
  .setName("buy")
  .setDescription("Purchase a business")
  .addStringOption((option) =>
    option
      .setName("business")
      .setDescription("The business to purchase")
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

  if (existingBusiness) {
    return interaction.reply({
      content: "You already own this business! Use `/upgrade` to improve it.",
      flags: ["Ephemeral"],
    })
  }

  const cost = calculateUpgradeCost(businessId, 1)
  if (userData.balance < cost) {
    return interaction.reply({
      content: `You need ${cost.toLocaleString()} coins to buy this business!`,
      flags: ["Ephemeral"],
    })
  }

  // Purchase the business
  userData.balance -= cost
  userData.businesses.push({
    type: businessId,
    level: 1,
    lastCollected: new Date(),
  })
  await userData.save()

  const purchaseEmbed = createEmbed({
    title: "🎉 Business Purchased!",
    description: `You are now the proud owner of a ${business.name}!`,
    fields: [
      {
        name: "💰 Purchase Cost",
        value: `${cost.toLocaleString()} coins`,
        inline: true,
      },
      {
        name: "💵 Income",
        value: `${business.baseIncome.toLocaleString()} coins / collection`,
        inline: true,
      },
      {
        name: "⏰ Collection Time",
        value: `Every ${business.cooldown / (60 * 1000)} minutes`,
      },
      {
        name: "🏦 Remaining Balance",
        value: `${userData.balance.toLocaleString()} coins`,
      },
    ],
    color: "#32CD32",
    footer: { text: "💡 Use /collect to gather income from your businesses!" },
  })

  await interaction.reply({ embeds: [purchaseEmbed] })
}

