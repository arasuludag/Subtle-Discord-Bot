const Upvote = require("../database/upvote.js");

async function removeUpvote(reaction, user) {
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

    try {
        const result = await Upvote.deleteOne({
            upvotedUserId: message.author.id,
            upvoterId: user.id,
            messageId: reaction.message.id,
            channelId: reaction.message.channelId,
            emoji: reaction.emoji.name,
        });

        if (result.deletedCount > 0) {
            console.log("Upvote removed from database");
        } else {
            console.log("No matching upvote found to remove");
        }
    } catch (err) {
        console.error("Error removing upvote from database", err);
    }
}

module.exports = removeUpvote;