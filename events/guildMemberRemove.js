import { Events } from "discord.js"

export const name = Events.GuildMemberRemove
export const once = false

export async function execute(member) {
  await member.client.logManager.log(member.guild, "joins", {
    type: "leave",
    user: member.user,
  })

  // Send goodbye message
  await member.client.welcomeManager.sendGoodbyeMessage(member)
}

