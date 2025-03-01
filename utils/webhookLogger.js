import { EmbedBuilder, WebhookClient } from "discord.js"
import config from "../config.js"

let webhookClient = null
let webhookErrorLogged = false

/**
 * Initialize the webhook client
 */
export function initWebhook() {
  if (config.logWebhookUrl && config.logWebhookUrl !== "your_discord_webhook_url") {
    try {
      webhookClient = new WebhookClient({ url: config.logWebhookUrl })
    } catch (error) {
      console.warn("[WARNING] Failed to initialize webhook client")
    }
  }
}

/**
 * Logs a message to Discord webhook
 * @param {string} message - The message to log
 * @param {'info'|'warn'|'error'|'success'} [level='info'] - The log level
 */
export async function logToWebhook(message, level = "info") {
  if (!webhookClient) return

  try {
    let color
    switch (level) {
      case "warn":
        color = "#FFA500"
        break
      case "error":
        color = "#FF0000"
        break
      case "success":
        color = "#00FF00"
        break
      default:
        color = "#0099FF"
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${level.toUpperCase()} Log`)
      .setDescription(message)
      .setTimestamp()

    await webhookClient.send({ embeds: [embed] })
  } catch (error) {
    if (!webhookErrorLogged) {
      console.warn("[WARNING] Failed to send log to webhook")
      webhookErrorLogged = true
    }
  }
}

