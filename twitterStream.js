const { ETwitterStreamEvent, TwitterApi } = require("twitter-api-v2");

const client = new TwitterApi({
  appKey: process.env.TWITTER_CONSUMER_KEY,
  appSecret: process.env.TWITTER_CONSUMER_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

async function twitterStream(discordClient) {
  const stream = await client.v1.stream.getStream("statuses/filter.json", {
    follow: process.env.TWITTERIDS.split(","),
  });

  function sendMessage(message) {
    discordClient.guilds.cache.forEach((guild) => {
      const channel = guild.channels.cache.find(
        (c) =>
          c.type === "GUILD_TEXT" &&
          guild.me.permissionsIn(c).has("SEND_MESSAGES") &&
          c.name === process.env.NEWSCHANNELNAME
      );
      if (channel)
        channel
          .send(message)
          .then(() => console.log(`Sent on ${guild.name} - ${channel.name}`))
          .catch(console.error);
      else
        console.log(
          "On guild " +
            guild.name +
            " I could not find a channel where I can type."
        );
    });
  }

  // Emitted on Tweet
  stream.on(ETwitterStreamEvent.Data, async (tweet) => {
    if (
      tweet.user &&
      process.env.TWITTERIDS.split(",").some(
        (id) => tweet.user.id_str === id
      ) &&
      !tweet.in_reply_to_status_id
    ) {
      if (tweet.retweeted_status) {
        sendMessage(
          `${tweet.user.screen_name} retweeted: https://twitter.com/${tweet.retweeted_status.user.screen_name}/status/${tweet.retweeted_status.id_str}`
        );
      } else {
        sendMessage(
          `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
        );
        if (tweet.quoted_status) {
          sendMessage(
            `${tweet.user.name} quoted this: \n https://twitter.com/${tweet.quoted_status.user.screen_name}/status/${tweet.quoted_status.id_str}`
          );
        }
      }
    }
  });

  stream.on(ETwitterStreamEvent.ConnectionLost, async () => {
    console.log("Twitter connection lost.");
  });

  stream.on(ETwitterStreamEvent.ReconnectError, (number) => {
    console.log("Twitter could not reconnect. ", number);

    // PM2 will restart Node when this happens.
    console.log("Exiting Node.js");
    process.exit(1);
  });

  stream.on(ETwitterStreamEvent.ConnectionClosed, async () => {
    console.log("Twitter connection closed!");
  });

  stream.on(ETwitterStreamEvent.Reconnected, () =>
    console.log("Twitter stream has connected.")
  );

  stream.on(ETwitterStreamEvent.ConnectionError, async (err) => {
    console.log("Twitter connection error!", err);
  });

  // Start stream!
  await stream.connect({ autoReconnect: true, autoReconnectRetries: Infinity });
}
exports.twitterStream = twitterStream;
