import { PermissionFlagsBits } from "discord.js"
import { createEmbed } from "./embedBuilder.js"
import { log } from "./logger.js"

export class AutomodManager {
  constructor(client) {
    this.client = client
    this.spamThreshold = 5 // Messages
    this.spamInterval = 5000 // 5 seconds
    this.duplicateThreshold = 3 // Duplicate messages
    this.mentionLimit = 5 // Mentions per message
    this.inviteRegex = /discord(?:\.gg|\.com\/invite)/i
    this.spamMap = new Map()
    this.duplicateMap = new Map()
  }

  async handleMessage(message) {
    // Ignore bots and users with MANAGE_MESSAGES permission
    if (message.author.bot || message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return
    }

    try {
      const violations = []

      // Check for spam
      if (await this.isSpamming(message)) {
        violations.push("Message spam detected")
      }

      // Check for duplicate messages
      if (await this.isDuplicateMessage(message)) {
        violations.push("Duplicate message detected")
      }

      // Check for mention spam
      if (await this.hasMentionSpam(message)) {
        violations.push("Mention spam detected")
      }

      // Check for invite links
      if (await this.hasInviteLink(message)) {
        violations.push("Discord invite link detected")
      }

      // Check for banned words
      const bannedWords = await this.checkBannedWords(message)
      if (bannedWords.length > 0) {
        violations.push(`Banned words detected: ${bannedWords.join(", ")}`)
      }

      // If there are violations, take action
      if (violations.length > 0) {
        await this.handleViolations(message, violations)
      }
    } catch (error) {
      log(`Error in automod: ${error}`, "error")
    }
  }

  async isSpamming(message) {
    const key = `${message.author.id}-${message.channel.id}`
    const now = Date.now()

    if (!this.spamMap.has(key)) {
      this.spamMap.set(key, [])
    }

    const userMessages = this.spamMap.get(key)
    userMessages.push(now)

    // Remove messages outside the time window
    const recentMessages = userMessages.filter((timestamp) => now - timestamp < this.spamInterval)
    this.spamMap.set(key, recentMessages)

    return recentMessages.length >= this.spamThreshold
  }

  async isDuplicateMessage(message) {
    const key = `${message.author.id}-${message.channel.id}`
    const content = message.content.toLowerCase()

    if (!this.duplicateMap.has(key)) {
      this.duplicateMap.set(key, [])
    }

    const userMessages = this.duplicateMap.get(key)
    const duplicateCount = userMessages.filter((msg) => msg === content).length

    userMessages.push(content)
    if (userMessages.length > 10) userMessages.shift() // Keep last 10 messages

    return duplicateCount >= this.duplicateThreshold
  }

  async hasMentionSpam(message) {
    const mentions = message.mentions.users.size + message.mentions.roles.size
    return mentions > this.mentionLimit
  }

  async hasInviteLink(message) {
    return this.inviteRegex.test(message.content)
  }

  async checkBannedWords(message) {
    // Get banned words from database or config
    const bannedWords = ["badword1", "badword2"] // Example
    const content = message.content.toLowerCase()
    return bannedWords.filter((word) => content.includes(word.toLowerCase()))
  }

  async handleViolations(message, violations) {
    try {
      // Delete the message
      await message.delete()

      // Create warning embed
      const warningEmbed = createEmbed({
        title: "⚠️ Automod Warning",
        description: `${message.author}, your message was removed for the following violations:
${violations.map((v) => `• ${v}`).join("\n")}`,
        color: "#ff9900",
      })

      // Send warning to user
      const warnMsg = await message.channel.send({
        embeds: [warningEmbed],
      })
      setTimeout(() => warnMsg.delete(), 5000) // Delete after 5 seconds

      // Log the violation
      const logEmbed = createEmbed({
        title: "🤖 Automod Action",
        description: "Message removed due to automod violations",
        fields: [
          {
            name: "User",
            value: `${message.author.tag} (${message.author.id})`,
          },
          { name: "Channel", value: `${message.channel.name}` },
          { name: "Violations", value: violations.join("\n") },
          {
            name: "Message Content",
            value: message.content || "(no content)",
          },
        ],
        color: "#ff0000",
      })

      // Get log channel
      const logChannel = message.guild.channels.cache.find((channel) => channel.name === "mod-logs")
      if (logChannel) {
        await logChannel.send({ embeds: [logEmbed] })
      }

      // Update user warnings in database
      // Add implementation for tracking warnings
    } catch (error) {
      log(`Error handling automod violations: ${error}`, "error")
    }
  }

  // Add methods for configuring automod settings
  async updateSettings(guild, settings) {
    // Implementation for updating automod settings
    // Store in database
  }

  async getSettings(guild) {
    // Implementation for retrieving automod settings
    // Get from database
  }
}

