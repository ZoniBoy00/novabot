import { ActivityType } from "discord.js"

export class StatusManager {
  constructor(client) {
    this.client = client
    this.currentIndex = 0
    this.interval = null
  }

  getServerCount() {
    return this.client.guilds.cache.size
  }

  getTotalMembers() {
    return this.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
  }

  getStatusMessages() {
    return [
      {
        text: "/help | Helping the Community",
        type: ActivityType.Listening,
      },
      {
        text: `${this.getServerCount()} servers | Spreading Joy`,
        type: ActivityType.Watching,
      },
      {
        text: `${this.getTotalMembers()} members | Creating Memories`,
        type: ActivityType.Watching,
      },
      {
        text: "/play | Bringing the Music",
        type: ActivityType.Playing,
      },
      {
        text: "/mod | Keeping Peace",
        type: ActivityType.Competing,
      },
    ]
  }

  updateStatus() {
    const statusMessages = this.getStatusMessages()
    const status = statusMessages[this.currentIndex]

    this.client.user.setActivity(status.text, { type: status.type })

    // Move to next status
    this.currentIndex = (this.currentIndex + 1) % statusMessages.length
  }

  startRotation(interval = 60000) {
    // Default 1 minute interval
    // Clear any existing interval
    if (this.interval) {
      clearInterval(this.interval)
    }

    // Set initial status
    this.updateStatus()

    // Start rotation
    this.interval = setInterval(() => this.updateStatus(), interval)
  }

  stopRotation() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}

