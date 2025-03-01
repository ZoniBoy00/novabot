import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { currencySystem } from "../../utils/currency.js"

export const data = new SlashCommandBuilder()
  .setName("coinflip")
  .setDescription("Flip a coin and bet on the outcome")
  .addStringOption((option) =>
    option
      .setName("choice")
      .setDescription("Choose heads or tails")
      .setRequired(true)
      .addChoices({ name: "Heads", value: "heads" }, { name: "Tails", value: "tails" }),
  )
  .addIntegerOption((option) =>
    option.setName("bet").setDescription("Amount to bet").setRequired(true).setMinValue(10).setMaxValue(25000),
  )

export async function execute(interaction) {
  const choice = interaction.options.getString("choice")
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

  const result = Math.random() < 0.5 ? "heads" : "tails"
  const won = choice === result

  if (won) {
    await currencySystem.addBalance(interaction.guild.id, interaction.user.id, bet * 2)
  }

  const flipEmbed = createEmbed({
    title: "🪙 Coin Flip Challenge",
    description: `**${interaction.user.username}** flipped a coin!`,
    fields: [
      {
        name: "👉 Your Choice",
        value: `${choice === "heads" ? "Heads 🌕" : "Tails 🌑"}`,
        inline: true,
      },
      {
        name: "🎲 Result",
        value: `${result === "heads" ? "Heads 🌕" : "Tails 🌑"}`,
        inline: true,
      },
      {
        name: won ? "🌟 Winner!" : "❌ Not Quite!",
        value: won
          ? `Congratulations! You won ${currencySystem.formatBalance(bet)}!`
          : `You lost ${currencySystem.formatBalance(bet)}!`,
      },
      {
        name: "💰 Balance",
        value: `New balance: ${currencySystem.formatBalance(currencySystem.getBalance(interaction.guild.id, interaction.user.id))}`,
      },
    ],
    color: won ? "#32CD32" : "#FF4500",
    thumbnail: "https://i.imgur.com/7P6dxhB.png", // Coin image
    footer: { text: "🎮 Double or nothing? Try again!" },
  })

  await interaction.reply({ embeds: [flipEmbed] })
}

