const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

cmd({
    pattern: 'url',
    alias: ['upload'],
    desc: 'Upload media to Catbox and get URL',
    category: 'download',
    react: '📤',
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        let buffer;
        let filename = 'file';

        // ========= 1. URL =========
        const urlRegex = /(https?:\/\/[^\s]+)/i;

        if (q && urlRegex.test(q)) {
            const url = q.match(urlRegex)[0];

            const res = await axios.get(url, { responseType: 'arraybuffer' });
            buffer = Buffer.from(res.data);

            filename = path.basename(new URL(url).pathname) || 'file';
        }

        // ========= 2. MEDIA (FIXED PART) =========
        else {
            const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (!quotedMsg) {
                return reply('❌ Reply to media or provide a URL.\n\nExample: .url2 https://example.com/file.jpg');
            }

            const msgType = Object.keys(quotedMsg)[0];
            const allowed = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];

            if (!allowed.includes(msgType)) {
                const supported = allowed.map(t => t.replace('Message', '')).join(', ');
                return reply('❌ Unsupported media type.\n\nSupported: ' + supported);
            }

            try {
                buffer = await conn.downloadMediaMessage(quotedMsg[msgType]);
                if (!buffer) return reply('❌ Failed to download media.');
                filename = quotedMsg[msgType]?.fileName || `file.${msgType.replace('Message', '')}`;
            } catch (downloadErr) {
                console.error('[url2] Download error:', downloadErr.message);
                return reply('❌ Failed to download media: ' + (downloadErr.message || 'Unknown error'));
            }
        }

        // ========= 3. UPLOAD =========
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', buffer, { filename });

        const { data } = await axios.post(
            'https://catbox.moe/user/api.php',
            form,
            { headers: form.getHeaders() }
        );

        // ========= 4. RESULT =========
        await reply(`✅ Uploaded Successfully!\n\n${data}`);

    } catch (e) {
        console.error(e);
        reply('❌ Error: ' + e.message);
    }
});

cmd({
    pattern: 'url2',
    alias: ['upload2'],
    desc: 'Upload media to different service and get URL',
    category: 'download',
    react: '📤',
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        let buffer;
        let filename = 'file';

        // ========= 1. URL =========
        const urlRegex = /(https?:\/\/[^\s]+)/i;

        if (q && urlRegex.test(q)) {
            const url = q.match(urlRegex)[0];

            const res = await axios.get(url, { responseType: 'arraybuffer' });
            buffer = Buffer.from(res.data);

            filename = path.basename(new URL(url).pathname) || 'file';
        }

        // ========= 2. MEDIA (FIXED PART) =========
        else {
            const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (!quotedMsg) {
                return reply('❌ Reply to media or provide a URL.\n\nExample: .url2 https://example.com/file.jpg');
            }

            const msgType = Object.keys(quotedMsg)[0];
            const allowed = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];

            if (!allowed.includes(msgType)) {
                const supported = allowed.map(t => t.replace('Message', '')).join(', ');
                return reply('❌ Unsupported media type.\n\nSupported: ' + supported);
            }

            try {
                buffer = await conn.downloadMediaMessage(quotedMsg[msgType]);
                if (!buffer) return reply('❌ Failed to download media.');
                filename = quotedMsg[msgType]?.fileName || `file.${msgType.replace('Message', '')}`;
            } catch (downloadErr) {
                console.error('[url2] Download error:', downloadErr.message);
                return reply('❌ Failed to download media: ' + (downloadErr.message || 'Unknown error'));
            }
        }

        // ========= 3. UPLOAD TO DIFFERENT SERVICE =========
        // Using imgbb for url2 (free service)
        const form = new FormData();
        form.append('image', buffer, { filename });

        const { data } = await axios.post(
            'https://api.imgbb.com/1/upload?key=6d207e02198a847aa98d0a2a901485a5', // Free imgbb API key
            form,
            { headers: form.getHeaders() }
        );

        // ========= 4. RESULT =========
        if (data.success) {
            await reply(`✅ Uploaded Successfully!\n\n${data.data.url}`);
        } else {
            reply('❌ Upload failed: ' + (data.error?.message || 'Unknown error'));
        }

    } catch (e) {
        console.error(e);
        reply('❌ Error: ' + e.message);
    }
});
