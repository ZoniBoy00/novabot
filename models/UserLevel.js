import mongoose from "mongoose"

const userLevelSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    lastMessageDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
)

// Compound index for efficient queries
userLevelSchema.index({ guildId: 1, userId: 1 }, { unique: true })

export const UserLevel = mongoose.model("UserLevel", userLevelSchema)

