import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { currencySystem } from "../../utils/currency.js"

export const data = new SlashCommandBuilder()
  .setName("give")
  .setDescription("Give money to another user")
  .addUserOption((option) => option.setName("target").setDescription("The user to give money to").setRequired(true))
  .addIntegerOption((option) =>
    option.setName("amount").setDescription("Amount to give").setRequired(true).setMinValue(1),
  )

export async function execute(interaction) {
  const target = interaction.options.getUser("target")
  const amount = interaction.options.getInteger("amount")

  if (target.id === interaction.user.id) {
    return interaction.reply({
      content: "You can't give money to yourself!",
      flags: ["Ephemeral"],
    })
  }

  if (target.bot) {
    return interaction.reply({
      content: "You can't give money to bots!",
      flags: ["Ephemeral"],
    })
  }

  const success = await currencySystem.transfer(interaction.guild.id, interaction.user.id, target.id, amount)

  if (!success) {
    const errorEmbed = createEmbed({
      title: "Transfer Failed",
      description: `You don't have enough money! You need ${currencySystem.formatBalance(amount)}`,
      color: "#FF0000",
    })
    return interaction.reply({ embeds: [errorEmbed], flags: ["Ephemeral"] })
  }

  const transferEmbed = createEmbed({
    title: "💝 Gift Sent!",
    description: `**${interaction.user.username}** sent a gift to **${target.username}**!`,
    fields: [
      {
        name: "🎁 Amount Gifted",
        value: `${currencySystem.formatBalance(amount)}`,
        inline: true,
      },
      {
        name: "🏦 New Balance",
        value: `${currencySystem.formatBalance(currencySystem.getBalance(interaction.guild.id, interaction.user.id))}`,
        inline: true,
      },
      {
        name: "💝 Message",
        value: "Thank you for being awesome!",
      },
    ],
    color: "#FF69B4", // Hot Pink
    thumbnail: "https://i.imgur.com/6NKqNB3.png", // Gift image
    footer: { text: "💖 Sharing is caring!" },
  })

  await interaction.reply({ embeds: [transferEmbed] })
}

