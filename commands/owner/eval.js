import { SlashCommandBuilder } from "discord.js"
import { createEmbed } from "../../utils/embedBuilder.js"
import { ownerOnly } from "../../utils/ownerUtils.js"
import { inspect } from "util"

export const data = new SlashCommandBuilder()
  .setName("eval")
  .setDescription("Evaluate JavaScript code (Owner Only)")
  .addStringOption((option) => option.setName("code").setDescription("The code to evaluate").setRequired(true))

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

  const code = interaction.options.getString("code")

  try {
    // Create a function from the code string
    const evaled = eval(code)
    const cleaned = await clean(evaled)

    const resultEmbed = createEmbed({
      title: "Eval Result",
      description: `\`\`\`js\n${cleaned}\n\`\`\``,
      fields: [
        {
          name: "Type",
          value: `\`\`\`ts\n${typeof evaled}\n\`\`\``,
        },
      ],
      color: "#00FF00",
    })

    await interaction.reply({ embeds: [resultEmbed], flags: ["Ephemeral"] })
  } catch (err) {
    const errorEmbed = createEmbed({
      title: "Error",
      description: `\`\`\`js\n${await clean(err)}\n\`\`\``,
      color: "#FF0000",
    })

    await interaction.reply({ embeds: [errorEmbed], flags: ["Ephemeral"] })
  }
}

async function clean(text) {
  if (text && text.constructor.name == "Promise") text = await text
  if (typeof text !== "string") text = inspect(text, { depth: 1 })

  text = text
    .replace(/`/g, "`" + String.fromCharCode(8203))
    .replace(/@/g, "@" + String.fromCharCode(8203))
    .replace(process.env.DISCORD_TOKEN, "[REDACTED]")

  return text
}

