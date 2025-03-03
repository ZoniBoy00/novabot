import { Events } from "discord.js"

export const name = Events.MessageUpdate
export const once = false

export async function execute(oldMessage, newMessage) {
  if (!oldMessage.guild || oldMessage.author?.bot) return
  if (oldMessage.content === newMessage.content) return

  await oldMessage.client.logManager.log(oldMessage.guild, "messages", {
    action: "edit",
    author: oldMessage.author,
    channel: oldMessage.channel,
    oldContent: oldMessage.content,
    newContent: newMessage.content,
    attachments: Array.from(newMessage.attachments.values()),
  })
}

