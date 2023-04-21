const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const phpUnserialize = require("php-unserialize");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("usersetup")
    .setDescription(
      "Enter your Subtle credentials to setup your role and name."
    )
    .addStringOption((option) =>
      option
        .setName("email")
        .setDescription("Your Subtle email or username.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("password")
        .setDescription("Your Subtle password.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const username = interaction.options.getString("email");
    const password = interaction.options.getString("password");

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

      await replyMessage.edit(
        `Hi ${response.data.display_name}. We're fetching the appropriate roles for you.`
      );

      const memberProResponse = await axios.get(
        `https://subtle-subtitlers.org.uk/wp-content/plugins/indeed-membership-pro/apigate.php?ihch=${process.env.MEMBERPROSECRET}&action=user_get_details&uid=${response.data.user_id}`
      );

      const memberProData = memberProResponse.data.response;

      // Extract unique languages
      const languages = [
        memberProData.source_languages,
        memberProData.target_language,
        memberProData.pair1_source_language,
        memberProData.pair1_target_language,
        memberProData.pair2_source_language,
        memberProData.pair2_target_language,
        memberProData.pair3_source_language,
        memberProData.pair3_target_language,
        memberProData.pair4_source_language,
        memberProData.pair4_target_language,
        memberProData.pair5_source_language,
        memberProData.pair5_target_language,
        memberProData.other_language,
        memberProData.native_language,
      ]
        .filter((lang) => lang !== "")
        .map((lang) => {
          try {
            const deserializedArray = phpUnserialize.unserialize(lang); // Deserialize PHP serialized array
            return deserializedArray[0];
          } catch (error) {
            return null;
          }
        })
        .filter((lang) => lang !== null); // Filter out null values

      const uniqueLanguages = [...new Set(languages)];

      // Extract services and software used
      const services = memberProData.service
        ? Object.values(phpUnserialize.unserialize(memberProData.service))
        : [];
      const softwareUsed = memberProData.software_used
        ? memberProData.software_used.split("\r\n")
        : [];

      await joinRoles(interaction, uniqueLanguages);
      await joinRoles(interaction, services);
      await joinRoles(interaction, softwareUsed);

      console.log("Unique Languages: ", uniqueLanguages);
      console.log("Services: ", services);
      console.log("Software Used: ", softwareUsed);

      replyMessage.edit(
        `Welcome ${response.data.display_name}. You have been assigned your role.`
      );
    } catch (error) {
      if (error.response)
        switch (error.response.status) {
          case 401:
            replyMessage.edit("You got something wrong. Try again.");
            break;
          case 503:
            replyMessage.edit("Server seems to be busy. Try again later.");
            break;

          default:
            console.error(error);
            break;
        }
    }
  },
};

async function joinRoles(interaction, roleStringArray) {
  // Loop through services and update roles
  for (const roleString of roleStringArray) {
    const role = interaction.guild.roles.cache.find(
      (role) => role.name === roleString
    );
    if (!role) {
      // If role doesn't exist, create it
      const createdRole = await interaction.guild.roles.create({
        name: roleString,
      });
      console.log(`Role "${createdRole.name}" created!`);
      await interaction.member.roles.add(createdRole);
    } else {
      // If role already exists, join it
      await interaction.member.roles.add(role);
    }
  }
}
