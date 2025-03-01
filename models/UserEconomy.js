import mongoose from "mongoose"

const businessSchema = new mongoose.Schema({
  type: { type: String, required: true },
  level: { type: Number, default: 1 },
  lastCollected: { type: Date, default: Date.now },
})

const userEconomySchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    balance: { type: Number, default: 0 },
    lastDaily: { type: Date },
    lastWork: { type: Date },
    lastRob: { type: Date },
    businesses: [businessSchema],
  },
  {
    timestamps: true,
  },
)

// Compound index for efficient queries
userEconomySchema.index({ guildId: 1, userId: 1 }, { unique: true })

export const UserEconomy = mongoose.model("UserEconomy", userEconomySchema)

