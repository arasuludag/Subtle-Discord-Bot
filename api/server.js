const express = require("express");
const { EmbedBuilder } = require("discord.js");

const app = express();
app.use(express.json());

let discordClient = null;

// Initialize the API server with the Discord client
function initializeAPI(client) {
  discordClient = client;
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      ok: false, 
      error: "Missing authentication token" 
    });
  }

  if (token !== process.env.API_BEARER_TOKEN) {
    return res.status(403).json({ 
      ok: false, 
      error: "Invalid authentication token" 
    });
  }

  next();
}

// Helper function to find channel by name
function findChannelByName(channelName) {
  const guild = discordClient.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) {
    throw new Error("Guild not found");
  }
  
  return guild.channels.cache.find(
    (channel) => channel.name === channelName && channel.type === 0
  );
}

// Helper function to check if job already exists in Discord channel
async function findExistingJob(channel, jobId) {
  try {
    // Fetch recent messages (limit 100, Discord's max)
    const messages = await channel.messages.fetch({ limit: 100 });
    
    // Search through messages to find one with matching job_id
    for (const [, message] of messages) {
      if (message.embeds && message.embeds.length > 0) {
        const embed = message.embeds[0];
        
        // Check if any field contains the job ID
        const jobIdField = embed.fields?.find(field => 
          field.name === "Job ID" && field.value === `#${jobId}`
        );
        
        if (jobIdField) {
          return {
            messageId: message.id,
            channelId: channel.id
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return null;
  }
}

// Helper function to format job message
function createJobEmbed(jobData) {
  const { job_id, company, description, submitted_by, submitted_at, attachment_url } = jobData;
  
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`Job Opening${company ? ` at ${company}` : ""}`)
    .setTimestamp();

  if (description) {
    // Strip HTML tags for basic formatting
    const cleanDescription = description
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .substring(0, 4096);
    
    embed.setDescription(cleanDescription);
  }

  if (submitted_by) {
    embed.addFields({ name: "Submitted by", value: submitted_by, inline: true });
  }

  if (submitted_at) {
    embed.addFields({ name: "Submitted at", value: submitted_at, inline: true });
  }

  embed.addFields({ name: "Job ID", value: `#${job_id}`, inline: true });

  if (attachment_url) {
    embed.addFields({ name: "Attachment", value: `[View Attachment](${attachment_url})`, inline: false });
  }

  return embed;
}

// POST /post-job - Publish a job to Discord
app.post("/post-job", authenticateToken, async (req, res) => {
  try {
    const { job_id } = req.body;

    // Validate required fields
    if (!job_id) {
      return res.status(400).json({ 
        ok: false, 
        error: "Missing required field: job_id" 
      });
    }

    // Get the channel by name
    const channelName = process.env.JOB_POSTING_CHANNEL_NAME;
    if (!channelName) {
      return res.status(500).json({ 
        ok: false, 
        error: "Job posting channel not configured (JOB_POSTING_CHANNEL_NAME)" 
      });
    }

    const channel = findChannelByName(channelName);
    if (!channel) {
      return res.status(500).json({ 
        ok: false, 
        error: `Could not find channel '${channelName}'` 
      });
    }

    // Check if this job has already been posted (idempotency)
    const existingJob = await findExistingJob(channel, job_id);
    if (existingJob) {
      const messageUrl = `https://discord.com/channels/${process.env.GUILD_ID}/${existingJob.channelId}/${existingJob.messageId}`;
      
      return res.status(200).json({
        ok: true,
        message_id: existingJob.messageId,
        channel_id: existingJob.channelId,
        message_url: messageUrl,
        note: "Job already posted (idempotent request)"
      });
    }

    // Create and send the job embed
    const embed = createJobEmbed(req.body);
    const message = await channel.send({ embeds: [embed] });

    const messageUrl = `https://discord.com/channels/${process.env.GUILD_ID}/${channel.id}/${message.id}`;

    res.status(201).json({
      ok: true,
      message_id: message.id,
      channel_id: channel.id,
      message_url: messageUrl
    });

  } catch (error) {
    console.error("Error posting job:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Failed to post job", 
      details: error.message 
    });
  }
});

// POST /delete-job - Delete a job from Discord
app.post("/delete-job", authenticateToken, async (req, res) => {
  try {
    const { message_id, channel_id } = req.body;

    // Validate required fields
    if (!message_id || !channel_id) {
      return res.status(400).json({ 
        ok: false, 
        error: "Missing required fields: message_id and channel_id" 
      });
    }

    // Get the channel
    const channel = await discordClient.channels.fetch(channel_id);
    if (!channel) {
      return res.status(404).json({ 
        ok: false, 
        error: "Channel not found" 
      });
    }

    // Try to fetch and delete the message
    try {
      const message = await channel.messages.fetch(message_id);
      await message.delete();

      res.status(200).json({
        ok: true,
        deleted: true
      });

    } catch (error) {
      if (error.code === 10008) { // Unknown Message error code
        // Message already deleted or doesn't exist
        return res.status(200).json({
          ok: true,
          deleted: false,
          note: "Message not found (may have been already deleted)"
        });
      }
      throw error;
    }

  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Failed to delete job", 
      details: error.message 
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    ok: true, 
    status: "healthy",
    bot_ready: discordClient && discordClient.isReady()
  });
});

// Start the server
function startServer(port = 3000) {
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`API server listening on port ${port}`);
      resolve(server);
    });
  });
}

module.exports = { initializeAPI, startServer };

