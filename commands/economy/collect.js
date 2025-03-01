import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { businesses, calculateIncome } from "../../utils/businessConfig.js"
import { currencySystem } from "../../utils/currency.js"

export const data = new SlashCommandBuilder().setName("collect").setDescription("Collect income from your businesses")

export async function execute(interaction) {
  const userData = await currencySystem.getUserData(interaction.guild.id, interaction.user.id)

  if (!userData.businesses || userData.businesses.length === 0) {
    return interaction.reply({
      content: "You don't own any businesses yet! Use `/shop` to view available businesses.",
      flags: ["Ephemeral"],
    })
  }

  let totalCollected = 0
  const collectionDetails = []
  const now = new Date()

  for (const business of userData.businesses) {
    const businessConfig = businesses[business.type]
    const timeSinceLastCollection = now.getTime() - business.lastCollected.getTime()
    const collectionsAvailable = Math.floor(timeSinceLastCollection / businessConfig.cooldown)

    if (collectionsAvailable > 0) {
      const income = calculateIncome(business.type, business.level) * collectionsAvailable
      totalCollected += income
      business.lastCollected = now
      collectionDetails.push({
        name: businessConfig.name,
        income,
        collections: collectionsAvailable,
        level: business.level,
      })
    }
  }

  if (totalCollected === 0) {
    const nextCollection = Math.min(
      ...userData.businesses.map((b) => {
        const cooldown = businesses[b.type].cooldown
        const timeSinceLastCollection = now.getTime() - b.lastCollected.getTime()
        return cooldown - timeSinceLastCollection
      }),
    )

    return interaction.reply({
      content: `No income to collect yet! Next collection available <t:${Math.floor(
        (Date.now() + nextCollection) / 1000,
      )}:R>`,
      flags: ["Ephemeral"],
    })
  }

  userData.balance += totalCollected
  await userData.save()

  const collectEmbed = createEmbed({
    title: "💰 Income Collected!",
    description: `You collected income from your businesses!`,
    fields: [
      ...collectionDetails.map((detail) => ({
        name: `${detail.name} (Level ${detail.level})`,
        value: `Collected ${detail.income.toLocaleString()} coins (${detail.collections}x)`,
        inline: true,
      })),
      {
        name: "💵 Total Collected",
        value: `${totalCollected.toLocaleString()} coins`,
      },
      {
        name: "🏦 New Balance",
        value: `${userData.balance.toLocaleString()} coins`,
      },
    ],
    color: "#32CD32",
    footer: { text: "💡 Upgrade your businesses to earn more!" },
  })

  await interaction.reply({ embeds: [collectEmbed] })
}

