import mongoose from "mongoose"
import { log } from "./logger.js"

class DatabaseManager {
  constructor() {
    this.connected = false
  }

  async connect() {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables")
    }

    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })

      this.connected = true
      log("Connected to MongoDB", "success")

      // Handle connection errors
      mongoose.connection.on("error", (error) => {
        log(`MongoDB connection error: ${error}`, "error")
      })

      mongoose.connection.on("disconnected", () => {
        log("MongoDB disconnected", "warn")
        this.connected = false
      })

      // Graceful shutdown
      process.on("SIGINT", this.cleanup.bind(this))
      process.on("SIGTERM", this.cleanup.bind(this))
    } catch (error) {
      log(`Failed to connect to MongoDB: ${error}`, "error")
      throw error
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
}

const db = new DatabaseManager()
export { db }

