import { Events } from "discord.js"
import { createErrorEmbed } from "../utils/embedBuilder.js"
import { isOwner } from "../utils/ownerUtils.js"

export const name = Events.InteractionCreate
export const once = false

export async function execute(interaction) {
  try {
    // Handle different interaction types
    if (interaction.isChatInputCommand()) {
      await handleCommand(interaction)
    } else if (interaction.isButton()) {
      await handleButton(interaction)
    } else if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction)
    }
  } catch (error) {
    console.error("Error handling interaction:", error)
    const errorEmbed = createErrorEmbed("Error", "An error occurred while processing your interaction.")

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true })
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true })
    }
  }
}

async function handleCommand(interaction) {
  const command = interaction.client.handler.commands.get(interaction.commandName)

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`)
    return
  }

  // Check for maintenance mode
  if (interaction.client.maintenance && !isOwner(interaction.user.id)) {
    const maintenanceEmbed = createErrorEmbed(
      "Maintenance Mode",
      `The bot is currently in maintenance mode.\nReason: ${interaction.client.maintenanceReason}`,
    )
    return interaction.reply({ embeds: [maintenanceEmbed], ephemeral: true })
  }

  // Check if command is owner-only
  const category = interaction.client.handler.getCommandCategory(interaction.commandName)
  if (category === "owner" && !isOwner(interaction.user?.id)) {
    const errorEmbed = createErrorEmbed("Error", "This command can only be used by the bot owner.")
    return interaction.reply({ embeds: [errorEmbed], ephemeral: true })
  }

  // Handle command cooldowns
  const cooldownResult = await handleCooldown(interaction, command)
  if (cooldownResult.error) {
    return interaction.reply({ embeds: [cooldownResult.embed], ephemeral: true })
  }

  // Execute command
  await command.execute(interaction, interaction.client)
}

async function handleButton(interaction) {
  const buttonId = interaction.customId

  if (buttonId.startsWith("ticket-")) {
    await interaction.client.ticketManager.handleInteraction(interaction)
  } else if (buttonId.startsWith("role-")) {
    await interaction.client.reactionRolesManager.handleInteraction(interaction)
  }
}

async function handleModalSubmit(interaction) {
  if (interaction.customId === "ticket-modal") {
    await interaction.client.ticketManager.handleModalSubmit(interaction)
  }
}

async function handleCooldown(interaction, command) {
  const { cooldowns } = interaction.client.handler

  if (!cooldowns.has(command.data.name)) {
    cooldowns.set(command.data.name, new Map())
  }

  const now = Date.now()
  const timestamps = cooldowns.get(command.data.name)
  const defaultCooldownDuration = 3
  const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000

  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount

    if (now < expirationTime) {
      const expiredTimestamp = Math.round(expirationTime / 1000)
      const errorEmbed = createErrorEmbed(
        "Command on Cooldown",
        `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
      )

      return { error: true, embed: errorEmbed }
    }
  }

  timestamps.set(interaction.user.id, now)
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount)

  return { error: false }
}

