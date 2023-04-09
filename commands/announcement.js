const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { replyEmbed } = require("../customSend.js");
const { findChannel } = require("../functions.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("announcement")
    .setDescription("[ADMIN] Make announcement to the announcement channel.")
    .addStringOption((option) =>
      option
        .setName("text")
        .setDescription("Enter an announcement.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const text = interaction.options.getString("text");

    await findChannel(interaction, process.env.ANNOUNCEMENTSCHANNELNAME).send({
      embeds: [
        {
          color: process.env.EMBEDCOLOR,
          title: "Announcement",
          description: text,
        },
      ],
    });

    await replyEmbed(interaction, { path: "requestAcquired", ephemeral: true });
  },
};
