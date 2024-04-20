const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { ButtonBuilder, ActionRowBuilder } = require("discord.js");
const { getEmbed, replyEmbed } = require("../customSend.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("custompoll")
    .setDescription("Create a poll.")
    .addStringOption((option) =>
      option
        .setName("poll_text")
        .setDescription("What are you polling?")
        .setRequired(true)
    )

    .addStringOption((option) =>
      option
        .setName("options")
        .setDescription("Seperate your options with '-'")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("time_limit")
        .setDescription("When should the poll close? (In minutes)")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone),
  async execute(interaction) {
    const timeLimit = interaction.options.getInteger("time_limit") * 60 * 1000;

    const splitMessage = await interaction.options
      .getString("options")
      .split("-")
      .filter((n) => n);

    if (splitMessage.length > 5) {
      await replyEmbed(interaction, { path: "poll.tooMany", ephemeral: true });
      return;
    }

    const pollText = await interaction.options.getString("poll_text");

    let options = [];
    splitMessage.map((option, i) => {
      options[i] = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(i + " " + interaction.id)
          .setLabel(option)
          .setStyle("Primary")
      );
    });

    const userNickname = interaction.guild.members.cache.find(
      (a) => a.user === interaction.user
    ).nickname;

    const endButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("End " + interaction.id)
        .setLabel("End Poll")
        .setStyle("Danger")
    );

    await interaction.reply({
      components: [endButton],
      ephemeral: true,
    });

    await interaction.channel
      .send({
        embeds: [
          {
            color: process.env.EMBEDCOLOR,
            title: "Poll",
            author: {
              name: userNickname ? userNickname : interaction.user.username,
              icon_url: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png?size=256`,
            },
            description: pollText,
          },
        ],
        components: options,
      })
      .then(async (replyMessage) => {
        const filter = (i) => interaction.id === i.customId.split(" ")[1];
        const collector = interaction.channel.createMessageComponentCollector({
          filter,
          time: timeLimit,
          idle: timeLimit ? undefined : 86400000,
        });

        let pollCount = [];
        let fields = [];
        let pollResultMessage = {
          embeds: [
            {
              color: process.env.EMBEDCOLOR,
              title: "Poll",
              author: {
                name: userNickname ? userNickname : interaction.user.username,
                icon_url: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png?size=256`,
              },
              description: pollText,
              fields: fields,
            },
          ],
        };

        collector.on("collect", async (i) => {
          let votes = Array(splitMessage.length).fill(0);
          const index = i.customId.split(" ")[0];

          if (index === "End") {
            collector.stop();
            return;
          }

          const found = await pollCount.find(
            (vote) => vote.userID === i.user.id
          );

          if (found) found.index = index;
          else pollCount.push({ index: index, userID: i.user.id });

          for (let vote of pollCount) {
            votes[vote.index]++;
          }

          fields = [];
          for (let index = 0; index < splitMessage.length; index++) {
            fields.push({
              name: splitMessage[index],
              value: votes[index].toString(),
              inline: true,
            });
          }

          pollResultMessage = {
            embeds: [
              {
                color: process.env.EMBEDCOLOR,
                title: "Poll",
                author: {
                  name: userNickname ? userNickname : interaction.user.username,
                  icon_url: `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png?size=256`,
                },
                description: pollText,
                fields: fields,
              },
            ],
          };

          await i.update(pollResultMessage).catch(() => {
            console.log("Custom poll message update failed.");
          });
        });

        collector.on("end", async () => {
          await replyMessage
            .edit({
              components: [],
            })
            .then(async (replyMessage) => {
              await replyEmbed(replyMessage, { path: "poll.ended" });
              await replyMessage.channel.send(pollResultMessage);
            })
            .catch(() => {
              console.log("Custom poll ephemeral result edit failed.");
            });
          await interaction
            .editReply(
              getEmbed({
                path: "poll.ended",
                ephemeral: true,
                components: [],
              })
            )
            .catch(() => {
              console.log("Custom poll ephemeral message edit failed.");
            });
        });
      });
  },
};
