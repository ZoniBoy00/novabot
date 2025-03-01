import config from "../config.js"
import { log } from "./logger.js"

export function isOwner(userId) {
  if (!config.ownerId) {
    log("OWNER_ID is not set in environment variables!", "error")
    return false
  }

  if (!userId) {
    return false
  }

  return userId.toString() === config.ownerId.toString()
}

export function ownerOnly(interaction) {
  if (!isOwner(interaction.user.id)) {
    return {
      error: true,
      message: "This command can only be used by the bot owner.",
    }
  }
  return { error: false }
}

