const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("[ADMIN] Server member stats.")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    let memberCountMessage = "";

    interaction.guild.roles.cache.forEach((role) => {
      memberCountMessage = memberCountMessage.concat(
        `${role.toString()} has ${role.members.size} people.\n`
      );
    });

    interaction.reply({
      content: `We have ${interaction.member.guild.memberCount} members in total. 
${memberCountMessage}\n`,
      ephemeral: true,
    });
  },
};
