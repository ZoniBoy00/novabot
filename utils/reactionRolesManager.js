import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"
import { log } from "./logger.js"

export class ReactionRolesManager {
  constructor(client) {
    this.client = client
    this.reactionRoles = new Map()
  }

  async createReactionRole(channel, options) {
    try {
      const { title, description, roles, style = "BUTTON" } = options

      // Create embed
      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle(title)
        .setDescription(description || "React to get roles!")
        .addFields(
          roles.map((role) => ({
            name: role.name,
            value: role.description || "Click the button below to get this role",
            inline: true,
          })),
        )

      // Create buttons/select menu
      const components = []
      if (style === "BUTTON") {
        const row = new ActionRowBuilder()
        roles.forEach((role) => {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`role-${role.id}`)
              .setLabel(role.name)
              .setStyle(role.color ? ButtonStyle[role.color] : ButtonStyle.Primary)
              .setEmoji(role.emoji || "✨"),
          )
        })
        components.push(row)
      }

      // Send message
      const message = await channel.send({
        embeds: [embed],
        components,
      })

      // Store reaction role data
      this.reactionRoles.set(message.id, {
        roles: roles.map((role) => ({
          id: role.id,
          name: role.name,
          type: "toggle",
        })),
      })

      return true
    } catch (error) {
      log(`Error creating reaction role: ${error}`, "error")
      return false
    }
  }

  async handleInteraction(interaction) {
    if (!interaction.isButton()) return

    const messageId = interaction.message.id
    const reactionRole = this.reactionRoles.get(messageId)

    if (!reactionRole) return

    try {
      const roleId = interaction.customId.replace("role-", "")
      const role = interaction.guild.roles.cache.get(roleId)

      if (!role) {
        await interaction.reply({
          content: "Role not found!",
          ephemeral: true,
        })
        return
      }

      const member = interaction.member

      // Toggle role
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role)
        await interaction.reply({
          content: `Removed role: ${role.name}`,
          ephemeral: true,
        })
      } else {
        await member.roles.add(role)
        await interaction.reply({
          content: `Added role: ${role.name}`,
          ephemeral: true,
        })
      }
    } catch (error) {
      log(`Error handling reaction role: ${error}`, "error")
      await interaction.reply({
        content: "There was an error managing your roles!",
        ephemeral: true,
      })
    }
  }

  // Additional methods for managing reaction roles
  async removeReactionRole(messageId) {
    try {
      this.reactionRoles.delete(messageId)
      return true
    } catch (error) {
      log(`Error removing reaction role: ${error}`, "error")
      return false
    }
  }

  async updateReactionRole(messageId, options) {
    try {
      const message = await this.client.channels.cache.get(options.channelId)?.messages.fetch(messageId)

      if (!message) return false

      const { title, description, roles } = options

      // Update embed
      const embed = EmbedBuilder.from(message.embeds[0])
        .setTitle(title)
        .setDescription(description)
        .setFields(
          roles.map((role) => ({
            name: role.name,
            value: role.description || "Click the button below to get this role",
            inline: true,
          })),
        )

      // Update buttons
      const row = new ActionRowBuilder()
      roles.forEach((role) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`role-${role.id}`)
            .setLabel(role.name)
            .setStyle(role.color ? ButtonStyle[role.color] : ButtonStyle.Primary)
            .setEmoji(role.emoji || "✨"),
        )
      })

      await message.edit({
        embeds: [embed],
        components: [row],
      })

      // Update stored data
      this.reactionRoles.set(messageId, {
        roles: roles.map((role) => ({
          id: role.id,
          name: role.name,
          type: "toggle",
        })),
      })

      return true
    } catch (error) {
      log(`Error updating reaction role: ${error}`, "error")
      return false
    }
  }

  async listReactionRoles(guild) {
    try {
      const reactionRoles = Array.from(this.reactionRoles.entries())
        .filter(([messageId]) => {
          const channel = this.client.channels.cache.find((ch) => ch.messages?.cache.has(messageId))
          return channel?.guild.id === guild.id
        })
        .map(([messageId, data]) => ({
          messageId,
          ...data,
        }))

      return reactionRoles
    } catch (error) {
      log(`Error listing reaction roles: ${error}`, "error")
      return []
    }
  }
}

