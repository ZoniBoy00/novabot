import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import config from "../../config.js"
import { isOwner } from "../../utils/ownerUtils.js"

export const data = new SlashCommandBuilder()
  .setName("guide")
  .setDescription("Shows a comprehensive guide on how to use NovaBot")

export async function execute(interaction) {
  const isOwnerUser = isOwner(interaction.user.id)

  const mainEmbed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle("📚 NovaBot Complete Guide")
    .setDescription("Welcome to NovaBot! This guide will help you understand all the features and commands available.")
    .addFields(
      {
        name: "🎵 Music System",
        value: `\`/play\` - Play music from YouTube/Spotify
\`/queue\` - View the current queue
\`/skip\` - Skip the current song
\`/stop\` - Stop playback
\`/pause\` - Pause the current song
\`/resume\` - Resume paused music
\`/volume\` - Adjust volume (0-100)
\`/seek\` - Jump to specific timestamp
\`/loop\` - Toggle loop mode
\`/shuffle\` - Shuffle the queue
\`/nowplaying\` - Show current song`,
      },
      {
        name: "🛡️ Moderation",
        value: `\`/ban\` - Ban a user
\`/kick\` - Kick a user
\`/mute\` - Timeout a user
\`/warn\` - Warn a user
\`/clear\` - Clear messages
\`/userinfo\` - View user details`,
      },
      {
        name: "🔧 Utility",
        value: `\`/help\` - Show commands by category
\`/ping\` - Check bot latency
\`/server-info\` - Server information
\`/stats\` - Bot statistics
\`/embed\` - Create embedded messages
\`/guide\` - Show this guide`,
      },
      {
        name: "⭐ Level System",
        value: `\`/rank\` - Check your or another user's rank
\`/leaderboard\` - View the XP leaderboard
• Earn XP by chatting
• Level up and compete with others`,
      },
      {
        name: "💹 Cryptocurrency",
        value: `\`/crypto\` - Check cryptocurrency prices
• Real-time price data
• Multiple currencies (USD/EUR/GBP)
• 24h price changes`,
      },
      {
        name: "💰 Economy & Games",
        value: `\`/balance\` - Check your balance
\`/daily\` - Get daily rewards
\`/work\` - Work for money
\`/shop\` - View available businesses
\`/buy\` - Purchase a business
\`/businesses\` - View your business empire
\`/collect\` - Collect business income
\`/upgrade\` - Upgrade your businesses
\`/blackjack\` - Play blackjack
\`/slots\` - Try the slot machine
\`/coinflip\` - Flip a coin
\`/rob\` - Rob other users
\`/give\` - Give money to others
\`/richest\` - View wealthiest users`,
      },
    )
    .setFooter({ text: "Tip: Use /help [category] for detailed command information" })

  // Add owner commands section if the user is the owner
  if (isOwnerUser) {
    mainEmbed.addFields({
      name: "👑 Owner Commands",
      value: `\`/eval\` - Execute code
\`/restart\` - Restart the bot
\`/reload\` - Reload commands
\`/shutdown\` - Shutdown the bot
\`/maintenance\` - Toggle maintenance mode
\`/reset-user\` - Reset a user's data
\`/reset-all\` - Reset all users' data
\`/ownerhelp\` - Detailed owner help`,
    })
  }

  const featuresEmbed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle("🌟 Features & Tips")
    .addFields(
      {
        name: "🎵 Music Features",
        value: `• Supports YouTube and Spotify
• Volume control and seeking
• Queue management and shuffling
• Loop modes (song/queue)
• High-quality playback`,
      },
      {
        name: "🛡️ Moderation Features",
        value: `• Detailed logging system
• Customizable timeouts
• Warning system
• Bulk message deletion
• User tracking`,
      },
      {
        name: "⚙️ General Features",
        value: `• Slash command support
• Custom embed creation
• Server statistics
• Real-time status updates
• Automatic error handling`,
      },
      {
        name: "💡 Tips",
        value: `• Use \`/help [category]\` for detailed command info
• Check \`/stats\` for bot status
• Moderators can use \`/embed\` for announcements
• Music commands work in any voice channel
• Some commands have additional options`,
      },
      {
        name: "⭐ Level System Features",
        value: `• Automatic XP gain from chatting
• Level-up notifications
• XP cooldown system
• Server-specific rankings
• Detailed progress tracking`,
      },
      {
        name: "💹 Crypto Features",
        value: `• Real-time cryptocurrency prices
• Multiple currency support
• Market cap information
• 24-hour price changes
• Powered by CoinGecko API`,
      },
      {
        name: "💰 Economy Features",
        value: `• Daily rewards system
• Multiple ways to earn
• Casino games with fair odds
• Player interaction
• Leaderboard system
• Anti-cheat measures`,
      },
    )
    .setFooter({ text: "NovaBot • Made with ❤️" })

  const setupEmbed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle("🔧 Setup Guide")
    .addFields(
      {
        name: "🎵 Music Setup",
        value: `1. Join a voice channel
2. Use \`/play\` with a song name or URL
3. Adjust volume with \`/volume\`
4. Manage queue with \`/queue\``,
      },
      {
        name: "🛡️ Moderation Setup",
        value: `1. Ensure bot has proper permissions
2. Mod-logs channel will be created automatically
3. Set up moderator roles in your server
4. Test commands with low-risk actions first`,
      },
      {
        name: "📝 Permissions Needed",
        value: `• Manage Messages
• Kick/Ban Members
• Manage Channels
• Connect/Speak (for music)
• View Audit Log
• Send Messages/Embeds`,
      },
      {
        name: "⚠️ Important Notes",
        value: `• Keep bot role above managed roles
• Some commands require specific permissions
• Mod-logs are server-specific
• Music works in any voice channel
• Commands use Discord's slash system`,
      },
    )
    .setFooter({ text: "Need more help? Use /help for specific commands" })

  // Send all embeds
  await interaction.reply({ embeds: [mainEmbed, featuresEmbed, setupEmbed] })
}

