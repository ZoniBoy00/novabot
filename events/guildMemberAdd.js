import { Events } from "discord.js"

export const name = Events.GuildMemberAdd
export const once = false

export async function execute(member) {
  // Get invite used
  let inviter = null
  try {
    const invites = await member.guild.invites.fetch()
    const invite = invites.find((i) => i.uses > i.uses)
    if (invite) {
      inviter = invite.inviter
    }
  } catch (error) {
    console.error("Error fetching invites:", error)
  }

  // Log the join
  await member.client.logManager.log(member.guild, "joins", {
    type: "join",
    user: member.user,
    inviter,
  })

  // Send welcome message
  await member.client.welcomeManager.sendWelcomeMessage(member)
}

