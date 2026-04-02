const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');

// AI API Configuration
const AI_API = {
    BASE: 'https://api.cinemind.name.ng',
    CHATGPT: '/api/chatgpt',
    API_KEY: 'Godszeal'
};

// Store conversation history for context (optional)
const conversationHistory = new Map();

// Main AI Chat Command
cmd({
    pattern: "ai",
    alias: ["chatgpt", "gpt", "ask", "bot"],
    react: "🤖",
    desc: "Chat with AI assistant",
    category: "ai",
    use: '.ai <your question>'
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        // Check if user provided a question
        if (!q || q.trim() === '') {
            return reply(`🤖 *AI Assistant*\n\nHi! I'm your AI assistant. Ask me anything!\n\n📝 *Examples:*\n• .ai What is JavaScript?\n• .ai Tell me a joke\n• .ai How to learn coding?\n\n💡 *Tip:* You can also reply to a message with .ai to ask about it.`);
        }

        const userQuestion = q.trim();
        
        // Send typing indicator
        await conn.sendPresenceUpdate('composing', from);
        
        // Get conversation history for this user (optional - keeps context)
        let history = conversationHistory.get(from) || [];
        
        // Add current question to history
        history.push({ role: "user", content: userQuestion });
        
        // Keep only last 10 messages to avoid token limits
        if (history.length > 10) {
            history = history.slice(-10);
        }

        // Send initial message
        await reply("🤖 *Thinking...*");

        // Call ChatGPT API
        const response = await axios.post(`${AI_API.BASE}${AI_API.CHATGPT}`, {
            apikey: AI_API.API_KEY,
            message: userQuestion,
            history: history // Send conversation history for context
        }, {
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Check if response is valid
        if (!response.data) {
            throw new Error("No response from API");
        }

        // Extract AI response (adjust based on actual API response structure)
        let aiResponse = response.data.response || 
                        response.data.result || 
                        response.data.message || 
                        response.data.reply ||
                        response.data.text ||
                        "I couldn't generate a response. Please try again.";
        
        // Add AI response to history
        history.push({ role: "assistant", content: aiResponse });
        conversationHistory.set(from, history);
        
        // Format the response
        const formattedResponse = `🤖 *AI Assistant*\n\n${aiResponse}\n\n━━━━━━━━━━━━━━\n❓ *Ask another question:* .ai <question>`;
        
        // Send response
        await reply(formattedResponse);
        
        // Send success reaction
        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });

    } catch (error) {
        console.error("AI command error:", error);
        
        let errorMessage = "❌ *AI Error:* ";
        
        if (error.code === 'ECONNABORTED') {
            errorMessage += "Request timeout. Please try again.";
        } else if (error.response) {
            errorMessage += `API Error (${error.response.status}). Please try later.`;
        } else if (error.request) {
            errorMessage += "No response from server. Check your connection.";
        } else {
            errorMessage += error.message;
        }
        
        await reply(errorMessage);
        
        await conn.sendMessage(from, {
            react: { text: "❌", key: mek.key }
        });
    }
});

// AI with image recognition (if supported)
cmd({
    pattern: "aivision",
    alias: ["vision", "imagine"],
    react: "👁️",
    desc: "Ask AI about an image",
    category: "ai",
    use: '.aivision <question> (reply to an image)'
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        // Check if replying to an image
        const quotedMsg = m.quoted;
        
        if (!quotedMsg || !quotedMsg.message?.imageMessage) {
            return reply(`👁️ *AI Vision*\n\nReply to an image with your question!\n\n📝 *Usage:*\n1. Send an image\n2. Reply to that image with .aivision What is this?`);
        }
        
        if (!q || q.trim() === '') {
            return reply("❌ *Please ask a question about the image!*\n\nExample: .aivision What is in this image?");
        }
        
        const question = q.trim();
        
        await reply("👁️ *Analyzing image...*");
        
        // Get image URL
        const imageMessage = quotedMsg.message.imageMessage;
        const imageUrl = imageMessage.url;
        
        // Call AI vision API (if supported by your endpoint)
        const response = await axios.post(`${AI_API.BASE}${AI_API.CHATGPT}`, {
            apikey: AI_API.API_KEY,
            message: question,
            image_url: imageUrl
        }, {
            timeout: 90000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        let aiResponse = response.data.response || 
                        response.data.result || 
                        response.data.message || 
                        "I couldn't analyze the image. Please try again.";
        
        const formattedResponse = `👁️ *AI Vision Analysis*\n\n📝 *Question:* ${question}\n\n🤖 *Answer:* ${aiResponse}\n\n━━━━━━━━━━━━━━\n💡 *Ask another question about this image or send a new one.*`;
        
        await reply(formattedResponse);
        
        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });
        
    } catch (error) {
        console.error("AI Vision error:", error);
        reply(`❌ *Error:* ${error.message}`);
    }
});

// Quick AI Command (shorter alias)
cmd({
    pattern: "a",
    alias: ["?"],
    react: "💬",
    desc: "Quick AI chat",
    category: "ai",
    use: '.a <question>'
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return;
        
        await conn.sendPresenceUpdate('composing', from);
        
        const response = await axios.post(`${AI_API.BASE}${AI_API.CHATGPT}`, {
            apikey: AI_API.API_KEY,
            message: q.trim()
        }, {
            timeout: 30000
        });
        
        let aiResponse = response.data.response || 
                        response.data.result || 
                        response.data.message || 
                        "No response";
        
        // Truncate long responses for quick command
        if (aiResponse.length > 500) {
            aiResponse = aiResponse.substring(0, 500) + "...";
        }
        
        await reply(`💬 *AI:* ${aiResponse}`);
        
    } catch (error) {
        console.error("Quick AI error:", error);
        // Silent fail for quick command
    }
});

// Reset conversation history
cmd({
    pattern: "resetai",
    alias: ["clearai", "newchat"],
    react: "🔄",
    desc: "Reset AI conversation history",
    category: "ai",
    use: '.resetai'
}, async (conn, mek, m, { from, reply }) => {
    try {
        if (conversationHistory.has(from)) {
            conversationHistory.delete(from);
            await reply("🔄 *AI conversation history reset!*\n\nStart a new conversation with .ai");
        } else {
            await reply("🤖 *No active conversation history.*\n\nStart chatting with .ai");
        }
        
        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });
    } catch (error) {
        console.error("Reset error:", error);
        reply(`❌ *Error:* ${error.message}`);
    }
});

// AI Info Command
cmd({
    pattern: "aiinfo",
    alias: ["aidev", "aboutai"],
    react: "ℹ️",
    desc: "Get AI assistant information",
    category: "ai",
    use: '.aiinfo'
}, async (conn, mek, m, { from, reply }) => {
    try {
        const infoText = `🤖 *AI ASSISTANT INFO*

📌 *Features:*
• Natural language processing
• Conversation memory (remembers context)
• Fast responses
• Multi-language support

📝 *Commands:*
• .ai <question> - Ask anything
• .a <question> - Quick ask
• .aivision - Analyze images (reply to image)
• .resetai - Clear conversation history

💡 *Examples:*
• .ai What is the meaning of life?
• .ai Write a poem about coding
• .ai Explain quantum physics simply

⚡ *Powered by:* Cinemind ChatGPT API

📊 *Status:* Active
🔄 *Context length:* Last 10 messages

*Start chatting with .ai <your question>*`;
        
        await reply(infoText);
    } catch (error) {
        console.error("AI Info error:", error);
        reply(`❌ *Error:* ${error.message}`);
    }
});

// Handle quoted messages for AI
cmd({
    pattern: "ask",
    alias: ["replyai"],
    react: "💭",
    desc: "Ask AI about a quoted message",
    category: "ai",
    use: '.ask <question> (reply to any message)'
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        const quotedMsg = m.quoted;
        
        if (!quotedMsg) {
            return reply(`💭 *Ask AI*\n\nReply to any message with .ask to ask AI about it!\n\n📝 *Example:*\n1. Reply to a message\n2. Type: .ask What do you think about this?`);
        }
        
        if (!q || q.trim() === '') {
            return reply("❌ *Please ask a question about the quoted message!*");
        }
        
        // Get the quoted message text
        let quotedText = "";
        
        if (quotedMsg.message?.conversation) {
            quotedText = quotedMsg.message.conversation;
        } else if (quotedMsg.message?.extendedTextMessage?.text) {
            quotedText = quotedMsg.message.extendedTextMessage.text;
        } else {
            quotedText = "[Non-text message]";
        }
        
        const question = q.trim();
        const fullPrompt = `Regarding the message: "${quotedText}"\n\nQuestion: ${question}\n\nAnswer based on the context of this message.`;
        
        await reply("💭 *Analyzing message...*");
        
        const response = await axios.post(`${AI_API.BASE}${AI_API.CHATGPT}`, {
            apikey: AI_API.API_KEY,
            message: fullPrompt
        }, {
            timeout: 60000
        });
        
        let aiResponse = response.data.response || 
                        response.data.result || 
                        response.data.message || 
                        "I couldn't analyze that message.";
        
        const formattedResponse = `💭 *AI Response*\n\n📝 *Context:* "${quotedText.substring(0, 100)}${quotedText.length > 100 ? '...' : ''}"\n\n❓ *Question:* ${question}\n\n🤖 *Answer:* ${aiResponse}`;
        
        await reply(formattedResponse);
        
        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });
        
    } catch (error) {
        console.error("Ask error:", error);
        reply(`❌ *Error:* ${error.message}`);
    }
});
