const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { sendEmbed, replyEmbed } = require("../customSend.js");
const { findChannel } = require("../functions.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Seek help.")
    .addStringOption((option) =>
      option
        .setName("text")
        .setDescription("What do you need help with?")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone),
  async execute(interaction) {
    const helpChannel = findChannel(interaction, process.env.HELPCHANNELNAME);

    const text = interaction.options.getString("text");

    sendEmbed(helpChannel, {
      path: "help.postText",
      values: {
        user: interaction.user.id,
        text: text,
      },
      content: "Help Requested by User ID " + interaction.user.id,
    });

    sendEmbed(interaction.user, {
      path: "help.requestAcquired",
      values: {
        text: text,
      },
    });

    await replyEmbed(interaction, {
      path: "requestAcquired",
      ephemeral: true,
    });
  },
};
