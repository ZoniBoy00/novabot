import { Events } from "discord.js"

export const name = Events.VoiceStateUpdate
export const once = false

export async function execute(oldState, newState) {
  const member = newState.member

  if (!member || member.user.bot) return

  if (!oldState.channel && newState.channel) {
    // Member joined a voice channel
    await member.client.logManager.log(member.guild, "voice", {
      action: "joined",
      member,
      channel: newState.channel,
    })
  } else if (oldState.channel && !newState.channel) {
    // Member left a voice channel
    await member.client.logManager.log(member.guild, "voice", {
      action: "left",
      member,
      channel: oldState.channel,
    })
  } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
    // Member moved voice channels
    await member.client.logManager.log(member.guild, "voice", {
      action: "moved",
      member,
      oldChannel: oldState.channel,
      newChannel: newState.channel,
    })
  }

  // Log mute/deafen changes
  if (oldState.mute !== newState.mute) {
    await member.client.logManager.log(member.guild, "voice", {
      action: newState.mute ? "muted" : "unmuted",
      member,
      channel: newState.channel,
    })
  }

  if (oldState.deaf !== newState.deaf) {
    await member.client.logManager.log(member.guild, "voice", {
      action: newState.deaf ? "deafened" : "undeafened",
      member,
      channel: newState.channel,
    })
  }
}

