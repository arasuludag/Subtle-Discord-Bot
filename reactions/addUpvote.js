const Upvote = require("../database/upvote.js");

async function addUpvote(reaction, user) {
    let message = reaction.message;

    if (!message.author) {
        try {
            message = await reaction.message.fetch();
        } catch (error) {
            console.error("Error fetching message", error);
            return;
        }
    }

    if (!message.author) {
        console.log("Unable to fetch message author.");
        return;
    }

    if (user.id === message.author.id) {
        console.log("User attempted to upvote their own message");
        return;
    }

    const upvoteData = {
        upvotedUserId: message.author.id,
        upvoterId: user.id,
        messageId: reaction.message.id,
        channelId: reaction.message.channelId,
        emoji: reaction.emoji.name,
    };

    const upvote = new Upvote(upvoteData);
    await upvote.save()
        .then(() => console.log("Upvote saved to database"))
        .catch(err => console.error("Error saving upvote to database", err));
}

module.exports = addUpvote;