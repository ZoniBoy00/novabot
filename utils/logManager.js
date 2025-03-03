import { ChannelType, PermissionFlagsBits, EmbedBuilder } from "discord.js"
import { log } from "./logger.js"
import { logToWebhook } from "./webhookLogger.js"

export class LogManager {
  constructor(client) {
    this.client = client
    this.logChannels = {
      moderation: {
        name: "mod-logs",
        topic: "Moderation actions and user infractions",
        permissions: ["ManageMessages", "ModerateMembers", "BanMembers", "KickMembers"],
      },
      server: {
        name: "server-logs",
        topic: "Server setting changes and updates",
        permissions: ["ManageGuild"],
      },
      messages: {
        name: "message-logs",
        topic: "Message edits, deletions, and bulk deletions",
        permissions: ["ManageMessages"],
      },
      voice: {
        name: "voice-logs",
        topic: "Voice channel activity and updates",
        permissions: ["MuteMembers", "DeafenMembers", "MoveMembers"],
      },
      joins: {
        name: "join-logs",
        topic: "Member join and leave activity",
        permissions: ["ManageGuild"],
      },
      members: {
        name: "member-logs",
        topic: "Member updates and role changes",
        permissions: ["ManageRoles"],
      },
    }
  }

  async initializeLogChannels() {
    // Get all guilds the bot is in
    const guilds = this.client.guilds.cache.values()

    // Set up log channels for each guild
    for (const guild of guilds) {
      try {
        await this.setupLogChannels(guild)
        log(`Initialized log channels for ${guild.name}`, "success")
      } catch (error) {
        log(`Failed to initialize log channels for ${guild.name}: ${error}`, "error")
      }
    }
  }

  async setupLogChannels(guild) {
    try {
      // Find or create logs category
      let logsCategory = guild.channels.cache.find(
        (channel) => channel.type === ChannelType.GuildCategory && channel.name.toLowerCase() === "logs",
      )

      if (!logsCategory) {
        logsCategory = await guild.channels.create({
          name: "logs",
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: guild.members.me.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.AttachFiles,
              ],
            },
          ],
        })
      }

      // Find mod role(s)
      const modRoles = guild.roles.cache.filter(
        (role) =>
          role.permissions.has(PermissionFlagsBits.ManageMessages) ||
          role.name.toLowerCase().includes("mod") ||
          role.name.toLowerCase().includes("admin"),
      )

      // Create or update each log channel
      for (const [key, channelData] of Object.entries(this.logChannels)) {
        let logChannel = guild.channels.cache.find((channel) => channel.name === channelData.name)

        const permissionOverwrites = [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: guild.members.me.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.AttachFiles,
            ],
          },
        ]

        // Add mod role permissions
        modRoles.forEach((role) => {
          if (channelData.permissions.some((perm) => role.permissions.has(PermissionFlagsBits[perm]))) {
            permissionOverwrites.push({
              id: role.id,
              allow: [PermissionFlagsBits.ViewChannel],
            })
          }
        })

        if (!logChannel) {
          logChannel = await guild.channels.create({
            name: channelData.name,
            type: ChannelType.GuildText,
            parent: logsCategory,
            topic: channelData.topic,
            permissionOverwrites,
          })

          log(`Created ${channelData.name} channel in ${guild.name}`, "success")
        } else {
          // Update existing channel
          await logChannel.edit({
            parent: logsCategory,
            topic: channelData.topic,
            permissionOverwrites,
          })
        }
      }

      return true
    } catch (error) {
      log(`Error setting up log channels in ${guild.name}: ${error}`, "error")
      return false
    }
  }

  async log(guild, type, data) {
    try {
      const channelData = this.logChannels[type]
      if (!channelData) return false

      const channel = guild.channels.cache.find((ch) => ch.name === channelData.name)
      if (!channel) {
        // Try to recreate the channel if it doesn't exist
        await this.setupLogChannels(guild)
        return this.log(guild, type, data)
      }

      const embed = this.createLogEmbed(type, data)
      const message = await channel.send({ embeds: [embed] })

      // Pin important messages
      if (type === "moderation" || (type === "server" && data.important)) {
        await message.pin().catch(() => {})
      }

      // Also log to webhook if configured
      await logToWebhook(`[${type}] ${embed.data.description}`, "info")

      return true
    } catch (error) {
      log(`Error logging to ${type} channel: ${error}`, "error")
      return false
    }
  }

  createLogEmbed(type, data) {
    const embed = new EmbedBuilder().setTimestamp().setFooter({ text: `Log ID: ${this.generateLogId()}` })

    switch (type) {
      case "moderation":
        embed
          .setTitle(`${data.action} | Case ${this.generateCaseId()}`)
          .setColor(this.getModActionColor(data.action))
          .addFields(
            { name: "User", value: this.formatUser(data.target), inline: true },
            { name: "Moderator", value: this.formatUser(data.moderator), inline: true },
            { name: "Reason", value: data.reason || "No reason provided" },
          )
        if (data.duration) {
          embed.addFields({ name: "Duration", value: this.formatDuration(data.duration) })
        }
        if (data.evidence) {
          embed.setImage(data.evidence)
        }
        break

      case "messages":
        embed
          .setTitle(data.action === "delete" ? "Message Deleted" : "Message Edited")
          .setColor(data.action === "delete" ? "#ff4444" : "#ffbb33")
          .addFields(
            { name: "Author", value: this.formatUser(data.author), inline: true },
            { name: "Channel", value: this.formatChannel(data.channel), inline: true },
          )
        if (data.action === "edit") {
          embed.addFields(
            { name: "Before", value: this.formatContent(data.oldContent) },
            { name: "After", value: this.formatContent(data.newContent) },
          )
        } else {
          embed.addFields({ name: "Content", value: this.formatContent(data.content) })
        }
        if (data.attachments?.length) {
          embed.addFields({
            name: "Attachments",
            value: data.attachments.map((a) => `[${a.name}](${a.url})`).join("\n"),
          })
        }
        break

      case "voice":
        embed
          .setTitle("Voice State Update")
          .setColor("#33b5e5")
          .addFields(
            { name: "User", value: this.formatUser(data.member.user), inline: true },
            { name: "Action", value: data.action, inline: true },
          )
        if (data.channel) {
          embed.addFields({ name: "Channel", value: this.formatChannel(data.channel) })
        }
        if (data.oldChannel && data.newChannel) {
          embed.addFields(
            { name: "From", value: this.formatChannel(data.oldChannel) },
            { name: "To", value: this.formatChannel(data.newChannel) },
          )
        }
        break

      case "server":
        embed
          .setTitle("Server Update")
          .setColor("#00C851")
          .addFields(
            { name: "Action", value: data.action, inline: true },
            { name: "Changes", value: data.changes.join("\n") },
          )
        if (data.executor) {
          embed.addFields({ name: "Updated By", value: this.formatUser(data.executor) })
        }
        break

      case "joins":
        embed
          .setTitle(data.type === "join" ? "Member Joined" : "Member Left")
          .setColor(data.type === "join" ? "#00C851" : "#ff4444")
          .setThumbnail(data.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: "User", value: this.formatUser(data.user) },
            {
              name: "Account Created",
              value: `<t:${Math.floor(data.user.createdTimestamp / 1000)}:F> (<t:${Math.floor(data.user.createdTimestamp / 1000)}:R>)`,
            },
          )
        if (data.type === "join" && data.inviter) {
          embed.addFields({ name: "Invited By", value: this.formatUser(data.inviter) })
        }
        break

      case "members":
        embed
          .setTitle("Member Update")
          .setColor("#33b5e5")
          .setThumbnail(data.member.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: "User", value: this.formatUser(data.member.user) },
            { name: "Changes", value: data.changes.join("\n") },
          )
        if (data.executor) {
          embed.addFields({ name: "Updated By", value: this.formatUser(data.executor) })
        }
        break

      default:
        embed.setTitle("Log Event").setDescription("Unknown log type").setColor("#ff4444")
    }

    return embed
  }

  getModActionColor(action) {
    const colors = {
      Ban: "#ff4444",
      Unban: "#00C851",
      Kick: "#ff8800",
      Mute: "#ffbb33",
      Unmute: "#00C851",
      Warn: "#ffbb33",
      Lock: "#ff8800",
      Unlock: "#00C851",
    }
    return colors[action] || "#ff4444"
  }

  generateCaseId() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  generateLogId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  formatUser(user) {
    return `${user.tag} (${user.id})`
  }

  formatChannel(channel) {
    return `${channel.name} (${channel.id})`
  }

  formatContent(content) {
    if (!content) return "No content"
    if (content.length > 1024) {
      return content.substr(0, 1021) + "..."
    }
    return content
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours % 24 > 0) parts.push(`${hours % 24}h`)
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`)
    if (seconds % 60 > 0) parts.push(`${seconds % 60}s`)

    return parts.join(" ") || "0s"
  }

  async bulkDelete(channel, messages, reason) {
    const logChannel = channel.guild.channels.cache.find((ch) => ch.name === this.logChannels.messages.name)

    if (!logChannel) return

    const embed = new EmbedBuilder()
      .setTitle("Bulk Messages Deleted")
      .setColor("#ff4444")
      .addFields(
        { name: "Channel", value: this.formatChannel(channel) },
        { name: "Message Count", value: messages.size.toString() },
        { name: "Reason", value: reason || "No reason provided" },
      )
      .setTimestamp()

    // Create text log
    let logContent = `Bulk Delete Log - ${new Date().toISOString()}\n`
    logContent += `Channel: #${channel.name}\n`
    logContent += `Message Count: ${messages.size}\n\n`

    messages.forEach((msg) => {
      logContent += `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content}\n`
      if (msg.attachments.size > 0) {
        logContent += `Attachments: ${msg.attachments.map((a) => a.url).join(", ")}\n`
      }
    })

    const buffer = Buffer.from(logContent, "utf8")
    await logChannel.send({
      embeds: [embed],
      files: [
        {
          attachment: buffer,
          name: "bulk-delete-log.txt",
        },
      ],
    })
  }
}

