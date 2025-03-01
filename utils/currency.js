import { UserEconomy } from "../models/UserEconomy.js"
import { log } from "./logger.js"

class CurrencySystem {
  // Get user data with upsert
  async getUserData(guildId, userId) {
    try {
      const userData = await UserEconomy.findOneAndUpdate(
        { guildId, userId },
        { $setOnInsert: { balance: 0 } },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      )
      return userData
    } catch (error) {
      log(`Error getting user economy data: ${error}`, "error")
      return null
    }
  }

  // Add currency
  async addBalance(guildId, userId, amount) {
    try {
      const userData = await UserEconomy.findOneAndUpdate(
        { guildId, userId },
        {
          $inc: { balance: amount },
          $setOnInsert: {
            lastDaily: null,
            lastWork: null,
            lastRob: null,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      )
      return userData.balance
    } catch (error) {
      log(`Error adding balance: ${error}`, "error")
      return null
    }
  }

  // Remove currency
  async removeBalance(guildId, userId, amount) {
    try {
      const userData = await UserEconomy.findOneAndUpdate(
        {
          guildId,
          userId,
          balance: { $gte: amount },
        },
        { $inc: { balance: -amount } },
        { new: true },
      )
      return !!userData
    } catch (error) {
      log(`Error removing balance: ${error}`, "error")
      return false
    }
  }

  // Get balance
  async getBalance(guildId, userId) {
    try {
      const userData = await UserEconomy.findOne({ guildId, userId })
      return userData?.balance || 0
    } catch (error) {
      log(`Error getting balance: ${error}`, "error")
      return 0
    }
  }

  // Get user rank in server
  async getRank(guildId, userId) {
    try {
      const userData = await this.getUserData(guildId, userId)
      if (!userData) return null

      const rank = await UserEconomy.countDocuments({
        guildId,
        balance: { $gt: userData.balance },
      })
      return rank + 1
    } catch (error) {
      log(`Error getting user rank: ${error}`, "error")
      return null
    }
  }

  // Transfer currency between users
  async transfer(guildId, fromId, toId, amount) {
    const session = await UserEconomy.startSession()
    try {
      await session.withTransaction(async () => {
        const success = await this.removeBalance(guildId, fromId, amount)
        if (!success) throw new Error("Insufficient funds")
        await this.addBalance(guildId, toId, amount)
      })
      return true
    } catch (error) {
      log(`Error transferring balance: ${error}`, "error")
      return false
    } finally {
      await session.endSession()
    }
  }

  // Check cooldown
  async checkCooldown(guildId, userId, type) {
    try {
      const userData = await UserEconomy.findOneAndUpdate(
        { guildId, userId },
        { $setOnInsert: { balance: 0 } },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      )

      const lastTime = userData[`last${type}`]
      const now = new Date()

      const cooldowns = {
        Daily: 24 * 60 * 60 * 1000, // 24 hours
        Work: 30 * 60 * 1000, // 30 minutes
        Rob: 60 * 60 * 1000, // 1 hour
      }

      if (lastTime && now.getTime() - lastTime.getTime() < cooldowns[type]) {
        return {
          onCooldown: true,
          timeLeft: cooldowns[type] - (now.getTime() - lastTime.getTime()),
        }
      }

      // Update the last action time immediately when checking cooldown
      await UserEconomy.updateOne({ guildId, userId }, { $set: { [`last${type}`]: now } })

      return { onCooldown: false }
    } catch (error) {
      log(`Error checking cooldown: ${error}`, "error")
      return { onCooldown: true }
    }
  }

  // Get leaderboard
  async getLeaderboard(guildId, limit = 10) {
    try {
      return await UserEconomy.find({ guildId }).sort({ balance: -1 }).limit(limit).lean()
    } catch (error) {
      log(`Error getting leaderboard: ${error}`, "error")
      return []
    }
  }

  // Format currency
  formatBalance(amount) {
    return `${amount.toLocaleString()} 💰`
  }
}

export const currencySystem = new CurrencySystem()

