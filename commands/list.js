const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

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

    const EMBED_DESC_LIMIT = 4096;

    // If the list is short enough, send in one embed
    if (memberList.length <= EMBED_DESC_LIMIT) {
      const embed = new EmbedBuilder()
        .setTitle(`${mentionedRole.name} Members (${mentionedRole.members.size})`)
        .setDescription(memberList || "No members found")
        .setColor(mentionedRole.color);

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    // If too long, split into multiple messages
    await interaction.reply({
      content: `${mentionedRole.toString()} has ${mentionedRole.members.size} members. Sending list in multiple messages...`,
      ephemeral: true,
    });

    const chunks = [];
    let currentChunk = "";

    mentionedRole.members.forEach((member) => {
      const line = `${member.user.toString()}\n`;
      if ((currentChunk + line).length > EMBED_DESC_LIMIT) {
        chunks.push(currentChunk);
        currentChunk = line;
      } else {
        currentChunk += line;
      }
    });

    if (currentChunk) chunks.push(currentChunk);

    for (let i = 0; i < chunks.length; i++) {
      const embed = new EmbedBuilder()
        .setTitle(`${mentionedRole.name} Members (Part ${i + 1}/${chunks.length})`)
        .setDescription(chunks[i])
        .setColor(mentionedRole.color);

      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
      });
    }
  },
};
