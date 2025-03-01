import { REST, Routes } from "discord.js"
import { readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import "dotenv/config"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const commands = []
const foldersPath = join(__dirname, "commands")
const commandFolders = readdirSync(foldersPath)

for (const folder of commandFolders) {
  const commandsPath = join(foldersPath, folder)
  const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith(".js"))

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file)
    const command = await import(`file://${filePath}`)

    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON())
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
    }
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN)

try {
  console.log(`Started refreshing ${commands.length} application (/) commands.`)

  // The put method is used to fully refresh all commands
  const data = await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
    body: commands,
  })

  console.log(`Successfully reloaded ${data.length} application (/) commands.`)
} catch (error) {
  console.error(error)
}

