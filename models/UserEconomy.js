import mongoose from "mongoose"

const investmentSchema = new mongoose.Schema({
  type: { type: String, enum: ["stock", "crypto"], required: true },
  symbol: { type: String, required: true },
  amount: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  purchaseDate: { type: Date, default: Date.now },
})

const petSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  stats: {
    health: { type: Number, default: 100 },
    attack: { type: Number, default: 10 },
    defense: { type: Number, default: 10 },
    speed: { type: Number, default: 10 },
  },
  lastFed: { type: Date, default: Date.now },
  lastTrained: { type: Date, default: Date.now },
})

const propertySchema = new mongoose.Schema({
  type: { type: String, required: true },
  name: { type: String, required: true },
  purchasePrice: { type: Number, required: true },
  purchaseDate: { type: Date, default: Date.now },
  income: { type: Number, default: 0 },
  lastCollected: { type: Date, default: Date.now },
})

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  salary: { type: Number, required: true },
  lastWorked: { type: Date, default: Date.now },
})

const achievementSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  reward: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
})

const inventoryItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  amount: { type: Number, default: 1 },
  purchaseDate: { type: Date, default: Date.now },
})

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
    bank: { type: Number, default: 0 },
    bankLimit: { type: Number, default: 10000 },
    lastDaily: { type: Date },
    lastWork: { type: Date },
    lastRob: { type: Date },
    businesses: [businessSchema],
    investments: [investmentSchema],
    pets: [petSchema],
    properties: [propertySchema],
    job: jobSchema,
    achievements: [achievementSchema],
    inventory: [inventoryItemSchema],
    stats: {
      totalEarned: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 },
      gamesWon: { type: Number, default: 0 },
      robberySuccess: { type: Number, default: 0 },
      robberyFail: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
)

// Compound index for efficient queries
userEconomySchema.index({ guildId: 1, userId: 1 }, { unique: true })

// Index for global leaderboard queries
userEconomySchema.index({ balance: -1 })

// Virtual for total net worth
userEconomySchema.virtual("netWorth").get(function () {
  let total = this.balance + this.bank

  // Add business value
  total += this.businesses.reduce((sum, business) => {
    return sum + business.level * 1000 // Base value calculation
  }, 0)

  // Add property value
  total += this.properties.reduce((sum, property) => {
    return sum + property.purchasePrice
  }, 0)

  // Add investment value (simplified)
  total += this.investments.reduce((sum, investment) => {
    return sum + investment.amount * investment.purchasePrice
  }, 0)

  return total
})

// Methods for economy operations
userEconomySchema.methods.addMoney = async function (amount) {
  this.balance += amount
  this.stats.totalEarned += amount
  await this.save()
}

userEconomySchema.methods.removeMoney = async function (amount) {
  if (this.balance >= amount) {
    this.balance -= amount
    this.stats.totalSpent += amount
    await this.save()
    return true
  }
  return false
}

userEconomySchema.methods.deposit = async function (amount) {
  if (this.balance >= amount && this.bank + amount <= this.bankLimit) {
    this.balance -= amount
    this.bank += amount
    await this.save()
    return true
  }
  return false
}

userEconomySchema.methods.withdraw = async function (amount) {
  if (this.bank >= amount) {
    this.bank -= amount
    this.balance += amount
    await this.save()
    return true
  }
  return false
}

// Static methods for leaderboards
userEconomySchema.statics.getServerLeaderboard = async function (guildId, limit = 10) {
  return this.find({ guildId }).sort({ balance: -1 }).limit(limit).select("userId balance bank stats").lean()
}

userEconomySchema.statics.getGlobalLeaderboard = async function (limit = 10) {
  return this.aggregate([
    {
      $addFields: {
        totalWealth: { $add: ["$balance", "$bank"] },
      },
    },
    {
      $sort: { totalWealth: -1 },
    },
    {
      $limit: limit,
    },
  ])
}

export const UserEconomy = mongoose.model("UserEconomy", userEconomySchema)

