const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("channelinfo")
    .setDescription("What is this channel used for?")
    .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone),
  async execute(interaction) {
    await interaction
      .reply({
        content: interaction.channel.topic
          ? interaction.channel.topic
          : "No channel info.",
        ephemeral: true,
      })
      .catch((error) => {
        console.log(error);
      });
  },
};
