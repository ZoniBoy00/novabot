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
        name: "🛡️ Moderation & Logging",
        value: `\`/ban\` - Ban a user
\`/kick\` - Kick a user
\`/mute\` - Timeout a user
\`/warn\` - Warn a user
\`/clear\` - Clear messages
\`/userinfo\` - View user details

**Log Channels:**
• mod-logs - Moderation actions
• message-logs - Message edits/deletions
• server-logs - Server changes
• join-logs - Member join/leave
• voice-logs - Voice activity
• member-logs - Member updates`,
      },
      {
        name: "🎫 Ticket System",
        value: `• Create support tickets
• Automatic ticket channels
• Ticket transcripts
• Ticket categories
• Staff management
• Ticket statistics`,
      },
      {
        name: "🎭 Reaction Roles",
        value: `• Button-based role assignment
• Multiple role configurations
• Custom role messages
• Role categories
• Toggle roles
• Role statistics`,
      },
      {
        name: "👋 Welcome System",
        value: `• Custom welcome messages
• Welcome images
• Goodbye messages
• Member statistics
• Join/leave tracking
• Server milestones`,
      },
      {
        name: "🛡️ Auto-Moderation",
        value: `• Spam protection
• Mention limits
• Invite link filtering
• Duplicate message detection
• Word blacklisting
• Raid protection`,
      },
      {
        name: "⭐ Level System",
        value: `\`/rank\` - Check your or another user's rank
\`/leaderboard\` - View the XP leaderboard
• Earn XP by chatting
• Level up and compete with others
• Custom level roles
• Activity tracking
• Voice XP
• Weekly rankings`,
      },
      {
        name: "💹 Cryptocurrency",
        value: `\`/crypto\` - Check cryptocurrency prices
• Real-time price data
• Multiple currencies (USD/EUR/GBP)
• Price alerts
• Market statistics
• Trading volume`,
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
    .setFooter({ text: `Made with ❤️ by ZoniBoy00 (https://github.com/ZoniBoy00/novabot)` })

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

  const setupEmbed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle("🔧 Setup Guide")
    .addFields(
      {
        name: "📝 Initial Setup",
        value: `1. Ensure bot has proper permissions
2. Log channels will be created automatically
3. Set up moderator roles in your server
4. Configure welcome messages
5. Set up reaction roles
6. Configure auto-moderation`,
      },
      {
        name: "🎫 Ticket System Setup",
        value: `1. Create a ticket panel using \`/ticket-setup\`
2. Configure ticket categories
3. Set support team roles
4. Customize ticket messages
5. Set up ticket logs`,
      },
      {
        name: "🛡️ Auto-Mod Setup",
        value: `1. Configure spam protection
2. Set mention limits
3. Add filtered words
4. Set invite link permissions
5. Configure raid protection
6. Set punishment actions`,
      },
      {
        name: "📝 Permissions Needed",
        value: `• Manage Messages
• Kick/Ban Members
• Manage Channels
• Connect/Speak (for music)
• View Audit Log
• Send Messages/Embeds
• Manage Roles
• Create Public/Private Threads`,
      },
    )
    .setFooter({ text: `Made with ❤️ by ZoniBoy00 (https://github.com/ZoniBoy00/novabot)` })

  // Send all embeds
  await interaction.reply({ embeds: [mainEmbed, setupEmbed] })
}

