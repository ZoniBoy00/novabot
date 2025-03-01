import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
  } from "@discordjs/voice"
  import play from "play-dl"
  import SpotifyWebApi from "spotify-web-api-node"
  import config from "../config.js"
  
  export class MusicPlayer {
    constructor(client) {
      this.client = client
      this.queues = new Map()
      this.players = new Map()
      this.connections = new Map()
  
      // Initialize Spotify API if credentials are provided
      if (config.spotifyClientId && config.spotifyClientSecret) {
        this.spotify = new SpotifyWebApi({
          clientId: config.spotifyClientId,
          clientSecret: config.spotifyClientSecret,
        })
  
        // Get an access token
        this.refreshSpotifyToken()
  
        // Refresh token every hour
        setInterval(() => this.refreshSpotifyToken(), 3600 * 1000)
      }
    }
  
    async refreshSpotifyToken() {
      try {
        const data = await this.spotify.clientCredentialsGrant()
        this.spotify.setAccessToken(data.body.access_token)
        console.log("Spotify access token refreshed")
      } catch (error) {
        console.error("Error refreshing Spotify token:", error)
      }
    }
  
    getQueue(guildId) {
      if (!this.queues.has(guildId)) {
        this.queues.set(guildId, {
          songs: [],
          volume: 100,
          playing: false,
          loop: "off", // off, song, queue
        })
      }
      return this.queues.get(guildId)
    }
  
    async play(interaction, query, voiceChannel) {
      try {
        let songInfo
  
        // Check if the query is a Spotify URL
        if (query.includes("spotify.com") && this.spotify) {
          songInfo = await this.handleSpotifyUrl(query)
        } else {
          // Handle YouTube or search query
          const searchResults = await play.search(query, { limit: 1 })
  
          if (!searchResults || searchResults.length === 0) {
            return { success: false, message: "No results found for your query." }
          }
  
          const video = searchResults[0]
  
          songInfo = {
            title: video.title,
            url: video.url,
            duration: this.formatDuration(video.durationInSec),
            thumbnail: video.thumbnails[0].url,
          }
        }
  
        const queue = this.getQueue(interaction.guild.id)
  
        // Add the song to the queue
        queue.songs.push(songInfo)
  
        // If not already playing, start playing
        if (!queue.playing) {
          queue.playing = true
  
          // Join the voice channel
          const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
          })
  
          this.connections.set(interaction.guild.id, connection)
  
          // Handle connection errors
          connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
              await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
              ])
              // Seems to be reconnecting to a new channel
            } catch (error) {
              // Seems to be a real disconnect which SHOULDN'T be recovered from
              this.stop(interaction.guild.id)
            }
          })
  
          // Start playing
          await this.processQueue(interaction.guild.id)
        }
  
        return { success: true, song: songInfo }
      } catch (error) {
        console.error("Error playing song:", error)
        return { success: false, message: "There was an error playing that song." }
      }
    }
  
    async handleSpotifyUrl(url) {
      try {
        // Extract the Spotify track ID from the URL
        const match = url.match(/track\/([a-zA-Z0-9]+)/)
  
        if (!match) {
          throw new Error("Invalid Spotify URL")
        }
  
        const trackId = match[1]
        const trackData = await this.spotify.getTrack(trackId)
  
        const track = trackData.body
        const searchQuery = `${track.name} ${track.artists[0].name}`
  
        // Search for the track on YouTube
        const searchResults = await play.search(searchQuery, { limit: 1 })
  
        if (!searchResults || searchResults.length === 0) {
          throw new Error("No YouTube results found for this Spotify track.")
        }
  
        const video = searchResults[0]
  
        return {
          title: `${track.name} - ${track.artists[0].name}`,
          url: video.url,
          duration: this.formatDuration(video.durationInSec),
          thumbnail: video.thumbnails[0].url,
        }
      } catch (error) {
        console.error("Error handling Spotify URL:", error)
        throw error
      }
    }
  
    async processQueue(guildId) {
      const queue = this.getQueue(guildId)
  
      if (queue.songs.length === 0) {
        queue.playing = false
        this.connections.get(guildId)?.disconnect()
        this.connections.delete(guildId)
        this.players.delete(guildId)
        return
      }
  
      const song = queue.songs[0]
  
      try {
        // Get stream with higher quality
        const stream = await play.stream(song.url, {
          discordPlayerCompatibility: true,
          quality: 2, // Higher quality
        })
  
        // Create audio resource with proper settings
        const resource = createAudioResource(stream.stream, {
          inputType: stream.type,
          inlineVolume: true,
          silencePaddingFrames: 5, // Add silence padding
        })
  
        // Set volume
        resource.volume.setVolume(queue.volume / 100)
  
        // Create audio player if it doesn't exist
        if (!this.players.has(guildId)) {
          const player = createAudioPlayer({
            behaviors: {
              noSubscriber: "pause", // Pause when no one is listening
            },
          })
          this.players.set(guildId, player)
  
          // Subscribe connection to player
          const connection = this.connections.get(guildId)
          if (connection) {
            connection.subscribe(player)
          }
  
          // Handle player state changes
          player.on(AudioPlayerStatus.Idle, () => {
            if (queue.loop === "song") {
              queue.songs.unshift(song)
            } else if (queue.loop === "off") {
              queue.songs.shift()
            }
            this.processQueue(guildId)
          })
  
          player.on("error", (error) => {
            console.error("Error in audio player:", error)
            queue.songs.shift()
            this.processQueue(guildId)
          })
        }
  
        // Play the song
        this.players.get(guildId).play(resource)
      } catch (error) {
        console.error("Error processing queue:", error)
        if (error.message.includes("FFmpeg/avconv not found")) {
          console.error(
            "FFmpeg is not installed or not in PATH. Please install FFmpeg: https://github.com/BtbN/FFmpeg-Builds/releases",
          )
          const channel = this.client.channels.cache.get(queue.textChannel)
          if (channel) {
            channel.send({
              content: "❌ Error: FFmpeg is not installed. Please contact the bot administrator.",
              ephemeral: true,
            })
          }
        }
        queue.songs.shift()
        this.processQueue(guildId)
      }
    }
  
    async skip(guildId) {
      const queue = this.getQueue(guildId)
  
      if (queue.songs.length <= 1) {
        return this.stop(guildId)
      }
  
      // Remove the current song and play the next one
      queue.songs.shift()
      this.players.get(guildId)?.stop()
    }
  
    async stop(guildId) {
      const queue = this.getQueue(guildId)
  
      // Clear the queue
      queue.songs = []
      queue.playing = false
  
      // Stop the player
      this.players.get(guildId)?.stop()
      this.players.delete(guildId)
  
      // Disconnect from the voice channel
      this.connections.get(guildId)?.disconnect()
      this.connections.delete(guildId)
    }
  
    async setVolume(guildId, volume) {
      const queue = this.getQueue(guildId)
      if (!queue) return false
  
      queue.volume = volume
      const resource = this.players.get(guildId)?.state?.resource
      if (resource) {
        resource.volume.setVolume(volume / 100)
      }
      return true
    }
  
    async seek(guildId, seconds) {
      const queue = this.getQueue(guildId)
      if (!queue || !queue.songs[0]) return false
  
      try {
        const stream = await play.stream(queue.songs[0].url, { seek: seconds })
        const resource = createAudioResource(stream.stream, {
          inputType: stream.type,
          inlineVolume: true,
        })
        resource.volume.setVolume(queue.volume / 100)
        this.players.get(guildId)?.play(resource)
        return true
      } catch (error) {
        console.error("Error seeking:", error)
        return false
      }
    }
  
    async setLoop(guildId, mode) {
      const queue = this.getQueue(guildId)
      if (!queue) return false
  
      queue.loop = mode
      return true
    }
  
    async shuffle(guildId) {
      const queue = this.getQueue(guildId)
      if (!queue || queue.songs.length <= 1) return false
  
      // Keep the first song (currently playing) and shuffle the rest
      const currentSong = queue.songs[0]
      const remainingSongs = queue.songs.slice(1)
  
      for (let i = remainingSongs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[remainingSongs[i], remainingSongs[j]] = [remainingSongs[j], remainingSongs[i]]
      }
  
      queue.songs = [currentSong, ...remainingSongs]
      return true
    }
  
    createProgressBar(guildId) {
      const queue = this.getQueue(guildId)
      if (!queue || !queue.songs[0]) return "No song playing"
  
      const player = this.players.get(guildId)
      if (!player) return "No player found"
  
      const currentTime = player.state.resource?.playbackDuration || 0
      const totalTime = this.durationToMs(queue.songs[0].duration)
      const progress = Math.min((currentTime / totalTime) * 30, 30)
  
      const progressBar = "▬".repeat(Math.floor(progress)) + "🔘" + "▬".repeat(30 - Math.floor(progress))
      const timeString = `${this.formatTime(currentTime)} / ${queue.songs[0].duration}`
  
      return `${progressBar}\n${timeString}`
    }
  
    durationToMs(duration) {
      const parts = duration.split(":").map(Number)
      if (parts.length === 2) {
        return (parts[0] * 60 + parts[1]) * 1000
      }
      return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000
    }
  
    formatDuration(seconds) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`
    }
  
    formatTime(ms) {
      const seconds = Math.floor(ms / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
  
      if (hours > 0) {
        return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
      }
      return `${minutes}:${String(seconds % 60).padStart(2, "0")}`
    }
  
    async pause(guildId) {
      const player = this.players.get(guildId)
      if (player) {
        player.pause()
        return true
      }
      return false
    }
  
    async resume(guildId) {
      const player = this.players.get(guildId)
      if (player) {
        player.unpause()
        return true
      }
      return false
    }
  }
  
  