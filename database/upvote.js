const mongoose = require("mongoose");

const upvoteSchema = new mongoose.Schema({
  upvotedUserId: {
    type: String,
    required: true
  },
  upvoterId: {
    type: String,
    required: true
  },
  messageId: {
    type: String,
    required: true
  },
  channelId: {
    type: String,
    required: true
  },
  emoji: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

const Upvote = mongoose.model("Upvote", upvoteSchema);

module.exports = Upvote;