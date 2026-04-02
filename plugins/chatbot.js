const { cmd } = require("../command");
const axios = require("axios");

// ChatGPT API Configuration
const CHATGPT_API = "https://t20-classic-ai-chat.vercel.app/";
const API_KEY = "Godszeal";

// Store chatbot state and conversation history
const chatbotEnabled = new Map(); // user -> boolean
const lastReplyTime = new Map(); // user -> timestamp
const conversationHistory = new Map(); // user -> array of messages
const REPLY_INTERVAL = 10000; // 10 seconds to avoid spamming

// Function to clean promotional text from responses
function cleanResponse(text) {
    if (!text) return text;

    // Remove Pollinations.AI ads and promotional content
    let cleaned = text.replace(/\*Support Pollinations\.AI:[\s\S]*?Powered by Pollinations\.AI.*?\[Support our mission\].*?\)/gi, '');
    cleaned = cleaned.replace(/---[\s\S]*?Pollinations\.AI/gi, '');
    cleaned = cleaned.replace(/"source":\s*"pollinations"/gi, '');
    cleaned = cleaned.replace(/"model":\s*"[^"]*"/gi, '');

    // Remove JSON container wrappers
    cleaned = cleaned.replace(/^\s*\{\s*"response"\s*:\s*"([\s\S]*?)"\s*\}\s*$/i, '$1');
    cleaned = cleaned.replace(/\{\s*"response"\s*:\s*"([\s\S]*?)"\s*\,?\s*\}/gi, '$1');

    return cleaned.trim();
}

// Function to get AI response
async function getAIResponse(user, message) {
    try {
        // Get or create conversation history
        if (!conversationHistory.has(user)) {
            conversationHistory.set(user, []);
        }
        const history = conversationHistory.get(user);

        // Add user message to history
        history.push({ role: "user", content: message });

        // Keep only last 10 messages to avoid token limits
        if (history.length > 10) {
            history.splice(0, history.length - 10);
        }

        // Call ChatGPT API with history (same as chatgpt.js)
        const response = await axios.post(CHATGPT_API, {
            apikey: API_KEY,
            message: message,
            history: history
        }, {
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Extract response from API (same as chatgpt.js)
        let aiResponse = "";

        if (response.data) {
            // Try different possible response formats
            aiResponse = response.data.response ||
                response.data.result ||
                response.data.message ||
                response.data.reply ||
                response.data.text ||
                response.data.answer ||
                response.data.data;

            // If no specific field found, try stringifying
            if (!aiResponse && typeof response.data === "string") {
                aiResponse = response.data;
            }

            // If aiResponse is still an object, try to extract text or stringify
            if (aiResponse && typeof aiResponse === "object") {
                aiResponse = aiResponse.text || aiResponse.content || aiResponse.message || JSON.stringify(aiResponse);
            }
        }

        // Convert to string if needed
        if (aiResponse && typeof aiResponse !== "string") {
            aiResponse = String(aiResponse);
        }

        aiResponse = cleanResponse(aiResponse);

        // Add AI response to history
        history.push({ role: "assistant", content: aiResponse });

        return aiResponse;

    } catch (error) {
        console.error("Chatbot AI error:", error);
        return "Sorry, I'm having trouble responding right now. Please try again later.";
    }
}

// Toggle chatbot command
cmd({
    pattern: "chatbot",
    alias: ["cb"],
    react: "🤖",
    desc: "Toggle AI chatbot for PM conversations",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    const user = sender.split('@')[0];
    const isGroup = from.endsWith('@g.us');

    if (isGroup) {
        return reply("❌ Chatbot can only be used in private messages.");
    }

    const current = chatbotEnabled.get(user) || false;
    chatbotEnabled.set(user, !current);

    if (!current) {
        // Enabling
        conversationHistory.set(user, []); // Reset history
        lastReplyTime.set(user, 0);
        reply("✅ *Chatbot Enabled*\n\nI will now respond to your messages in this private chat. Send me anything to start a conversation!\n\nUse .chatbot again to disable.");
    } else {
        // Disabling
        reply("❌ *Chatbot Disabled*\n\nI will no longer auto-respond in this chat.");
    }
});

// Auto-reply handler (this would need to be integrated into the main message handler)
async function handleChatbotMessage(conn, mek, m, { from, sender, body }) {
    const user = sender.split('@')[0];
    const isGroup = from.endsWith('@g.us');

    // Only respond in PM and if chatbot is enabled
    if (isGroup || !chatbotEnabled.get(user)) return;

    // Skip if message is a command
    if (body.startsWith('.')) return;

    // Check reply interval
    const now = Date.now();
    const lastReply = lastReplyTime.get(user) || 0;
    if (now - lastReply < REPLY_INTERVAL) return;

    // Get AI response
    const aiResponse = await getAIResponse(user, body);
    if (aiResponse) {
        await conn.sendMessage(from, { text: aiResponse }, { quoted: mek });
        lastReplyTime.set(user, now);
    }
}

// Export the handler for integration
module.exports.handleChatbotMessage = handleChatbotMessage;