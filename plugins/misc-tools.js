const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');
const util = require("util");

cmd({
    pattern: "vv3",
    alias: ['retrive', '🔥'],
    desc: "Fetch and resend a ViewOnce message content (image/video/audio).",
    category: "misc",
    use: '<query>',
    filename: __filename
},
    async (conn, mek, m, { from, reply }) => {
        try {
            // Check if replying to a ViewOnce message
            if (!m.quoted) return reply("Please reply to a ViewOnce message.");

            let quotedMsg = m.quoted;

            // Handle different ViewOnce message types
            if (quotedMsg.mtype === "viewOnceMessage" || quotedMsg.mtype === "viewOnceMessageV2") {
                const message = quotedMsg.message;

                if (message.imageMessage) {
                    let cap = message.imageMessage.caption;
                    let anu = await conn.downloadAndSaveMediaMessage(message.imageMessage);
                    return conn.sendMessage(from, { image: { url: anu }, caption: cap }, { quoted: mek });
                } else if (message.videoMessage) {
                    let cap = message.videoMessage.caption;
                    let anu = await conn.downloadAndSaveMediaMessage(message.videoMessage);
                    return conn.sendMessage(from, { video: { url: anu }, caption: cap }, { quoted: mek });
                } else if (message.audioMessage) {
                    let anu = await conn.downloadAndSaveMediaMessage(message.audioMessage);
                    return conn.sendMessage(from, { audio: { url: anu } }, { quoted: mek });
                } else {
                    return reply("Unsupported ViewOnce message type.");
                }
            } else {
                return reply("This is not a ViewOnce message.");
            }
        } catch (e) {
            console.log("Error:", e);
            reply("An error occurred while fetching the ViewOnce message.");
        }
    });

// if you want use the codes give me credit on your channel and repo in this file and my all files 

cmd({
    pattern: "vv2",
    alias: ['retrieve2', '🔥2'],
    desc: "Fetch and resend a ViewOnce message content (alternative implementation).",
    category: "misc",
    use: '<query>',
    filename: __filename
},
    async (conn, mek, m, { from, reply }) => {
        try {
            // Check if replying to a ViewOnce message
            if (!m.quoted) return reply("Please reply to a ViewOnce message.");

            let quotedMsg = m.quoted;

            // Handle different ViewOnce message types
            if (quotedMsg.mtype === "viewOnceMessage" || quotedMsg.mtype === "viewOnceMessageV2") {
                const message = quotedMsg.message;

                if (message.imageMessage) {
                    let cap = message.imageMessage.caption || '';
                    let anu = await conn.downloadAndSaveMediaMessage(message.imageMessage);
                    return conn.sendMessage(from, { image: { url: anu }, caption: cap }, { quoted: mek });
                } else if (message.videoMessage) {
                    let cap = message.videoMessage.caption || '';
                    let anu = await conn.downloadAndSaveMediaMessage(message.videoMessage);
                    return conn.sendMessage(from, { video: { url: anu }, caption: cap }, { quoted: mek });
                } else if (message.audioMessage) {
                    let anu = await conn.downloadAndSaveMediaMessage(message.audioMessage);
                    return conn.sendMessage(from, { audio: { url: anu } }, { quoted: mek });
                } else {
                    return reply("Unsupported ViewOnce message type.");
                }
            } else {
                return reply("This is not a ViewOnce message.");
            }
        } catch (e) {
            console.log("Error:", e);
            reply("An error occurred while fetching the ViewOnce message.");
        }
    });
