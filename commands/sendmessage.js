const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { replyEmbed } = require("../customSend.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sendmessage")
    .setDescription("[ADMIN] Send a message to a particular channel as Sassy.")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("No takebacks.")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option.setName("channel").setDescription("To where?").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("title").setDescription("You can set a title.")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const mentionedChannel = interaction.options.getChannel("channel");

    const message = interaction.options.getString("message");
    const title = interaction.options.getString("title");

    mentionedChannel
      .send({
        embeds: [
          {
            color: process.env.EMBEDCOLOR,
            title: title ? title : undefined,
            description: message,
          },
        ],
      })
      .catch(console.error);

    await replyEmbed(interaction, { path: "requestAcquired", ephemeral: true });
  },
};
