// const { replyEmbed } = require("../customSend");
const { findUserByID } = require("../functions");

async function basicMessageChecking(message, client) {
  //   const lowerCaseMessage = message.content.toLowerCase();

  const repliedMessage = message.reference
    ? await message.channel.messages.fetch(message.reference.messageId)
    : null;

  if (!message.author.bot && !message.content.includes("http"))
    switch (true) {
      case message.mentions.has(client.user) &&
        !message.mentions.everyone &&
        !message.content.includes("/") &&
        message.reference &&
        repliedMessage.content.includes("Help Requested by User ID"):
        findUserByID(client, repliedMessage.content.split(" ").at(-1)).then(
          (user) => {
            user
              .send({
                embeds: [
                  {
                    color: process.env.EMBEDCOLOR,
                    description:
                      message.content +
                      "\n \n _Subtle Bot cannot read the messages you send here and it cannot forward them to anyone else. Your direct messages to Sassy are private, but this also means that neither Sassy nor an admin can reply to the questions you ask here. If your problem is not solved or if you have more questions, please use `/help` again, and one of our admins will assist you!_",
                    title: "Reply from Help Desk:",
                  },
                ],
              })
              .then(() => {
                message.react("📩");
                repliedMessage.react("✅");
              })
              .catch((error) => {
                console.error("Failed to send help. \n" + error);
              });
          }
        );

        break;
    }
}
exports.basicMessageChecking = basicMessageChecking;
