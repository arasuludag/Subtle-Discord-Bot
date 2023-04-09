module.exports = {
  // Getting and turning project name into Discords channel format. Ex. 'Hede Hodo' into 'hede-hodo'
  discordStyleProjectName: (project) => {
    const pName = project
      .replace(/ - /g, "-")
      .replace(/&/g, "and")
      .replace(
        /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$£€%&()*+,./:;<=>?@[\]^`{|}~¡¿]/g,
        ""
      )
      .trim()
      .replace(/\s+/g, "-")
      .replace(/_/g, "-")
      .toLowerCase();

    if (pName.replace(/-/g, "").length == 0) throw "ChannelNameError";
    return pName;
  },

  // Finds channel by name.
  findChannel: (message, channelName) => {
    return message.guild.channels.cache.find(
      (channel) => channel.name === channelName && channel.type === 0
    );
  },

  // Finds channel by ID.
  findChannelByID: (message, channelID) => {
    return message.guild.channels.cache.find(
      (channel) => channel.id === channelID && channel.type === 0
    );
  },

  // Find category by name.
  findCategoryByName: (message, channelName) => {
    return message.guild.channels.cache.find(
      (c) => c.name == channelName && c.type === 4
    );
  },

  // Finds channel by ID.
  findUserByID: (client, userID) => {
    return client.users.fetch(userID);
  },
};
