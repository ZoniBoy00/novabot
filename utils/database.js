import mongoose from "mongoose"
import { log } from "./logger.js"

class DatabaseManager {
  constructor() {
    this.connected = false
    this.connectionRetries = 0
    this.maxRetries = 5
    this.retryDelay = 5000
  }

  async connect() {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables")
    }

    try {
      await this._connectWithRetry()
    } catch (error) {
      log(`Failed to connect to MongoDB after ${this.maxRetries} attempts`, "error")
      throw error
    }
  }

  async _connectWithRetry() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        family: 4,
      })

      this.connected = true
      this.connectionRetries = 0
      log("Connected to MongoDB", "success")

      this._setupEventHandlers()
    } catch (error) {
      this.connectionRetries++

      if (this.connectionRetries < this.maxRetries) {
        log(`Failed to connect to MongoDB. Retrying (${this.connectionRetries}/${this.maxRetries})...`, "warn")
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay))
        return this._connectWithRetry()
      }

      throw error
    }
  }

  _setupEventHandlers() {
    mongoose.connection.on("error", (error) => {
      log(`MongoDB connection error: ${error}`, "error")
      this.connected = false
      this._handleDisconnect()
    })

    mongoose.connection.on("disconnected", () => {
      log("MongoDB disconnected", "warn")
      this.connected = false
      this._handleDisconnect()
    })

    process.on("SIGINT", this.cleanup.bind(this))
    process.on("SIGTERM", this.cleanup.bind(this))
  }

  async _handleDisconnect() {
    if (!this.connected && this.connectionRetries < this.maxRetries) {
      this.connectionRetries++
      log(`Attempting to reconnect to MongoDB (${this.connectionRetries}/${this.maxRetries})...`, "info")
      await this._connectWithRetry()
    }
  }

  async cleanup() {
    if (this.connected) {
      try {
        await mongoose.connection.close()
        log("MongoDB connection closed", "info")
      } catch (error) {
        log(`Error closing MongoDB connection: ${error}`, "error")
      }
    }
  }

  isConnected() {
    return this.connected && mongoose.connection.readyState === 1
  }

  // Helper method for transactions
  async withTransaction(callback) {
    const session = await mongoose.startSession()
    try {
      session.startTransaction()
      const result = await callback(session)
      await session.commitTransaction()
      return result
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }
}

const db = new DatabaseManager()
export { db }

