import {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js"
import { log } from "./logger.js"

export class TicketManager {
  constructor(client) {
    this.client = client
    this.tickets = new Map()
  }

  async createTicketPanel(channel, options) {
    try {
      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle(options.title || "Support Tickets")
        .setDescription(options.description || "Click the button below to create a support ticket")
        .setFooter({
          text: "NovaBot Ticket System",
        })

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("create_ticket")
          .setLabel("Create Ticket")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("🎫"),
      )

      await channel.send({ embeds: [embed], components: [row] })
      return true
    } catch (error) {
      log(`Error creating ticket panel: ${error}`, "error")
      return false
    }
  }

  async handleTicketCreate(interaction) {
    try {
      // Check if user already has an open ticket
      const existingTicket = Array.from(this.tickets.values()).find((ticket) => ticket.userId === interaction.user.id)

      if (existingTicket) {
        await interaction.reply({
          content: `You already have an open ticket: <#${existingTicket.channelId}>`,
          ephemeral: true,
        })
        return
      }

      // Create ticket category if it doesn't exist
      let category = interaction.guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildCategory && c.name === "tickets",
      )

      if (!category) {
        category = await interaction.guild.channels.create({
          name: "tickets",
          type: ChannelType.GuildCategory,
        })
      }

      // Create ticket channel
      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
          {
            id: interaction.guild.members.me.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      })

      // Store ticket data
      this.tickets.set(ticketChannel.id, {
        userId: interaction.user.id,
        channelId: ticketChannel.id,
        createdAt: Date.now(),
        status: "open",
      })

      // Send initial ticket message
      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("Support Ticket")
        .setDescription(
          `Welcome ${interaction.user}!\nSupport will be with you shortly.\nPlease describe your issue in detail.`,
        )
        .addFields(
          {
            name: "Ticket Owner",
            value: interaction.user.tag,
            inline: true,
          },
          {
            name: "Created At",
            value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
            inline: true,
          },
        )

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("Close Ticket")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🔒"),
      )

      await ticketChannel.send({ embeds: [embed], components: [row] })

      await interaction.reply({
        content: `Your ticket has been created: ${ticketChannel}`,
        ephemeral: true,
      })
    } catch (error) {
      log(`Error creating ticket: ${error}`, "error")
      await interaction.reply({
        content: "There was an error creating your ticket!",
        ephemeral: true,
      })
    }
  }

  async handleTicketClose(interaction) {
    try {
      const ticketData = this.tickets.get(interaction.channel.id)

      if (!ticketData) {
        await interaction.reply({
          content: "This is not a valid ticket channel!",
          ephemeral: true,
        })
        return
      }

      // Create transcript
      const messages = await interaction.channel.messages.fetch()
      let transcript = ""
      messages.reverse().forEach((message) => {
        transcript += `[${new Date(message.createdTimestamp).toLocaleString()}] ${message.author.tag}: ${message.content}\n`
      })

      // Save transcript to file
      const transcriptAttachment = Buffer.from(transcript)

      // Send transcript to log channel
      const logChannel = interaction.guild.channels.cache.find((channel) => channel.name === "ticket-logs")

      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("Ticket Closed")
          .addFields(
            {
              name: "Ticket Owner",
              value: `<@${ticketData.userId}>`,
              inline: true,
            },
            {
              name: "Closed By",
              value: interaction.user.tag,
              inline: true,
            },
            {
              name: "Duration",
              value: this.formatDuration(Date.now() - ticketData.createdAt),
              inline: true,
            },
          )

        await logChannel.send({
          embeds: [logEmbed],
          files: [
            {
              attachment: transcriptAttachment,
              name: `ticket-${interaction.channel.name}.txt`,
            },
          ],
        })
      }

      // Remove ticket data
      this.tickets.delete(interaction.channel.id)

      // Delete channel
      await interaction.channel.delete()
    } catch (error) {
      log(`Error closing ticket: ${error}`, "error")
      await interaction.reply({
        content: "There was an error closing the ticket!",
        ephemeral: true,
      })
    }
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  // Additional methods for ticket management
  async getTicketStats(guild) {
    const tickets = Array.from(this.tickets.values()).filter((ticket) => guild.channels.cache.has(ticket.channelId))

    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      closed: tickets.filter((t) => t.status === "closed").length,
    }
  }

  async addUserToTicket(ticketId, userId) {
    try {
      const channel = await this.client.channels.fetch(ticketId)
      if (!channel) return false

      await channel.permissionOverwrites.create(userId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      })

      return true
    } catch (error) {
      log(`Error adding user to ticket: ${error}`, "error")
      return false
    }
  }

  async removeUserFromTicket(ticketId, userId) {
    try {
      const channel = await this.client.channels.fetch(ticketId)
      if (!channel) return false

      await channel.permissionOverwrites.delete(userId)
      return true
    } catch (error) {
      log(`Error removing user from ticket: ${error}`, "error")
      return false
    }
  }
}

