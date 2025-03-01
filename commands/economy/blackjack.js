import { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { currencySystem } from "../../utils/currency.js"

export const data = new SlashCommandBuilder()
  .setName("blackjack")
  .setDescription("Play a game of blackjack")
  .addIntegerOption((option) =>
    option.setName("bet").setDescription("Amount to bet").setRequired(true).setMinValue(100).setMaxValue(100000),
  )

const suits = ["♠️", "♥️", "♦️", "♣️"]
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

class BlackjackGame {
  constructor() {
    this.deck = this.createDeck()
    this.playerHand = []
    this.dealerHand = []
  }

  createDeck() {
    const deck = []
    for (const suit of suits) {
      for (const value of values) {
        deck.push({ suit, value })
      }
    }
    return this.shuffle(deck)
  }

  shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }
    return deck
  }

  drawCard() {
    return this.deck.pop()
  }

  calculateHand(hand) {
    let value = 0
    let aces = 0

    for (const card of hand) {
      if (card.value === "A") {
        aces++
      } else if (["K", "Q", "J"].includes(card.value)) {
        value += 10
      } else {
        value += Number.parseInt(card.value)
      }
    }

    for (let i = 0; i < aces; i++) {
      if (value + 11 <= 21) {
        value += 11
      } else {
        value += 1
      }
    }

    return value
  }

  formatHand(hand, hidden = false) {
    if (hidden) {
      return `${hand[0].value}${hand[0].suit} | ?️?`
    }
    return hand.map((card) => `${card.value}${card.suit}`).join(" | ")
  }

  async dealInitialCards() {
    this.playerHand = [this.drawCard(), this.drawCard()]
    this.dealerHand = [this.drawCard(), this.drawCard()]
  }
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

  const game = new BlackjackGame()
  await game.dealInitialCards()

  const hitButton = new ButtonBuilder().setCustomId("bj-hit").setLabel("Hit").setStyle(ButtonStyle.Primary)

  const standButton = new ButtonBuilder().setCustomId("bj-stand").setLabel("Stand").setStyle(ButtonStyle.Secondary)

  const row = new ActionRowBuilder().addComponents(hitButton, standButton)

  const gameEmbed = createEmbed({
    title: "♠️ Blackjack Table ♣️",
    description: `**${interaction.user.username}'s Game**\nBet: ${currencySystem.formatBalance(bet)}`,
    fields: [
      {
        name: "🎭 Dealer's Hand",
        value: `\`${game.formatHand(game.dealerHand, true)}\`\nValue: ?`,
      },
      {
        name: "👤 Your Hand",
        value: `\`${game.formatHand(game.playerHand)}\`\nValue: ${game.calculateHand(game.playerHand)}`,
      },
    ],
    color: "#2E8B57", // Sea Green
    thumbnail: "https://i.imgur.com/jDZpBTX.png", // Cards image
    footer: { text: "🎮 Hit or Stand?" },
  })

  const response = await interaction.reply({
    embeds: [gameEmbed],
    components: [row],
    fetchReply: true,
  })

  const filter = (i) => i.user.id === interaction.user.id && i.customId.startsWith("bj-")
  const collector = response.createMessageComponentCollector({ filter, time: 30000 })

  collector.on("collect", async (i) => {
    if (i.customId === "bj-hit") {
      game.playerHand.push(game.drawCard())
      const playerValue = game.calculateHand(game.playerHand)

      if (playerValue > 21) {
        await currencySystem.removeBalance(interaction.guild.id, interaction.user.id, bet)
        const bustEmbed = createEmbed({
          title: "💥 Blackjack - Bust!",
          description: `**${interaction.user.username}** went over 21!`,
          fields: [
            {
              name: "🎭 Dealer's Hand",
              value: `\`${game.formatHand(game.dealerHand)}\`\nValue: ${game.calculateHand(game.dealerHand)}`,
            },
            {
              name: "👤 Your Hand",
              value: `\`${game.formatHand(game.playerHand)}\`\nValue: ${playerValue}`,
            },
            {
              name: "💸 Outcome",
              value: `You lost ${currencySystem.formatBalance(bet)}!`,
            },
          ],
          color: "#FF4500", // Orange Red
          thumbnail: interaction.user.displayAvatarURL({ dynamic: true }),
          footer: { text: "🎮 Better luck next time!" },
        })
        collector.stop()
        await i.update({ embeds: [bustEmbed], components: [] })
      } else {
        const newEmbed = createEmbed({
          title: "Blackjack",
          description: `Bet: ${currencySystem.formatBalance(bet)}

Dealer's Hand: ${game.formatHand(game.dealerHand, true)}
Value: ?

Your Hand: ${game.formatHand(game.playerHand)}
Value: ${playerValue}`,
          footer: { text: "Hit or Stand?" },
        })
        await i.update({ embeds: [newEmbed], components: [row] })
      }
    } else if (i.customId === "bj-stand") {
      let dealerValue = game.calculateHand(game.dealerHand)
      while (dealerValue < 17) {
        game.dealerHand.push(game.drawCard())
        dealerValue = game.calculateHand(game.dealerHand)
      }

      const playerValue = game.calculateHand(game.playerHand)
      let result
      let color
      let balanceChange

      if (dealerValue > 21 || playerValue > dealerValue) {
        result = "You win!"
        color = "#00FF00"
        balanceChange = bet
        await currencySystem.addBalance(interaction.guild.id, interaction.user.id, bet * 2)
      } else if (dealerValue > playerValue) {
        result = "Dealer wins!"
        color = "#FF0000"
        balanceChange = -bet
        await currencySystem.removeBalance(interaction.guild.id, interaction.user.id, bet)
      } else {
        result = "Push!"
        color = "#FFFF00"
        balanceChange = 0
        await currencySystem.addBalance(interaction.guild.id, interaction.user.id, bet)
      }

      const finalEmbed = createEmbed({
        title: `${result === "You win!" ? "🎉" : result === "Push!" ? "🤝" : "💔"} Blackjack - ${result}`,
        description: `**${interaction.user.username}'s** game has ended!`,
        fields: [
          {
            name: "🎭 Dealer's Hand",
            value: `\`${game.formatHand(game.dealerHand)}\`\nValue: ${dealerValue}`,
          },
          {
            name: "👤 Your Hand",
            value: `\`${game.formatHand(game.playerHand)}\`\nValue: ${playerValue}`,
          },
          {
            name: "💰 Outcome",
            value: `${balanceChange > 0 ? "Won" : balanceChange < 0 ? "Lost" : "Returned"}: ${currencySystem.formatBalance(Math.abs(balanceChange))}`,
          },
        ],
        color: result === "You win!" ? "#32CD32" : result === "Push!" ? "#FFD700" : "#FF4500",
        thumbnail: interaction.user.displayAvatarURL({ dynamic: true }),
        footer: { text: "🎮 Play again with /blackjack!" },
      })

      collector.stop()
      await i.update({ embeds: [finalEmbed], components: [] })
    }
  })

  collector.on("end", async (collected, reason) => {
    if (reason === "time") {
      const timeoutEmbed = createEmbed({
        title: "Blackjack - Timeout",
        description: "Game cancelled due to inactivity.",
        color: "#FF0000",
      })
      await interaction.editReply({
        embeds: [timeoutEmbed],
        components: [],
      })
      await currencySystem.addBalance(interaction.guild.id, interaction.user.id, bet)
    }
  })
}

