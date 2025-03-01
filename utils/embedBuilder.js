import { EmbedBuilder } from "discord.js"
import config from "../config.js"

/**
 * Creates a standardized embed for NovaBot
 * @param {Object} options - Options for the embed
 * @param {string} options.title - The title of the embed
 * @param {string} [options.description] - The description of the embed
 * @param {string} [options.color] - The color of the embed (defaults to config.embedColor)
 * @param {Object[]} [options.fields] - Fields to add to the embed
 * @param {string} [options.thumbnail] - URL of the thumbnail image
 * @param {string} [options.image] - URL of the main image
 * @param {Object} [options.footer] - Footer options
 * @param {string} [options.footer.text] - Footer text
 * @param {string} [options.footer.iconURL] - Footer icon URL
 * @param {Object} [options.author] - Author options
 * @param {string} [options.author.name] - Author name
 * @param {string} [options.author.iconURL] - Author icon URL
 * @returns {EmbedBuilder} The created embed
 */
export function createEmbed(options) {
  const embed = new EmbedBuilder().setColor(options.color || config.embedColor)

  if (options.title) {
    embed.setTitle(options.title)
  }

  if (options.description) {
    embed.setDescription(options.description)
  }

  if (options.fields && Array.isArray(options.fields)) {
    embed.addFields(options.fields)
  }

  if (options.thumbnail) {
    embed.setThumbnail(options.thumbnail)
  }

  if (options.image) {
    embed.setImage(options.image)
  }

  if (options.footer) {
    embed.setFooter(options.footer)
  } else {
    embed.setFooter({ text: "NovaBot • Powered by discord.js" })
  }

  if (options.author) {
    embed.setAuthor(options.author)
  }

  if (options.timestamp !== false) {
    embed.setTimestamp()
  }

  return embed
}

/**
 * Creates a success embed
 * @param {string} title - The title of the embed
 * @param {string} description - The description of the embed
 * @param {Object} [options] - Additional options for the embed
 * @returns {EmbedBuilder} The created embed
 */
export function createSuccessEmbed(title, description, options = {}) {
  return createEmbed({
    title,
    description: description || "Success!",
    color: "#00FF00",
    ...options,
  })
}

/**
 * Creates an error embed
 * @param {string} title - The title of the embed
 * @param {string} description - The description of the embed
 * @param {Object} [options] - Additional options for the embed
 * @returns {EmbedBuilder} The created embed
 */
export function createErrorEmbed(title, description, options = {}) {
  return createEmbed({
    title,
    description: description || "An error occurred.",
    color: "#FF0000",
    ...options,
  })
}

/**
 * Creates an info embed
 * @param {string} title - The title of the embed
 * @param {string} description - The description of the embed
 * @param {Object} [options] - Additional options for the embed
 * @returns {EmbedBuilder} The created embed
 */
export function createInfoEmbed(title, description, options = {}) {
  return createEmbed({
    title,
    description: description || "Information",
    color: "#0099FF",
    ...options,
  })
}

