const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("usersetup")
    .setDescription(
      "Enter your Subtle credentials to setup your role and name."
    )
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("Your Subtle username.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("password")
        .setDescription("Your Subtle password.")
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option.setName("target_language").setDescription("Your target language.")
    ),
  async execute(interaction) {
    const username = interaction.options.getString("username");
    const password = interaction.options.getString("password");
    const languageRole = interaction.options.getRole("target_language");

    const replyMessage = await interaction.reply({
      content: "Waiting for Subtle's website to respond.",
      ephemeral: true,
    });

    try {
      const response = await axios.post(
        "https://subtle-subtitlers.org.uk/wp-json/discord-bot-link/v1/validateuser",
        {
          username: username,
          password: password,
        }
      );

      const memberRole = interaction.guild.roles.cache.find(
        (r) => r.name === process.env.MEMBERROLENAME
      );
      interaction.member.roles.add(memberRole);

      interaction.member
        .setNickname(response.data.display_name)
        .catch((error) => console.error(error));

      if (languageRole) interaction.member.roles.add(languageRole);

      replyMessage.edit(
        `Welcome ${response.data.display_name}. You have been assigned your role.`
      );
    } catch (error) {
      if (error.response && error.response.status === 401) {
        replyMessage.edit("You got something wrong. Try again.");
      } else {
        console.error(error);
      }
    }
  },
};
