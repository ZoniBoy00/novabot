import { EmbedBuilder } from "discord.js"
import { log } from "./logger.js"

export class WelcomeManager {
  constructor(client) {
    this.client = client
    this.welcomeMessages = [
      "Welcome {user} to {server}! 🎉",
      "Hey {user}, welcome to {server}! Make yourself at home! 🏠",
      "A wild {user} appeared in {server}! 🌟",
      "{user} just landed in {server}! 🚀",
      "Welcome {user}! We hope you brought pizza! 🍕",
    ]
    this.goodbyeMessages = [
      "Goodbye {user}! We'll miss you! 👋",
      "Sad to see you go, {user}! 😢",
      "{user} has left {server}! Until we meet again! 🌈",
      "Farewell {user}! Thanks for being part of {server}! ⭐",
    ]

    // Try to load canvas if available
    this.hasCanvas = false
    this.initCanvas()
  }

  async initCanvas() {
    try {
      const Canvas = await import("canvas")
      this.Canvas = Canvas
      this.hasCanvas = true

      // Register fonts if canvas is available
      Canvas.registerFont("./assets/fonts/Roboto-Regular.ttf", { family: "Roboto" })
      Canvas.registerFont("./assets/fonts/Roboto-Bold.ttf", { family: "Roboto Bold" })

      log("Canvas initialized successfully", "success")
    } catch (error) {
      log("Canvas not available, falling back to embed-only welcome messages", "warn")
      this.hasCanvas = false
    }
  }

  getRandomMessage(type, replacements) {
    const messages = type === "welcome" ? this.welcomeMessages : this.goodbyeMessages
    let message = messages[Math.floor(Math.random() * messages.length)]

    // Replace placeholders
    for (const [key, value] of Object.entries(replacements)) {
      message = message.replace(`{${key}}`, value)
    }

    return message
  }

  async createWelcomeImage(member) {
    if (!this.hasCanvas) return null

    try {
      const { createCanvas, loadImage } = this.Canvas

      // Create canvas
      const canvas = createCanvas(1024, 450)
      const ctx = canvas.getContext("2d")

      // Draw background
      ctx.fillStyle = "#23272A"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
      gradient.addColorStop(0, "#7289DA")
      gradient.addColorStop(1, "#4E5D94")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, 6)

      // Draw user avatar
      try {
        const avatar = await loadImage(member.user.displayAvatarURL({ format: "png", size: 256 }))
        ctx.save()
        ctx.beginPath()
        ctx.arc(canvas.width / 2, 150, 100, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(avatar, canvas.width / 2 - 100, 50, 200, 200)
        ctx.restore()
      } catch (error) {
        log(`Error loading avatar: ${error}`, "error")
      }

      // Add welcome text
      ctx.font = "bold 60px Roboto Bold"
      ctx.fillStyle = "#ffffff"
      ctx.textAlign = "center"
      ctx.fillText("WELCOME", canvas.width / 2, 300)

      // Add user name
      ctx.font = "40px Roboto"
      ctx.fillText(member.user.tag, canvas.width / 2, 350)

      // Add member count
      ctx.font = "30px Roboto"
      ctx.fillText(`Member #${member.guild.memberCount}`, canvas.width / 2, 400)

      return { attachment: canvas.toBuffer(), name: "welcome.png" }
    } catch (error) {
      log(`Error creating welcome image: ${error}`, "error")
      return null
    }
  }

  async sendWelcomeMessage(member) {
    try {
      // Get welcome channel
      const welcomeChannel = member.guild.channels.cache.find(
        (channel) => channel.name.toLowerCase().includes("welcome") || channel.name.toLowerCase().includes("greetings"),
      )

      if (!welcomeChannel) return false

      // Create welcome embed
      const welcomeEmbed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("👋 New Member!")
        .setDescription(
          this.getRandomMessage("welcome", {
            user: member.toString(),
            server: member.guild.name,
          }),
        )
        .addFields(
          {
            name: "Account Created",
            value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
            inline: true,
          },
          {
            name: "Member Count",
            value: `${member.guild.memberCount}`,
            inline: true,
          },
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()

      // Try to create welcome image if canvas is available
      const welcomeImage = await this.createWelcomeImage(member)
      if (welcomeImage) {
        welcomeEmbed.setImage("attachment://welcome.png")
      }

      // Send the welcome message
      await welcomeChannel.send({
        embeds: [welcomeEmbed],
        files: welcomeImage ? [welcomeImage] : [],
      })

      return true
    } catch (error) {
      log(`Error sending welcome message: ${error}`, "error")
      return false
    }
  }

  async sendGoodbyeMessage(member) {
    try {
      // Get goodbye channel
      const goodbyeChannel = member.guild.channels.cache.find(
        (channel) => channel.name.toLowerCase().includes("goodbye") || channel.name.toLowerCase().includes("farewell"),
      )

      if (!goodbyeChannel) return false

      // Create goodbye embed
      const goodbyeEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("👋 Member Left")
        .setDescription(
          this.getRandomMessage("goodbye", {
            user: member.user.tag,
            server: member.guild.name,
          }),
        )
        .addFields(
          {
            name: "Joined Server",
            value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
            inline: true,
          },
          {
            name: "New Member Count",
            value: `${member.guild.memberCount}`,
            inline: true,
          },
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()

      await goodbyeChannel.send({ embeds: [goodbyeEmbed] })

      return true
    } catch (error) {
      log(`Error sending goodbye message: ${error}`, "error")
      return false
    }
  }
}

