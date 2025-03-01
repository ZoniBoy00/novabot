import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { ownerOnly } from "../../utils/ownerUtils.js"
import { spawn } from "child_process"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const data = new SlashCommandBuilder().setName("restart").setDescription("Restart the bot (Owner Only)")

export async function execute(interaction) {
  // Check if user is owner
  const ownerCheck = ownerOnly(interaction)
  if (ownerCheck.error) {
    const errorEmbed = createEmbed({
      title: "Error",
      description: ownerCheck.message,
      color: "#FF0000",
    })
    return interaction.reply({ embeds: [errorEmbed], ephemeral: true })
  }

  const restartEmbed = createEmbed({
    title: "Bot Restart",
    description: "Bot is restarting...",
    color: "#FFA500",
  })

  await interaction.reply({ embeds: [restartEmbed] })

  // Get the path to the root directory
  const rootDir = join(__dirname, "..", "..")

  // Create a new process
  const child = spawn("node", ["index.js"], {
    cwd: rootDir,
    stdio: "inherit",
    detached: true,
  })

  // Unref the child process so the parent can exit
  child.unref()

  // Exit the current process
  process.exit()
}

