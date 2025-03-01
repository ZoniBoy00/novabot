import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { currencySystem } from "../../utils/currency.js"

export const data = new SlashCommandBuilder()
  .setName("rob")
  .setDescription("Attempt to rob another user")
  .addUserOption((option) => option.setName("target").setDescription("The user to rob").setRequired(true))

export async function execute(interaction) {
  const target = interaction.options.getUser("target")

  if (target.id === interaction.user.id) {
    return interaction.reply({
      content: "You can't rob yourself!",
      flags: ["Ephemeral"],
    })
  }

  if (target.bot) {
    return interaction.reply({
      content: "You can't rob bots!",
      flags: ["Ephemeral"],
    })
  }

  const cooldownCheck = await currencySystem.checkCooldown(interaction.guild.id, interaction.user.id, "Rob")

  if (cooldownCheck.onCooldown) {
    const timeLeft = Math.ceil(cooldownCheck.timeLeft / 1000)
    const errorEmbed = createEmbed({
      title: "Rob - Cooldown",
      description: `You're still laying low! You can rob again <t:${Math.floor(Date.now() / 1000 + timeLeft)}:R>`,
      color: "#FF0000",
    })
    return interaction.reply({ embeds: [errorEmbed], ephemeral: true })
  }

  const targetBalance = currencySystem.getBalance(interaction.guild.id, target.id)
  const robberBalance = currencySystem.getBalance(interaction.guild.id, interaction.user.id)

  if (targetBalance < 100) {
    return interaction.reply({
      content: "This user doesn't have enough money to rob!",
      flags: ["Ephemeral"],
    })
  }

  if (robberBalance < 1000) {
    return interaction.reply({
      content: "You need at least 1,000 coins to attempt a robbery!",
      flags: ["Ephemeral"],
    })
  }

  const success = Math.random() < 0.4 // 40% success rate
  let amount

  if (success) {
    amount = Math.floor(Math.random() * Math.min(targetBalance * 0.3, 5000))
    await currencySystem.transfer(interaction.guild.id, target.id, interaction.user.id, amount)

    const successEmbed = createEmbed({
      title: "🦹 Heist Successful!",
      description: `**${interaction.user.username}** pulled off the perfect crime!`,
      fields: [
        {
          name: "🎯 Target",
          value: `${target.username}`,
          inline: true,
        },
        {
          name: "💰 Stolen",
          value: `${currencySystem.formatBalance(amount)}`,
          inline: true,
        },
        {
          name: "🏦 New Balance",
          value: `${currencySystem.formatBalance(currencySystem.getBalance(interaction.guild.id, interaction.user.id))}`,
        },
      ],
      color: "#32CD32",
      thumbnail: "https://i.imgur.com/UkUJ5Nb.png", // Thief image
      footer: { text: "🕵️ Lay low for an hour before your next heist!" },
    })

    await interaction.reply({ embeds: [successEmbed] })
  } else {
    amount = Math.floor(Math.random() * 1000) + 500
    await currencySystem.removeBalance(interaction.guild.id, interaction.user.id, amount)

    const failEmbed = createEmbed({
      title: "🚔 Busted!",
      description: `**${interaction.user.username}** got caught in the act!`,
      fields: [
        {
          name: "🎯 Failed Target",
          value: `${target.username}`,
          inline: true,
        },
        {
          name: "💸 Fine Paid",
          value: `${currencySystem.formatBalance(amount)}`,
          inline: true,
        },
        {
          name: "🏦 New Balance",
          value: `${currencySystem.formatBalance(currencySystem.getBalance(interaction.guild.id, interaction.user.id))}`,
        },
      ],
      color: "#FF4500",
      thumbnail: "https://i.imgur.com/YZ5RQeG.png", // Police image
      footer: { text: "👮 Maybe try earning money legally next time?" },
    })

    await interaction.reply({ embeds: [failEmbed] })
  }
}

