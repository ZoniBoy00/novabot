import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import { getDirname } from "../../utils/paths.js"
import { isOwner } from "../../utils/ownerUtils.js"
import config from "../../config.js"

const __dirname = getDirname(import.meta.url)

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Display a list of available commands")
  .addStringOption((option) =>
    option
      .setName("category")
      .setDescription("Command category to show")
      .setRequired(false)
      .addChoices(
        { name: "🎵 Music", value: "music" },
        { name: "🛡️ Moderation", value: "moderation" },
        { name: "🔧 Utility", value: "utility" },
        { name: "💰 Economy", value: "economy" },
        { name: "⭐ Levels", value: "levels" },
        { name: "🎫 Tickets", value: "tickets" },
        { name: "🎭 Reaction Roles", value: "roles" },
        { name: "👋 Welcome", value: "welcome" },
        { name: "👑 Owner", value: "owner" },
      ),
  )

export async function execute(interaction, client) {
  const selectedCategory = interaction.options.getString("category")

  // Handle category-specific help
  if (selectedCategory) {
    // Check owner permissions for owner category
    if (selectedCategory === "owner" && !isOwner(interaction.user?.id)) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Error")
        .setDescription("You do not have permission to view owner commands.")
      return interaction.reply({
        embeds: [errorEmbed],
        flags: ["Ephemeral"],
      })
    }

    const commands = Array.from(client.handler.commands.entries())
      .filter(([_, cmd]) => client.handler.getCommandCategory(cmd.data.name) === selectedCategory)
      .map(([_, cmd]) => cmd)

    if (commands.length === 0) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Error")
        .setDescription("No commands found in this category.")
      return interaction.reply({
        embeds: [errorEmbed],
        flags: ["Ephemeral"],
      })
    }

    const categoryEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(`${getCategoryEmoji(selectedCategory)} ${capitalizeFirstLetter(selectedCategory)} Commands`)
      .setDescription(getCategoryDescription(selectedCategory))

    for (const command of commands) {
      categoryEmbed.addFields({
        name: `/${command.data.name}`,
        value: `${command.data.description}${
          command.data.options?.length ? "\n*This command has additional options*" : ""
        }`,
      })
    }

    categoryEmbed.setFooter({
      text: `Use /help for an overview of all categories • Made with ❤️ by ZoniBoy00`,
    })

    return interaction.reply({
      embeds: [categoryEmbed],
      flags: selectedCategory === "owner" ? ["Ephemeral"] : [],
    })
  }

  // Show all categories
  const categories = new Set(client.handler.commandCategories.values())
  const filteredCategories = Array.from(categories).filter((category) => {
    if (category === "owner") {
      return isOwner(interaction.user?.id)
    }
    return true
  })

  const helpEmbed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle("NovaBot Help")
    .setDescription(
      "NovaBot uses slash commands! Type `/` to see all available commands.\n\nHere are the available command categories:",
    )

  for (const category of filteredCategories) {
    const commandCount = Array.from(client.handler.commands.values()).filter(
      (cmd) => client.handler.getCommandCategory(cmd.data.name) === category,
    ).length

    helpEmbed.addFields({
      name: `${getCategoryEmoji(category)} ${capitalizeFirstLetter(category)}`,
      value: `${commandCount} command(s)\nUse \`/help ${category}\` to see details`,
    })
  }

  helpEmbed
    .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
    .addFields({
      name: "📚 Quick Links",
      value: `• Use \`/guide\` for a detailed setup guide
• Use \`/stats\` to view bot statistics
• Join our support server for help`,
    })
    .setFooter({
      text: `Use /help [category] to see commands in a specific category • Made with ❤️ by ZoniBoy00`,
    })

  await interaction.reply({ embeds: [helpEmbed] })
}

function getCategoryEmoji(category) {
  const emojis = {
    music: "🎵",
    moderation: "🛡️",
    utility: "🔧",
    economy: "💰",
    levels: "⭐",
    tickets: "🎫",
    roles: "🎭",
    welcome: "👋",
    owner: "👑",
  }
  return emojis[category] || "❓"
}

function getCategoryDescription(category) {
  const descriptions = {
    music:
      "Play and manage music from YouTube and Spotify. Use /play to start, and control playback with various commands.",
    moderation: "Manage and moderate your server with advanced logging and auto-moderation features.",
    utility: "General utility commands for server management and information.",
    economy: "Earn money through work, businesses, and games. Build your empire!",
    levels: "Level up and compete with other members through chat and voice activity.",
    tickets: "Create and manage support tickets with advanced features.",
    roles: "Set up self-assignable roles with buttons and menus.",
    welcome: "Configure welcome messages, images, and member tracking.",
    owner: "Special commands for the bot owner.",
  }
  return descriptions[category] || "Use slash commands by typing `/` and selecting a command from the menu."
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

