import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { businesses, calculateUpgradeCost } from "../../utils/businessConfig.js"

export const data = new SlashCommandBuilder().setName("shop").setDescription("View available businesses to purchase")

export async function execute(interaction) {
  const shopEmbed = createEmbed({
    title: "🏪 Business Shop",
    description: "Invest in businesses to earn passive income!",
    fields: Object.entries(businesses).map(([id, business]) => ({
      name: business.name,
      value: `${business.description}
💰 Cost: ${calculateUpgradeCost(id, 1).toLocaleString()} coins
💵 Income: ${business.baseIncome.toLocaleString()} coins / collection
⏰ Collection: Every ${business.cooldown / (60 * 1000)} minutes

Use \`/buy ${id}\` to purchase!`,
    })),
    color: "#FFD700",
    footer: { text: "💡 Tip: Start with a Lemonade Stand and work your way up!" },
  })

  await interaction.reply({ embeds: [shopEmbed] })
}

