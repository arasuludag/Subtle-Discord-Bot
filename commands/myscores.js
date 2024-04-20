const { SlashCommandBuilder } = require("discord.js");
const Upvote = require("../database/upvote");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("myscores")
        .setDescription("View your monthly or yearly scores."),
    async execute(interaction) {
        const { monthly, yearly } = await getScores(interaction.user.id);

        interaction.reply({
            content: `Monthly: ${monthly}\nYearly: ${yearly}`,
            ephemeral: true
        });
    },
};


async function getScores(userId) {
    const now = new Date();
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await Upvote.aggregate([
        {
            $match: {
                upvotedUserId: userId,
                createdAt: { $gte: firstDayOfYear }
            }
        },
        {
            $facet: {
                monthly: [
                    { $match: { createdAt: { $gte: firstDayOfMonth } } },
                    { $count: "totalMonthly" }
                ],
                yearly: [
                    { $count: "totalYearly" }
                ]
            }
        }
    ]);

    return {
        monthly: result[0].monthly[0] ? result[0].monthly[0].totalMonthly : 0,
        yearly: result[0].yearly[0] ? result[0].yearly[0].totalYearly : 0
    };
}