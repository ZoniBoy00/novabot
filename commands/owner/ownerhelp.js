import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { ownerOnly } from "../../utils/ownerUtils.js"
import { readdirSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const data = new SlashCommandBuilder()
  .setName("ownerhelp")
  .setDescription("Display detailed information about owner commands (Owner Only)")

export async function execute(interaction, client) {
  // Check if user is owner
  const ownerCheck = ownerOnly(interaction)
  if (ownerCheck.error) {
    const errorEmbed = createEmbed({
      title: "Error",
      description: ownerCheck.message,
      color: "#FF0000",
    })
    return interaction.reply({ embeds: [errorEmbed], flags: ["Ephemeral"] })
  }

  // Get all owner commands
  const ownerCommandsPath = join(__dirname)
  const commandFiles = readdirSync(ownerCommandsPath).filter((file) => file.endsWith(".js"))

  const fields = []

  for (const file of commandFiles) {
    const filePath = join(ownerCommandsPath, file)
    const command = await import(`file://${filePath}?update=${Date.now()}`)

    if ("data" in command) {
      const commandData = command.data.toJSON()
      fields.push({
        name: `/${commandData.name}`,
        value: `${commandData.description}
${commandData.options?.length ? `**Options:**\n${commandData.options.map((opt) => `• ${opt.name}: ${opt.description}`).join("\n")}` : ""}`,
      })
    }
  }

  const helpEmbed = createEmbed({
    title: "🛠️ Owner Commands",
    description: "These commands can only be used by the bot owner.",
    fields: [
      ...fields,
      {
        name: "⚠️ Important Commands",
        value: `**/eval** - Execute code (Use with caution)
**/restart** - Restart the bot
**/reload** - Reload specific commands
**/shutdown** - Safely shut down the bot
**/maintenance** - Toggle maintenance mode
**/reset-user** - Reset a user's data
**/reset-all** - Reset all users' data`,
      },
      {
        name: "💡 Tips",
        value: `• Always test commands in a safe environment
• Use /maintenance when making major changes
• Back up data before using reset commands
• Monitor logs after using powerful commands`,
      },
    ],
    color: "#FF0000",
    footer: {
      text: `⚠️ These commands are powerful and should be used with caution • Made with ❤️ by ZoniBoy00 (https://github.com/ZoniBoy00/novabot)`,
    },
  })

  await interaction.reply({ embeds: [helpEmbed], flags: ["Ephemeral"] })
}

