const { cmd } = require("../command");
const axios = require("axios");

// ChatGPT API Configuration
const CHATGPT_API = "https://api.cinemind.name.ng/api/chatgpt";
const API_KEY = "Godszeal";
const MODEL = "gpt-4o-mini";

cmd({
    pattern: "chatgpt",
    alias: ["gpt", "ask", "ai"],
    react: "🤖",
    desc: "Chat with AI using ChatGPT (GPT-4o-mini)",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
                "❌ Please provide a question or prompt.\n\n" +
                "Example: .chatgpt What is the capital of France?"
            );
        }

        // Show loading message
        const loadingMsg = await reply("⏳ *Processing your request...*\n🤖 ChatGPT is thinking...");

        try {
            // Call ChatGPT API
            const response = await axios.get(CHATGPT_API, {
                params: {
                    apikey: API_KEY,
                    prompt: q,
                    model: MODEL
                },
                timeout: 30000
            });

            // Extract response
            let responseText = "";

            if (response.data) {
                if (typeof response.data === "string") {
                    responseText = response.data;
                } else if (response.data.result) {
                    responseText = response.data.result;
                } else if (response.data.response) {
                    responseText = response.data.response;
                } else if (response.data.message) {
                    responseText = response.data.message;
                } else {
                    responseText = JSON.stringify(response.data);
                }
            }

            if (!responseText) {
                return reply("❌ API returned empty response. Please try again.");
            }

            // Send response
            const finalMessage = `
╔═══════════════════════════════════╗
║        🤖 ChatGPT Response         ║
╚═══════════════════════════════════╝

💬 *Question:*
${q}

🎯 *Answer:*
${responseText}

╔═══════════════════════════════════╗
║  Model: GPT-4o-mini | NYX Bot     ║
╚═══════════════════════════════════╝
      `.trim();

            await conn.sendMessage(from, { text: finalMessage }, { quoted: mek });

        } catch (apiError) {
            console.error("ChatGPT API Error:", apiError.message);
            const errorMsg = apiError.response?.data?.error || apiError.message || "Unknown error";
            return reply(`❌ API Error: ${errorMsg}\n\nPlease try again later.`);
        }

    } catch (error) {
        console.error("ChatGPT Command Error:", error);
        reply(`❌ Error: ${error.message || "An unexpected error occurred"}`);
    }
});

cmd({
    pattern: "chatgptnew",
    alias: ["gpt2"],
    react: "🤖",
    desc: "Chat with AI (Advanced mode)",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
                "❌ Please provide a question or prompt.\n\n" +
                "Example: .chatgptnew Write a short story about a robot"
            );
        }

        const loadingMsg = await reply("⏳ *Processing...*\n🔄 Generating response with GPT-4o-mini model...");

        try {
            const response = await axios.get(CHATGPT_API, {
                params: {
                    apikey: API_KEY,
                    prompt: q,
                    model: MODEL
                },
                timeout: 30000
            });

            let responseText = "";

            if (response.data) {
                if (typeof response.data === "string") {
                    responseText = response.data;
                } else if (response.data.result) {
                    responseText = response.data.result;
                } else if (response.data.response) {
                    responseText = response.data.response;
                } else if (response.data.message) {
                    responseText = response.data.message;
                } else {
                    responseText = JSON.stringify(response.data);
                }
            }

            if (!responseText) {
                return reply("❌ API returned empty response. Please try again.");
            }

            // Send formatted response
            const finalMessage = `*🤖 ChatGPT Advanced Response*\n\n${responseText}\n\n_Powered by NYX Bot_`;

            await conn.sendMessage(from, { text: finalMessage }, { quoted: mek });

        } catch (apiError) {
            console.error("ChatGPT API Error:", apiError.message);
            const errorMsg = apiError.response?.data?.error || apiError.message || "Unknown error";
            return reply(`❌ API Error: ${errorMsg}`);
        }

    } catch (error) {
        console.error("ChatGPT Advanced Error:", error);
        reply(`❌ Error: ${error.message}`);
    }
});

// Simple text generation for creative prompts
cmd({
    pattern: "gptcreative",
    alias: ["gcreative", "story", "poem"],
    react: "✨",
    desc: "Generate creative content (stories, poems, etc.)",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
                "❌ Please provide a prompt for creative content.\n\n" +
                "Examples:\n" +
                ".gptcreative Write a poem about nature\n" +
                ".story Tell me a funny story\n" +
                ".poem Create a haiku about technology"
            );
        }

        const creativePrompt = `${q}\n\n(Generate creative and engaging content)`;

        const loadingMsg = await reply("✨ *Creating creative content...*\n🎨 ChatGPT is generating...");

        try {
            const response = await axios.get(CHATGPT_API, {
                params: {
                    apikey: API_KEY,
                    prompt: creativePrompt,
                    model: MODEL
                },
                timeout: 30000
            });

            let responseText = "";

            if (response.data) {
                if (typeof response.data === "string") {
                    responseText = response.data;
                } else if (response.data.result) {
                    responseText = response.data.result;
                } else if (response.data.response) {
                    responseText = response.data.response;
                } else if (response.data.message) {
                    responseText = response.data.message;
                }
            }

            if (!responseText) {
                return reply("❌ Failed to generate content. Please try again.");
            }

            const finalMessage = `
✨ *Creative Content Generated* ✨

${responseText}

_Generated by ChatGPT | NYX Bot_
      `.trim();

            await conn.sendMessage(from, { text: finalMessage }, { quoted: mek });

        } catch (apiError) {
            console.error("ChatGPT Creative Error:", apiError.message);
            return reply(`❌ Error generating content. Please try again.`);
        }

    } catch (error) {
        console.error("Creative Generation Error:", error);
        reply(`❌ Error: ${error.message}`);
    }
});
