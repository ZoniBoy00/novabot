import { Events } from "discord.js"
import { levelSystem } from "../utils/levels.js"
import { createEmbed } from "../utils/embedBuilder.js"

export const name = Events.MessageCreate
export const once = false

const XP_COOLDOWN = new Map()
const COOLDOWN_DURATION = 60000 // 1 minute cooldown
const MIN_XP = 15
const MAX_XP = 25

export async function execute(message) {
  // Ignore bots and non-guild messages
  if (message.author.bot || !message.guild) return

  // Check cooldown
  const userCooldown = XP_COOLDOWN.get(message.author.id)
  if (userCooldown && Date.now() - userCooldown < COOLDOWN_DURATION) return

  // Generate random XP
  const xpToAdd = Math.floor(Math.random() * (MAX_XP - MIN_XP + 1)) + MIN_XP

  // Add XP and check for level up
  const result = await levelSystem.addXP(message.guild.id, message.author.id, xpToAdd)

  // Set cooldown
  XP_COOLDOWN.set(message.author.id, Date.now())

  // If user leveled up, send notification
  if (result.leveledUp) {
    const levelUpEmbed = createEmbed({
      title: "🎉 Level Up!",
      description: `Congratulations ${message.author}! You've reached level ${result.newLevel}!`,
      color: "#00FF00",
      thumbnail: message.author.displayAvatarURL({ dynamic: true }),
    })

    await message.channel.send({ embeds: [levelUpEmbed] })
  }
}

