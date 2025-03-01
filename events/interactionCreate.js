import { Events, Collection } from "discord.js"
import { createErrorEmbed } from "../utils/embedBuilder.js"
import { isOwner } from "../utils/ownerUtils.js"

export const name = Events.InteractionCreate
export const once = false

export async function execute(interaction, client) {
  if (!interaction.isChatInputCommand()) return

  const command = client.handler.commands.get(interaction.commandName)

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`)
    return
  }

  // Check for maintenance mode
  if (client.maintenance && !isOwner(interaction.user.id)) {
    const maintenanceEmbed = createErrorEmbed(
      "Maintenance Mode",
      `The bot is currently in maintenance mode.\nReason: ${client.maintenanceReason}`,
    )
    return interaction.reply({
      embeds: [maintenanceEmbed],
      flags: ["Ephemeral"],
    })
  }

  // Check if command is owner-only
  const category = client.handler.getCommandCategory(interaction.commandName)
  if (category === "owner" && !isOwner(interaction.user?.id)) {
    const errorEmbed = createErrorEmbed("Error", "This command can only be used by the bot owner.")
    return interaction.reply({
      embeds: [errorEmbed],
      flags: ["Ephemeral"],
    })
  }

  // Handle command cooldowns
  const { cooldowns } = client.handler

  if (!cooldowns.has(command.data.name)) {
    cooldowns.set(command.data.name, new Collection())
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

      return interaction.reply({
        embeds: [errorEmbed],
        flags: ["Ephemeral"],
      })
    }
  }

  timestamps.set(interaction.user.id, now)
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount)

  try {
    await command.execute(interaction, client)
  } catch (error) {
    console.error(error)
    const errorEmbed = createErrorEmbed("Command Error", "There was an error while executing this command!")

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        embeds: [errorEmbed],
        flags: ["Ephemeral"],
      })
    } else {
      await interaction.reply({
        embeds: [errorEmbed],
        flags: ["Ephemeral"],
      })
    }
  }
}

