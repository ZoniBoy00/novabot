import mongoose from "mongoose"

const userLevelSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    totalXP: { type: Number, default: 0 }, // Total XP earned across all levels
    lastMessageDate: { type: Date, default: Date.now },
    stats: {
      messagesCount: { type: Number, default: 0 },
      commandsUsed: { type: Number, default: 0 },
      voiceMinutes: { type: Number, default: 0 },
      levelUpCount: { type: Number, default: 0 },
    },
    badges: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Compound index for efficient queries
userLevelSchema.index({ guildId: 1, userId: 1 }, { unique: true })

// Index for global leaderboard queries
userLevelSchema.index({ totalXP: -1 })

// Static methods for leaderboards
userLevelSchema.statics.getServerLeaderboard = async function (guildId, limit = 10, page = 1) {
  const skip = (page - 1) * limit

  return this.find({ guildId })
    .sort({ totalXP: -1 })
    .skip(skip)
    .limit(limit)
    .select("userId xp level totalXP stats badges")
    .lean()
}

userLevelSchema.statics.getGlobalLeaderboard = async function (limit = 10, page = 1) {
  const skip = (page - 1) * limit

  return this.aggregate([
    {
      $sort: { totalXP: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
    {
      $project: {
        userId: 1,
        totalXP: 1,
        level: 1,
        stats: 1,
        badges: 1,
      },
    },
  ])
}

// Get user rank in server
userLevelSchema.statics.getServerRank = async function (guildId, userId) {
  const user = await this.findOne({ guildId, userId })
  if (!user) return null

  const rank = await this.countDocuments({
    guildId,
    totalXP: { $gt: user.totalXP },
  })

  return rank + 1
}

// Get user global rank
userLevelSchema.statics.getGlobalRank = async function (userId) {
  const user = await this.findOne({ userId })
  if (!user) return null

  const rank = await this.countDocuments({
    totalXP: { $gt: user.totalXP },
  })

  return rank + 1
}

export const UserLevel = mongoose.model("UserLevel", userLevelSchema)

