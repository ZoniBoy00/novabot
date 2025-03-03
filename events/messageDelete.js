import { Events } from "discord.js"

export const name = Events.MessageDelete
export const once = false

export async function execute(message) {
  if (!message.guild || message.author?.bot) return

  await message.client.logManager.log(message.guild, "messages", {
    action: "delete",
    author: message.author,
    channel: message.channel,
    content: message.content,
    attachments: Array.from(message.attachments.values()),
  })
}

