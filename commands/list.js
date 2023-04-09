const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("list")
    .setDescription("[ADMIN] List people assigned this role.")
    .addRoleOption((option) =>
      option.setName("role").setDescription("Which role?").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const mentionedRole = interaction.options.getRole("role");

    let memberList = "";
    mentionedRole.members.map((role) => {
      memberList = memberList.concat(`${role.user.toString()}\n`);
    });

    interaction.reply({
      content: `${mentionedRole.toString()} has 
${memberList}`,
      ephemeral: true,
    });
  },
};
