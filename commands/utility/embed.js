import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js"

export const data = new SlashCommandBuilder()
  .setName("embed")
  .setDescription("Create and send an embedded message")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

const COLORS = {
  Blue: "#5865F2",
  Red: "#ED4245",
  Green: "#57F287",
  Yellow: "#FEE75C",
  Purple: "#9B59B6",
  Orange: "#E67E22",
  Default: "#5865F2",
}

export async function execute(interaction) {
  // Create a modal for the embed creation
  const modal = new ModalBuilder().setCustomId("embed-modal").setTitle("Create Embed Message")

  // Add components to modal
  const titleInput = new TextInputBuilder()
    .setCustomId("embed-title")
    .setLabel("Title")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("Enter embed title")
    .setMaxLength(256)

  const descriptionInput = new TextInputBuilder()
    .setCustomId("embed-description")
    .setLabel("Description")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder("Enter embed description")
    .setMaxLength(4000)

  const colorInput = new TextInputBuilder()
    .setCustomId("embed-color")
    .setLabel("Color")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("Blue, Red, Green, Yellow, Purple, Orange")

  const imageInput = new TextInputBuilder()
    .setCustomId("embed-image")
    .setLabel("Image URL (optional)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("https://example.com/image.png")

  const footerInput = new TextInputBuilder()
    .setCustomId("embed-footer")
    .setLabel("Footer (optional)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("Enter footer text")
    .setMaxLength(2048)

  // Add inputs to the modal
  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descriptionInput),
    new ActionRowBuilder().addComponents(colorInput),
    new ActionRowBuilder().addComponents(imageInput),
    new ActionRowBuilder().addComponents(footerInput),
  )

  // Show the modal to the user
  await interaction.showModal(modal)

  try {
    // Wait for modal submission
    const submission = await interaction.awaitModalSubmit({
      filter: (i) => i.customId === "embed-modal" && i.user.id === interaction.user.id,
      time: 300000, // 5 minutes
    })

    // Get values from the modal
    const title = submission.fields.getTextInputValue("embed-title")
    const description = submission.fields.getTextInputValue("embed-description")
    const colorChoice = submission.fields.getTextInputValue("embed-color")
    const imageUrl = submission.fields.getTextInputValue("embed-image")
    const footer = submission.fields.getTextInputValue("embed-footer")

    // Validate image URL if provided
    if (imageUrl && !isValidUrl(imageUrl)) {
      return submission.reply({
        content: "Please provide a valid image URL.",
        flags: ["Ephemeral"],
      })
    }

    // Create the embed
    const embed = new EmbedBuilder()
      .setColor(COLORS[colorChoice] || COLORS.Default)
      .setDescription(description)
      .setTimestamp()

    if (title) embed.setTitle(title)
    if (imageUrl) embed.setImage(imageUrl)
    if (footer) embed.setFooter({ text: footer })

    // Create buttons for the user to choose where to send the embed
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("send-here").setLabel("Send Here").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("send-channel").setLabel("Choose Channel").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("cancel-embed").setLabel("Cancel").setStyle(ButtonStyle.Danger),
    )

    // Send preview
    const previewMessage = await submission.reply({
      content: "📝 **Preview of your embed:**",
      embeds: [embed],
      components: [row],
      flags: ["Ephemeral"],
    })

    // Create collector for buttons
    const collector = previewMessage.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 300000, // 5 minutes
    })

    collector.on("collect", async (i) => {
      switch (i.customId) {
        case "send-here":
          await interaction.channel.send({ embeds: [embed] })
          await i.update({
            content: "✅ Embed sent successfully!",
            embeds: [],
            components: [],
          })
          collector.stop()
          break

        case "send-channel":
          await i.update({
            content: "Please mention the channel where you want to send this embed (#channel-name).",
            components: [],
          })

          try {
            const channelResponse = await interaction.channel.awaitMessages({
              filter: (m) => m.author.id === interaction.user.id && m.mentions.channels.size > 0,
              max: 1,
              time: 30000,
              errors: ["time"],
            })

            const targetChannel = channelResponse.first().mentions.channels.first()

            // Check if bot has permission to send messages in the target channel
            if (!targetChannel.permissionsFor(interaction.guild.members.me).has("SendMessages")) {
              await submission.editReply({
                content: "❌ I don't have permission to send messages in that channel.",
                embeds: [],
                components: [],
              })
              return
            }

            await targetChannel.send({ embeds: [embed] })
            await channelResponse
              .first()
              .delete()
              .catch(() => {})
            await submission.editReply({
              content: `✅ Embed sent to ${targetChannel}!`,
              embeds: [],
              components: [],
            })
          } catch (error) {
            await submission.editReply({
              content: "❌ No channel was mentioned or the request timed out.",
              embeds: [],
              components: [],
            })
          }
          collector.stop()
          break

        case "cancel-embed":
          await i.update({
            content: "❌ Embed creation cancelled.",
            embeds: [],
            components: [],
          })
          collector.stop()
          break
      }
    })

    collector.on("end", async (collected, reason) => {
      if (reason === "time") {
        await submission.editReply({
          content: "⏰ Embed creation timed out.",
          embeds: [],
          components: [],
        })
      }
    })
  } catch (error) {
    console.error(error)
    if (error.code === "InteractionCollectorError") {
      await interaction.followUp({
        content: "⏰ Embed creation timed out.",
        flags: ["Ephemeral"],
      })
    } else {
      await interaction.followUp({
        content: "❌ There was an error creating the embed.",
        flags: ["Ephemeral"],
      })
    }
  }
}

function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

