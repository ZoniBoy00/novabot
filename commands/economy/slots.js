import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { currencySystem } from "../../utils/currency.js"

export const data = new SlashCommandBuilder()
  .setName("slots")
  .setDescription("Try your luck with the slot machine")
  .addIntegerOption((option) =>
    option.setName("bet").setDescription("Amount to bet").setRequired(true).setMinValue(50).setMaxValue(50000),
  )

const symbols = ["🍎", "🍊", "🍇", "🍒", "💎", "7️⃣", "🌟"]
const multipliers = {
  "7️⃣7️⃣7️⃣": 10,
  "💎💎💎": 7,
  "🌟🌟🌟": 5,
  "🍒🍒🍒": 4,
  "🍇🍇🍇": 3,
  "🍊🍊🍊": 2,
  "🍎🍎🍎": 2,
}

export async function execute(interaction) {
  const bet = interaction.options.getInteger("bet")
  const balance = currencySystem.getBalance(interaction.guild.id, interaction.user.id)

  if (balance < bet) {
    const errorEmbed = createEmbed({
      title: "Insufficient Funds",
      description: `You need ${currencySystem.formatBalance(bet)} to play, but you only have ${currencySystem.formatBalance(balance)}`,
      color: "#FF0000",
    })
    return interaction.reply({ embeds: [errorEmbed], flags: ["Ephemeral"] })
  }

  await currencySystem.removeBalance(interaction.guild.id, interaction.user.id, bet)

  const result = Array(3)
    .fill(0)
    .map(() => symbols[Math.floor(Math.random() * symbols.length)])

  const resultString = result.join("")
  let multiplier = 0
  let won = false

  // Check for wins
  if (result[0] === result[1] && result[1] === result[2]) {
    multiplier = multipliers[resultString] || 0
    won = true
  }

  const winnings = bet * multiplier
  if (won) {
    await currencySystem.addBalance(interaction.guild.id, interaction.user.id, winnings)
  }

  const spinEmbed = createEmbed({
    title: "🎰 Lucky Slots Machine",
    description: `**${interaction.user.username}** pulled the lever!\n${"-".repeat(20)}`,
    fields: [
      {
        name: "🎲 Your Spin",
        value: `┃ ${result[0]} ┃ ${result[1]} ┃ ${result[2]} ┃`,
      },
      {
        name: won ? "🌟 Winner!" : "❌ Not Quite!",
        value: won
          ? `Congratulations! You won ${currencySystem.formatBalance(winnings)}! (${multiplier}x)`
          : "Better luck next time!",
      },
      {
        name: "💰 Balance",
        value: `New balance: ${currencySystem.formatBalance(currencySystem.getBalance(interaction.guild.id, interaction.user.id))}`,
      },
    ],
    color: won ? "#32CD32" : "#FF4500",
    thumbnail: "https://i.imgur.com/mXVoOPm.png", // Slot machine image
    footer: { text: "🎮 Try again with /slots!" },
  })

  await interaction.reply({ embeds: [spinEmbed] })
}

