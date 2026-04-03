const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');
const config = require('../config');

const followedChannelsFile = path.join(__dirname, '../assets/followed_channels.json');

// Function to read followed channels
function readFollowedChannels() {
    try {
        if (!fs.existsSync(followedChannelsFile)) {
            fs.writeFileSync(followedChannelsFile, '[]');
        }
        return JSON.parse(fs.readFileSync(followedChannelsFile, 'utf8'));
    } catch (e) {
        console.error('Error reading followed channels:', e);
        return [];
    }
}

// Function to write followed channels
function writeFollowedChannels(channels) {
    try {
        fs.writeFileSync(followedChannelsFile, JSON.stringify(channels, null, 2));
    } catch (e) {
        console.error('Error writing followed channels:', e);
    }
}

// Command to follow a channel
cmd({
    pattern: "follow",
    desc: "Follow a WhatsApp channel to auto-react to its updates",
    category: "tools",
    filename: __filename
},
    async (conn, mek, m, { from, args, isCreator, reply }) => {
        try {
            if (!isCreator) return reply("*📛 Only the owner can use this command!*");

            const channelJid = args[0];
            if (!channelJid) {
                return reply("*🫟 Example: .follow 120363421014261315@newsletter*");
            }

            // Validate JID format (basic check)
            if (!channelJid.includes('@newsletter')) {
                return reply("*❌ Invalid channel JID. It should end with @newsletter*");
            }

            let followedChannels = readFollowedChannels();

            if (followedChannels.includes(channelJid)) {
                return reply("*ℹ️ This channel is already being followed.*");
            }

            followedChannels.push(channelJid);
            writeFollowedChannels(followedChannels);

            // Try to follow the channel
            try {
                await conn.newsletterFollow(channelJid);
                reply(`✅ *Followed and added to auto-react list:*\n${channelJid}`);
            } catch (e) {
                reply(`✅ *Added to auto-react list:*\n${channelJid}\n⚠️ *Note: Could not follow the channel automatically.*`);
            }

        } catch (e) {
            console.error(e);
            reply("❌ Error: " + e.message);
        }
    });

// Command to unfollow a channel
cmd({
    pattern: "unfollow",
    desc: "Unfollow a WhatsApp channel and stop auto-reacting",
    category: "tools",
    filename: __filename
},
    async (conn, mek, m, { from, args, isCreator, reply }) => {
        try {
            if (!isCreator) return reply("*📛 Only the owner can use this command!*");

            const channelJid = args[0];
            if (!channelJid) {
                return reply("*🫟 Example: .unfollow 120363421014261315@newsletter*");
            }

            let followedChannels = readFollowedChannels();

            const index = followedChannels.indexOf(channelJid);
            if (index === -1) {
                return reply("*ℹ️ This channel is not in the followed list.*");
            }

            followedChannels.splice(index, 1);
            writeFollowedChannels(followedChannels);

            reply(`✅ *Removed from auto-react list:*\n${channelJid}`);

        } catch (e) {
            console.error(e);
            reply("❌ Error: " + e.message);
        }
    });

// Command to list followed channels
cmd({
    pattern: "followed",
    desc: "List all followed channels",
    category: "tools",
    filename: __filename
},
    async (conn, mek, m, { from, isCreator, reply }) => {
        try {
            if (!isCreator) return reply("*📛 Only the owner can use this command!*");

            const followedChannels = readFollowedChannels();

            if (followedChannels.length === 0) {
                return reply("*ℹ️ No channels are currently being followed.*");
            }

            let message = "*📢 Followed Channels:*\n\n";
            followedChannels.forEach((jid, index) => {
                message += `${index + 1}. ${jid}\n`;
            });

            reply(message);

        } catch (e) {
            console.error(e);
            reply("❌ Error: " + e.message);
        }
    });

// Function to handle channel reactions
async function handleChannelReaction(conn, mek) {
    try {
        const followedChannels = readFollowedChannels();
        const from = mek.key.remoteJid;
        console.log('handleChannelReaction called, from:', from, 'followed:', followedChannels);

        if (followedChannels.includes(from) && !mek.key.fromMe) {
            // React with a random emoji
            const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🌷', '⛅', '🌟', '🗿', '🌝', '💜', '💙', '🌝', '🖤', '💚'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            console.log('Reacting to channel message with:', randomEmoji);

            // Send emoji as a reaction message to the channel
            await conn.sendMessage(from, { text: randomEmoji });
        }
    } catch (e) {
        console.error('Error in handleChannelReaction:', e);
    }
}

// Export the followed channels for use in other parts
module.exports = {
    getFollowedChannels: readFollowedChannels,
    handleChannelReaction
};

// Auto-add the default channel on module load
const channels = readFollowedChannels();
if (!channels.includes(config.NEWSLETTER_JID)) {
    channels.push(config.NEWSLETTER_JID);
    writeFollowedChannels(channels);
    console.log('Auto-added default channel to followed list:', config.NEWSLETTER_JID);
}