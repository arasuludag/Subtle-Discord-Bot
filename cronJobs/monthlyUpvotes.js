const cron = require("node-cron");
const Upvote = require("../database/upvote.js");
const {
    ChannelType
} = require("discord.js");

function monthlyUpvotes(client) {
    cron.schedule("5 0 1 * *", async () => {
        const now = new Date();
        const firstDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const monthName = firstDayOfPreviousMonth.toLocaleString("default", { month: "long" });

        const results = await Upvote.aggregate([
            {
                $match: {
                    createdAt: { $gte: firstDayOfPreviousMonth }
                }
            },
            {
                $group: {
                    _id: "$upvotedUserId",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        client.guilds.cache.forEach(async guild => {
            const announcementChannel = guild.channels.cache.find(channel =>
                channel.name === process.env.ANNOUNCEMENTSCHANNELNAME && channel.type === ChannelType.GuildAnnouncement
            );

            const emoji = guild.emojis.cache.find(e => e.name === "subtlethanks");

            if (announcementChannel && results.length) {
                // Remove the role from all members before assigning to new winners
                await removeRoleFromAllMembers(guild, "Top Monthly Helper");

                let resultsMessage = "Hey Subtlers 👋\n\n";
                resultsMessage += `In our discord community, you now can score points for helping each other out. If you found someone's message very helpful, react with a subtlethanks ${emoji} emoji, and that person will get one point. At the end of each month, the top scorer gets a free year of Subtle membership (once a year per person), and the top three scorers get a special mention and a Top Monthly Helper role icon. At the end of the year, there will be extra special prizes for those who got the most points! 😄\n\n`;
                resultsMessage += `So, let us turn knowledge and kindness into rewards. The ${monthName} leaders are:\n\n`;

                const committeeMembers = process.env.COMMITTEE_MEMBERS.split(",");

                results.filter(result => !committeeMembers.includes(result._id))
                    .slice(0, 3)
                    .forEach((result, index) => {
                        const medal = ["🥇", "🥈", "🥉"];

                        assignRoleToUser(result._id, guild, "Top Monthly Helper");

                        resultsMessage += `${medal[index]} <@${result._id}> ${result.count} points\n`;
                    });

                resultsMessage += "\nCongratulations to the winners! 👏🏻";

                announcementChannel.send(resultsMessage).catch(console.error);
            }
        });
    });
}

async function removeRoleFromAllMembers(guild, roleName) {
    try {
        // Find the role by name
        const role = guild.roles.cache.find(r => r.name === roleName);

        // If role doesn't exist, nothing to remove
        if (!role) {
            console.log(`Role ${roleName} does not exist, skipping removal.`);
            return;
        }

        // Get all members with this role
        const membersWithRole = role.members;

        // Remove the role from each member
        for (const [memberId, member] of membersWithRole) {
            await member.roles.remove(role);
            console.log(`Role ${roleName} removed from user ${member.user.tag}.`);
        }

        console.log(`Role ${roleName} removed from all members.`);
    } catch (error) {
        console.error(`Failed to remove role from all members: ${error}`);
    }
}

async function assignRoleToUser(userId, guild, roleName) {
    try {
        // Attempt to find the role by name
        let role = guild.roles.cache.find(role => role.name === roleName);

        // If role does not exist, create the role
        if (!role) {
            role = await guild.roles.create({
                name: roleName,
            });
        }

        // Fetch the user as a guild member
        const member = await guild.members.fetch(userId);

        // Add the role to the member
        await member.roles.add(role);
        console.log(`Role ${roleName} assigned to user ${member.user.tag} successfully.`);
    } catch (error) {
        console.error(`Failed to assign role: ${error}`);
    }
}

module.exports = monthlyUpvotes;