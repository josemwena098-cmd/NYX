const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');
const ytdl = require('ytdl-core');

// Helper function to format file name
function formatFileName(title) {
    return title.replace(/[^\w\s.-]/gi, "").replace(/\s+/g, '_').slice(0, 50);
}

// YouTube Audio Download Command
cmd({
    pattern: "play",
    alias: ["song", "audio", "mp3"],
    react: "🎵",
    desc: "Download YouTube audio",
    category: "download",
    use: '.play <song name>'
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        // Check if query exists
        if (!q || q.trim() === '') {
            return reply("❌ Please enter a song name!\n\n📝 Example: .play Believer Imagine Dragons");
        }

        await reply("🔍 *Searching YouTube...*");

        // Search for the video
        const searchResults = await yts(q);
        
        // Check if we got any results
        if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
            return reply("❌ No results found! Please try a different search term.");
        }

        // Get the first video
        const video = searchResults.videos[0];
        
        // Check if video object exists
        if (!video || !video.url) {
            return reply("❌ Could not get video information. Please try again.");
        }

        const videoUrl = video.url;
        const videoTitle = video.title || "YouTube Audio";
        const videoThumbnail = video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
        
        console.log(`Downloading: ${videoTitle}`);

        // Send video info
        await conn.sendMessage(from, {
            image: { url: videoThumbnail },
            caption: `🎵 *${videoTitle}*\n\n⏳ *Downloading audio... Please wait*`
        }, { quoted: mek });

        // Download audio using ytdl-core
        try {
            // Get audio stream
            const audioStream = ytdl(videoUrl, {
                quality: 'highestaudio',
                filter: 'audioonly'
            });

            // Collect chunks
            const chunks = [];
            let error = null;
            
            audioStream.on('error', (err) => {
                error = err;
            });

            for await (const chunk of audioStream) {
                chunks.push(chunk);
            }
            
            if (error) {
                throw error;
            }
            
            if (chunks.length === 0) {
                throw new Error("No audio data received");
            }
            
            const audioBuffer = Buffer.concat(chunks);
            
            if (audioBuffer.length < 1000) {
                throw new Error("Audio file too small, possibly corrupted");
            }

            console.log(`Downloaded ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);

            // Send audio file
            await conn.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${formatFileName(videoTitle)}.mp3`,
                ptt: false
            }, { quoted: mek });

            // Send success reaction
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

// YouTube Video Download Command
cmd({
    pattern: "video",
    alias: ["mp4", "ytvideo"],
    react: "🎬",
    desc: "Download YouTube video",
    category: "download",
    use: '.video <video name>'
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        // Check if query exists
        if (!q || q.trim() === '') {
            return reply("❌ Please enter a video name!\n\n📝 Example: .video Baby Shark Dance");
        }

        await reply("🔍 *Searching YouTube...*");

        // Search for the video
        const searchResults = await yts(q);
        
        // Check if we got any results
        if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
            return reply("❌ No results found! Please try a different search term.");
        }

        // Get the first video
        const video = searchResults.videos[0];
        
        // Check if video object exists
        if (!video || !video.url) {
            return reply("❌ Could not get video information. Please try again.");
        }

        const videoUrl = video.url;
        const videoTitle = video.title || "YouTube Video";
        const videoThumbnail = video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
        
        console.log(`Downloading video: ${videoTitle}`);

        // Send video info
        await conn.sendMessage(from, {
            image: { url: videoThumbnail },
            caption: `🎬 *${videoTitle}*\n\n⏳ *Downloading video... Please wait*`
        }, { quoted: mek });

        // Download video using ytdl-core
        try {
            // Get video stream (lower quality for faster download)
            const videoStream = ytdl(videoUrl, {
                quality: '18', // 360p MP4 format for faster download
                filter: 'audioandvideo'
            });

            // Collect chunks
            const chunks = [];
            let error = null;
            
            videoStream.on('error', (err) => {
                error = err;
            });

            for await (const chunk of videoStream) {
                chunks.push(chunk);
            }
            
            if (error) {
                throw error;
            }
            
            if (chunks.length === 0) {
                throw new Error("No video data received");
            }
            
            const videoBuffer = Buffer.concat(chunks);
            
            if (videoBuffer.length < 10000) {
                throw new Error("Video file too small, possibly corrupted");
            }

            console.log(`Downloaded ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);

            // Send video file
            await conn.sendMessage(from, {
                video: videoBuffer,
                caption: `🎬 *${videoTitle}*`,
                mimetype: 'video/mp4'
            }, { quoted: mek });

            // Send success reaction
            await conn.sendMessage(from, {
                react: { text: "✅", key: mek.key }
            });

        } catch (downloadError) {
            console.error("Video download error:", downloadError);
            return reply("❌ Failed to download video. Try another video or use a direct YouTube URL.");
        }

    } catch (error) {
        console.error("Video command error:", error);
        reply("❌ Error: " + error.message);
    }
});

// YouTube Search Command
cmd({
    pattern: "ytsearch",
    alias: ["yts", "youtube"],
    react: "🔍",
    desc: "Search YouTube videos",
    category: "download",
    use: '.ytsearch <search query>'
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q || q.trim() === '') {
            return reply("🔍 *Usage:* .ytsearch <search query>\n\n📝 Example: .ytsearch Imagine Dragons");
        }

        await reply("🔍 *Searching YouTube...*");

        const searchResults = await yts(q);
        
        if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
            return reply("❌ No results found for your search.");
        }

        const videos = searchResults.videos.slice(0, 5);
        
        let message = `🔍 *YouTube Search Results*\n📝 *Query:* ${q}\n\n`;

        videos.forEach((video, index) => {
            message += `${index + 1}. *${video.title || 'Unknown'}*\n`;
            message += `📺 ${video.author?.name || 'Unknown Channel'}\n`;
            message += `⏱️ ${video.timestamp || 'N/A'}\n`;
            message += `🔗 ${video.url}\n\n`;
        });

        message += `\n💡 *Use .play or .video to download*`;

        const thumbnail = videos[0].thumbnail;
        
        if (thumbnail) {
            await conn.sendMessage(from, {
                image: { url: thumbnail },
                caption: message
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, {
                text: message
            }, { quoted: mek });
        }

    } catch (error) {
        console.error("Search error:", error);
        reply("❌ Error: " + error.message);
    }
});

// Direct URL Download (Audio)
cmd({
    pattern: "playurl",
    alias: ["audiourl"],
    react: "🎵",
    desc: "Download audio from YouTube URL",
    category: "download",
    use: '.playurl <YouTube URL>'
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q || q.trim() === '') {
            return reply("❌ Please provide a YouTube URL!\n\n📝 Example: .playurl https://youtu.be/xxxxx");
        }

        const videoUrl = q.trim();
        
        // Validate YouTube URL
        if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
            return reply("❌ Please provide a valid YouTube URL!");
        }

        await reply("⏳ *Processing URL...*");

        // Get video info
        const videoInfo = await ytdl.getInfo(videoUrl);
        const videoTitle = videoInfo.videoDetails.title;
        const videoThumbnail = videoInfo.videoDetails.thumbnails[0]?.url || `https://i.ytimg.com/vi/${videoInfo.videoDetails.videoId}/hqdefault.jpg`;

        // Send video info
        await conn.sendMessage(from, {
            image: { url: videoThumbnail },
            caption: `🎵 *${videoTitle}*\n\n⏳ *Downloading audio...*`
        }, { quoted: mek });

        // Download audio
        const audioStream = ytdl(videoUrl, {
            quality: 'highestaudio',
            filter: 'audioonly'
        });

        const chunks = [];
        for await (const chunk of audioStream) {
            chunks.push(chunk);
        }
        
        const audioBuffer = Buffer.concat(chunks);

        // Send audio
        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${formatFileName(videoTitle)}.mp3`,
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });

    } catch (error) {
        console.error("PlayURL error:", error);
        reply("❌ Error: " + error.message);
    }
});

// Direct URL Download (Video)
cmd({
    pattern: "videourl",
    alias: ["mp4url"],
    react: "🎬",
    desc: "Download video from YouTube URL",
    category: "download",
    use: '.videourl <YouTube URL>'
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q || q.trim() === '') {
            return reply("❌ Please provide a YouTube URL!\n\n📝 Example: .videourl https://youtu.be/xxxxx");
        }

        const videoUrl = q.trim();
        
        // Validate YouTube URL
        if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
            return reply("❌ Please provide a valid YouTube URL!");
        }

        await reply("⏳ *Processing URL...*");

        // Get video info
        const videoInfo = await ytdl.getInfo(videoUrl);
        const videoTitle = videoInfo.videoDetails.title;
        const videoThumbnail = videoInfo.videoDetails.thumbnails[0]?.url || `https://i.ytimg.com/vi/${videoInfo.videoDetails.videoId}/hqdefault.jpg`;

        // Send video info
        await conn.sendMessage(from, {
            image: { url: videoThumbnail },
            caption: `🎬 *${videoTitle}*\n\n⏳ *Downloading video...*`
        }, { quoted: mek });

        // Download video
        const videoStream = ytdl(videoUrl, {
            quality: '18' // 360p for balance between quality and speed
        });

        const chunks = [];
        for await (const chunk of videoStream) {
            chunks.push(chunk);
        }
        
        const videoBuffer = Buffer.concat(chunks);

        // Send video
        await conn.sendMessage(from, {
            video: videoBuffer,
            caption: `🎬 *${videoTitle}*`,
            mimetype: 'video/mp4'
        }, { quoted: mek });

        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });

    } catch (error) {
        console.error("VideoURL error:", error);
        reply("❌ Error: " + error.message);
    }
});
