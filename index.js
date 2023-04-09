require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  Collection,
} = require("discord.js");
const { deploy } = require("./deploy-commands");
const { commands } = require("./!commands/exclamationCommands");
// const { twitterStream } = require("./twitterStream");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// When we are ready, emit this.
client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  deploy();

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
  // twitterStream(client);

  setInterval(presence, 1000 * 60 * 60);
});

// For ! commands and funny replies.
client.on(Events.MessageCreate, async (message) => {
  await commands(message, client);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

// client.on("messageCreate", async (message) => {
//   if (message.type === "GUILD_MEMBER_JOIN") {
//     message.react("👋");

//     let memberRole = message.guild.roles.cache.find(
//       (r) => r.name === process.env.MEMBERROLENAME
//     );

//     if (!memberRole)
//       memberRole = await message.guild.roles
//         .create({
//           name: process.env.MEMBERROLENAME,
//           color: "BLUE",
//           reason: "For the members.",
//         })
//         .catch(console.error);

//     message.member.roles.add(memberRole);
//   }
// });

client.login(process.env.TOKEN); // Login bot using token.
