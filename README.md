# 🤖 NovaBot

![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

A feature-rich Discord bot with economy, leveling, moderation, and utility features to enhance your server experience.

## ✨ Features

- 💰 **Economy System** - Currency, businesses, games, and more
- ⭐ **Level System** - XP, ranks, and leaderboards
- 🛡️ **Moderation Tools** - Ban, kick, mute, warn, and message management
- 🔧 **Utility Commands** - Server info, user info, embeds, and more
- 💹 **Cryptocurrency** - Real-time crypto price information
- 🎵 **Music System** - Currently under maintenance

## 📋 Table of Contents

- [Requirements](#-requirements)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Commands](#-commands)
- [Known Issues](#-known-issues)
- [License](#-license)

## 📦 Requirements

- Node.js 16.9.0 or higher
- MongoDB database
- Discord Bot Token
- FFmpeg (for music functionality when available)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ZoniBoy00/novabot.git
   cd novabot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a `.env` file in the root directory with the following variables:**
   ```
   DISCORD_TOKEN=your_discord_bot_token
   CLIENT_ID=your_discord_application_id
   OWNER_ID=your_discord_user_id
   MONGODB_URI=your_mongodb_connection_string
   ```

4. **Deploy slash commands**
   ```bash
   node deploy-commands.js
   ```

5. **Start the bot**
   ```bash
   node index.js
   ```
   
   Alternatively, use nodemon for development:
   ```bash
   npx nodemon
   ```

## ⚙️ Configuration

The bot's configuration is managed through the `config.js` file and environment variables. Key settings include:

- **Bot Token**: Your Discord bot token
- **Client ID**: Your Discord application ID
- **Owner ID**: Your Discord user ID for owner-only commands
- **Embed Color**: Default color for embeds
- **Log Channel**: Channel name for moderation logs

## 🎮 Usage

Once the bot is running and invited to your server, you can interact with it using slash commands. Type `/` in any channel where the bot has permission to see the list of available commands.

### Inviting the Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Navigate to the "OAuth2" tab
4. Select the "bot" and "applications.commands" scopes
5. Select the required permissions
6. Use the generated URL to invite the bot to your server

## ⚠️ Known Issues

- **Music System**: The music system is currently under maintenance and not functioning. We are working to improve and restore this feature as soon as possible. If anyone knows how to resolve this, your help would be appreciated!
- **Rate Limits**: The cryptocurrency API may occasionally hit rate limits with frequent requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/ZoniBoy00/novabot/blob/main/LICENSE) file for details.

## Buy Me A Coffee ☕

Support the development of this tool by buying me a coffee! Your contributions help keep projects like this alive.  
[Donate](https://buymeacoffee.com/zoniboy00)

---

Made with ❤️ by ZoniBoy00
