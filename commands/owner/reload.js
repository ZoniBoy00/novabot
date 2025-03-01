import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { ownerOnly } from "../../utils/ownerUtils.js"

export const data = new SlashCommandBuilder()
  .setName("reload")
  .setDescription("Reload a command (Owner Only)")
  .addStringOption((option) => option.setName("command").setDescription("The command to reload").setRequired(true))

export async function execute(interaction, client) {
  // Check if user is owner
  const ownerCheck = ownerOnly(interaction)
  if (ownerCheck.error) {
    const errorEmbed = createEmbed({
      title: "Error",
      description: ownerCheck.message,
      color: "#FF0000",
    })
    return interaction.reply({ embeds: [errorEmbed], flags: ["Ephemeral"] })
  }

  const commandName = interaction.options.getString("command", true).toLowerCase()
  const command = client.handler.commands.get(commandName)

  if (!command) {
    const errorEmbed = createEmbed({
      title: "Error",
      description: `There is no command with name \`${commandName}\`!`,
      color: "#FF0000",
    })
    return interaction.reply({ embeds: [errorEmbed], flags: ["Ephemeral"] })
  }

  try {
    // Get the category from the stored command
    const category = client.handler.getCommandCategory(commandName)
    if (!category) {
      throw new Error("Could not determine command category")
    }

    // Reload the command
    await client.handler.loadCommand(category, `${commandName}.js`)

    const successEmbed = createEmbed({
      title: "Success",
      description: `Command \`${commandName}\` was reloaded!`,
      color: "#00FF00",
    })
    await interaction.reply({ embeds: [successEmbed] })
  } catch (error) {
    console.error(error)
    const errorEmbed = createEmbed({
      title: "Error",
      description: `There was an error while reloading command \`${commandName}\`:\n\`\`\`${error.message}\`\`\``,
      color: "#FF0000",
    })
    await interaction.reply({ embeds: [errorEmbed], flags: ["Ephemeral"] })
  }
}

