import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import config from "../../config.js"

export const data = new SlashCommandBuilder()
  .setName("userinfo")
  .setDescription("Display information about a user")
  .addUserOption((option) => option.setName("user").setDescription("The user to get info about").setRequired(false))

export async function execute(interaction) {
  const user = interaction.options.getUser("user") || interaction.user
  const member = await interaction.guild.members.fetch(user.id).catch(() => null)

  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle("User Information")
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      { name: "Username", value: user.tag, inline: true },
      { name: "ID", value: user.id, inline: true },
      {
        name: "Account Created",
        value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
        inline: true,
      },
    )

  if (member) {
    embed.addFields(
      {
        name: "Joined Server",
        value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
        inline: true,
      },
      {
        name: "Nickname",
        value: member.nickname || "None",
        inline: true,
      },
      {
        name: "Highest Role",
        value: member.roles.highest.toString(),
        inline: true,
      },
      {
        name: "Roles",
        value:
          member.roles.cache
            .filter((role) => role.id !== interaction.guild.id)
            .map((role) => role.toString())
            .join(", ") || "None",
      },
    )
  }

  await interaction.reply({ embeds: [embed] })
}

