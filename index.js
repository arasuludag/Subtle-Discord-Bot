require("dotenv").config();
const { Client, Intents } = require("discord.js");
const { twitterStream } = require("./twitterStream");

const myIntents = new Intents();
myIntents.add(Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS);
const client = new Client({
  intents: myIntents,
});

// When we are ready, emit this.
client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  function presence() {
    client.user.setPresence({
      status: "idle",
      activities: [
        {
          name: "News",
          type: "WATCHING",
        },
      ],
    });
  }

  presence();
  twitterStream(client);

  setInterval(presence, 1000 * 60 * 60);
});

client.on("messageCreate", async (message) => {
  if (message.type === "GUILD_MEMBER_JOIN") {
    message.react("👋");

    let memberRole = message.guild.roles.cache.find(
      (r) => r.name === process.env.MEMBERROLENAME
    );

    if (!memberRole)
      memberRole = await message.guild.roles
        .create({
          name: process.env.MEMBERROLENAME,
          color: "BLUE",
          reason: "For the members.",
        })
        .catch(console.error);

    message.member.roles.add(memberRole);
  }
});

client.login(process.env.TOKEN); // Login bot using token.
