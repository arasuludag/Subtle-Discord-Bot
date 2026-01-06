const cron = require("node-cron");
const Upvote = require("../database/upvote.js");
const {
    ChannelType
} = require("discord.js");

function yearlyUpvotes(client) {
    // Runs at 00:10 on January 7th every year
    cron.schedule("10 0 7 1 *", async () => {
        const now = new Date();
        const firstDayOfPreviousYear = new Date(now.getFullYear() - 1, 0, 1);
        const lastDayOfPreviousYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        const yearName = firstDayOfPreviousYear.getFullYear();

        const results = await Upvote.aggregate([
            {
                $match: {
                    createdAt: { 
                        $gte: firstDayOfPreviousYear,
                        $lte: lastDayOfPreviousYear
                    }
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
                let resultsMessage = "Dear Subtlers ✨\n\n";
                resultsMessage += `Now that ${yearName} has passed, we want to celebrate our top Subtle helpers of the year ${emoji} for their invaluable contributions to our little chat! Without further ado, here are our top three superstars:\n\n`;

                const committeeMembers = process.env.COMMITTEE_MEMBERS.split(",");

                results.filter(result => !committeeMembers.includes(result._id))
                    .slice(0, 3)
                    .forEach((result, index) => {
                        const medal = ["🏆", "🏅", "🎗️"];

                        assignRoleToUser(result._id, guild, "Top Subtle Helper");

                        resultsMessage += `${medal[index]}  <@${result._id}> ${result.count} points\n`;
                    });

                resultsMessage += '\nAs a reward, they will get gift certificates for a small sum of money, as well as a permanent "Top Subtle Helper" badge!\n\n';
                resultsMessage += "Congratulations to the winners! Thank you for helping us to improve this precious community! 👏🏻 @everyone";

                announcementChannel.send(resultsMessage).catch(console.error);
            }
        });
    });
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

module.exports = yearlyUpvotes;

