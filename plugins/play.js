const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');

// Cinemind API configuration
const CINEMIND_API = {
    BASE: 'https://api.cinemind.name.ng',
    YT_SEARCH: '/api/yt/search',
    DOWNLOAD_AUDIO: '/download-audio',
    DOWNLOAD_VIDEO: '/download-video'
};

// Helper function to extract YouTube video ID
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&?\/\s]{11})/i,
        /youtube\.com\/shorts\/([^&?\/\s]{11})/i
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Simple YouTube Audio Download
cmd({
    pattern: "play",
    alias: ["song"],
    react: "🎵",
    desc: "Download YouTube audio",
    category: "download",
    use: '.play <song name>'
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        console.log("Play command triggered with query:", q);
        
        if (!q) {
            return reply("❌ Please enter a song name!\nExample: .play Believer");
        }

        await reply("🔍 Searching... Please wait");

        // First, search for the video using yt-search (more reliable)
        const yts = require('yt-search');
        const searchResults = await yts(q);
        
        if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
            return reply("❌ No results found!");
        }

        const video = searchResults.videos[0];
        const videoUrl = video.url;
        const videoTitle = video.title;
        const videoThumbnail = video.thumbnail;
        
        console.log("Found video:", videoTitle);

        // Send video info
        await conn.sendMessage(from, {
            image: { url: videoThumbnail },
            caption: `🎵 *${videoTitle}*\n\n⏳ Downloading audio...`
        }, { quoted: mek });

        // Try to get download link using ytdl-core
        const ytdl = require('ytdl-core');
        
        try {
            // Get audio stream
            const audioStream = ytdl(videoUrl, {
                quality: 'highestaudio',
                filter: 'audioonly'
            });

            // Convert stream to buffer
            const chunks = [];
            for await (const chunk of audioStream) {
                chunks.push(chunk);
            }
            const audioBuffer = Buffer.concat(chunks);

            if (!audioBuffer || audioBuffer.length === 0) {
                throw new Error("No audio data received");
            }

            console.log(`Audio downloaded: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);

            // Send audio
            await conn.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${videoTitle.slice(0, 50)}.mp3`,
                ptt: false
            }, { quoted: mek });

            await conn.sendMessage(from, {
                react: { text: "✅", key: mek.key }
            });

        } catch (downloadError) {
            console.error("Download error:", downloadError);
            return reply("❌ Failed to download audio. Try another song or use a direct YouTube URL.");
        }

    } catch (error) {
        console.error("Play command error:", error);
        reply("❌ Error: " + error.message);
    }
});

// YouTube Video Download
cmd({
    pattern: "video",
    alias: ["mp4"],
    react: "🎬",
    desc: "Download YouTube video",
    category: "download",
    use: '.video <video name>'
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        console.log("Video command triggered with query:", q);
        
        if (!q) {
            return reply("❌ Please enter a video name!\nExample: .video Baby Shark");
        }

        await reply("🔍 Searching... Please wait");

        // Search for the video
        const yts = require('yt-search');
        const searchResults = await yts(q);
        
        if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
            return reply("❌ No results found!");
        }

        const video = searchResults.videos[0];
        const videoUrl = video.url;
        const videoTitle = video.title;
        const videoThumbnail = video.thumbnail;
        
        console.log("Found video:", videoTitle);

        // Send video info
        await conn.sendMessage(from, {
            image: { url: videoThumbnail },
            caption: `🎬 *${videoTitle}*\n\n⏳ Downloading video...`
        }, { quoted: mek });

        // Download video using ytdl-core
        const ytdl = require('ytdl-core');
        
        try {
            // Get video stream
            const videoStream = ytdl(videoUrl, {
                quality: 'lowest', // Use lowest for faster download
                filter: 'videoandaudio'
            });

            // Convert stream to buffer
            const chunks = [];
            for await (const chunk of videoStream) {
                chunks.push(chunk);
            }
            const videoBuffer = Buffer.concat(chunks);

            if (!videoBuffer || videoBuffer.length === 0) {
                throw new Error("No video data received");
            }

            console.log(`Video downloaded: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);

            // Send video
            await conn.sendMessage(from, {
                video: videoBuffer,
                caption: `🎬 *${videoTitle}*`,
                mimetype: 'video/mp4'
            }, { quoted: mek });

            await conn.sendMessage(from, {
                react: { text: "✅", key: mek.key }
            });

        } catch (downloadError) {
            console.error("Download error:", downloadError);
            return reply("❌ Failed to download video. Try another video or use a direct YouTube URL.");
        }

    } catch (error) {
        console.error("Video command error:", error);
        reply("❌ Error: " + error.message);
    }
});

// Simple test command
cmd({
    pattern: "ping",
    alias: ["test"],
    react: "🏓",
    desc: "Test bot response",
    category: "general",
    use: '.ping'
}, async (conn, mek, m, { from, reply }) => {
    try {
        await reply("🏓 Pong! Bot is working!");
    } catch (error) {
        console.error("Ping error:", error);
    }
});
