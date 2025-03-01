import { UserLevel } from "../models/UserLevel.js"
import { log } from "./logger.js"

class LevelSystem {
  constructor() {
    this.xpCooldowns = new Map()
  }

  // Calculate XP needed for a specific level
  calculateXPForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1))
  }

  // Calculate level from XP
  calculateLevelFromXP(xp) {
    let level = 1
    while (xp >= this.calculateXPForLevel(level)) {
      xp -= this.calculateXPForLevel(level)
      level++
    }
    return level - 1
  }

  // Get user data with upsert
  async getUserData(guildId, userId) {
    try {
      const userData = await UserLevel.findOneAndUpdate(
        { guildId, userId },
        {
          $setOnInsert: {
            xp: 0,
            level: 0,
            lastMessageDate: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      )
      return userData
    } catch (error) {
      log(`Error getting user level data: ${error}`, "error")
      return null
    }
  }

  // Add XP to user
  async addXP(guildId, userId, xpToAdd) {
    try {
      const userData = await UserLevel.findOneAndUpdate(
        { guildId, userId },
        {
          $inc: { xp: xpToAdd },
          $set: { lastMessageDate: new Date() },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      )

      const oldLevel = userData.level
      const newLevel = this.calculateLevelFromXP(userData.xp)

      if (newLevel !== oldLevel) {
        await UserLevel.updateOne({ guildId, userId }, { $set: { level: newLevel } })
      }

      return {
        leveledUp: newLevel > oldLevel,
        newLevel: newLevel,
        currentXP: userData.xp,
        xpNeeded: this.calculateXPForLevel(newLevel + 1),
      }
    } catch (error) {
      log(`Error adding XP: ${error}`, "error")
      return null
    }
  }

  // Get user rank in server
  async getRank(guildId, userId) {
    try {
      const userData = await this.getUserData(guildId, userId)
      if (!userData) return null

      const userCount = await UserLevel.countDocuments({
        guildId,
        xp: { $gt: userData.xp },
      })
      return userCount + 1
    } catch (error) {
      log(`Error getting user rank: ${error}`, "error")
      return null
    }
  }

  // Get top users in server
  async getLeaderboard(guildId, limit = 10) {
    try {
      return await UserLevel.find({ guildId }).sort({ xp: -1 }).limit(limit).lean()
    } catch (error) {
      log(`Error getting leaderboard: ${error}`, "error")
      return []
    }
  }
}

export const levelSystem = new LevelSystem()

