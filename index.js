const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const express = require("express");
const QRCode = require("qrcode");

// ==========================================
// BOT REPLY SYSTEM
// ==========================================

const {
    isBotMention,
    getBotReply
} = require("./commands/bot");

// ==========================================
// EXPRESS SERVER
// ==========================================

const app = express();

const PORT =
    process.env.PORT || 3000;

// ==========================================
// CONFIG
// ==========================================

const AUTH_FOLDER =
    "/data/auth_info";

const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY;

// Gemini model
const GEMINI_MODEL =
    "gemini-1.5-flash";

// ==========================================
// GLOBAL VARIABLES
// ==========================================

let currentQR = null;

let isConnected = false;

let sock = null;

// ==========================================
// AUTOCHAT MEMORY
// ==========================================

const autoChatGroups =
    new Set();

// ==========================================
// MENU
// ==========================================

function getMenu() {

    return `
╭━━━━━━━━━━━━━━━━━━━━━━╮
      🤖 QADEER AI BOT
╰━━━━━━━━━━━━━━━━━━━━━━╯

👋 BASIC

• hello
• hi
• salam
• assalamualaikum

🛠️ BOT

• .menu
• .ping
• .owner

🤖 GEMINI AI

• .ai <question>
• .ask <question>

💬 AUTO CHAT

• .autochat on
• .autochat off

🤖 AUTO BOT REPLY

Group mein:
• bot
• oye bot
• hey bot
• ai bot

🎮 FUN

• .joke
• .love
• .roast
• .quote

🛠️ TOOLS

• .time
• .date

👥 GROUP

• .welcome
• .goodbye

━━━━━━━━━━━━━━━━━━━━━━
🔥 Qadeer AI Bot
🚀 Online & Ready
━━━━━━━━━━━━━━━━━━━━━━
`;
}

// ==========================================
// GEMINI AI FUNCTION
// ==========================================

async function askGemini(question) {

    if (!GEMINI_API_KEY) {

        return "❌ Gemini API key configured nahi hai.\n\nRailway → Variables mein `GEMINI_API_KEY` add karo.";
    }

    if (!question || !question.trim()) {

        return "🤖 Question bhi likho.\n\nExample:\n`.ai Python kya hai?`";
    }

    try {

        const url =
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

        const response =
            await fetch(
                url,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        system_instruction: {

                            parts: [
                                {
                                    text:
                                        `You are Qadeer AI Bot, a friendly Pakistani WhatsApp assistant.

Talk naturally and helpfully.

Use simple language.

If the user speaks Roman Urdu, reply in Roman Urdu.

If the user speaks English, reply in English.

Keep normal WhatsApp answers reasonably concise unless detailed explanation is requested.

You can be funny and friendly when appropriate.

Do not claim you performed actions that you cannot actually perform.`
                                }
                            ]

                        },

                        contents: [

                            {
                                role: "user",

                                parts: [
                                    {
                                        text:
                                            question.trim()
                                    }
                                ]
                            }

                        ],

                        generationConfig: {

                            temperature: 0.8,

                            maxOutputTokens: 1000

                        }

                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            console.log(
                "Gemini API Error:",
                JSON.stringify(data)
            );

            const errorMessage =
                data?.error?.message ||
                "Gemini API request failed.";

            return `❌ Gemini Error:\n${errorMessage}`;
        }

        const answer =
            data
                ?.candidates?.[0]
                ?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();

        if (!answer) {

            return "🤖 Gemini ne is waqt koi answer nahi diya.";
        }

        return answer;

    } catch (error) {

        console.log(
            "❌ Gemini Request Error:",
            error.message
        );

        return "❌ Gemini se connection nahi ho saka. Thori der baad dobara try karo.";
    }
}

// ==========================================
// AUTOCHAT PROMPT
// ==========================================

async function autoChatReply(
    userText,
    groupJid
) {

    const prompt = `
You are Qadeer AI Bot chatting naturally in a WhatsApp group.

Someone in the group said:

"${userText}"

Reply naturally to that message.

Rules:
- Roman Urdu if the message is Roman Urdu.
- English if the message is English.
- Keep it conversational.
- Don't say you are an AI unless relevant.
- Don't repeat the user's whole message.
- Usually keep it short.
- You can use light humor.
- Don't be excessively formal.
`;

    return await askGemini(prompt);
}

// ==========================================
// WEB SERVER
// ==========================================

app.get("/", async (req, res) => {

    if (isConnected) {

        return res.send(`
<!DOCTYPE html>
<html>

<head>

<title>Qadeer AI Bot</title>

<meta
name="viewport"
content="width=device-width, initial-scale=1.0">

<style>

body {

    background:#111827;
    color:white;
    font-family:Arial;

    display:flex;
    justify-content:center;
    align-items:center;

    min-height:100vh;

    margin:0;
}

.box {

    background:#1f2937;

    padding:40px;

    border-radius:20px;

    text-align:center;

    width:90%;
    max-width:450px;
}

.status {

    color:#22c55e;

    font-size:24px;

    font-weight:bold;
}

p {

    color:#d1d5db;
}

</style>

</head>

<body>

<div class="box">

<div class="status">

🟢 WhatsApp Connected

</div>

<p>

🤖 Qadeer AI Bot is online

</p>

</div>

</body>

</html>
`);

    }

    if (!currentQR) {

        return res.send(`
<!DOCTYPE html>
<html>

<head>

<title>Qadeer AI Bot</title>

<meta
name="viewport"
content="width=device-width, initial-scale=1.0">

<style>

body {

    background:#111827;
    color:white;
    font-family:Arial;

    display:flex;
    justify-content:center;
    align-items:center;

    min-height:100vh;

    margin:0;
}

.box {

    background:#1f2937;

    padding:35px;

    border-radius:20px;

    text-align:center;
}

</style>

</head>

<body>

<div class="box">

<h1>
🤖 Qadeer AI Bot
</h1>

<p>
QR code generate ho raha hai...
</p>

<p>
Page refresh karo.
</p>

</div>

</body>

</html>
`);

    }

    try {

        const qrImage =
            await QRCode.toDataURL(
                currentQR
            );

        res.send(`
<!DOCTYPE html>
<html>

<head>

<title>
Qadeer AI Bot - Login
</title>

<meta
name="viewport"
content="width=device-width, initial-scale=1.0">

<style>

body {

    background:#111827;

    color:white;

    font-family:Arial;

    display:flex;

    justify-content:center;

    align-items:center;

    min-height:100vh;

    margin:0;

    padding:20px;
}

.box {

    background:#1f2937;

    padding:30px;

    border-radius:20px;

    text-align:center;

    width:100%;

    max-width:430px;
}

img {

    width:280px;

    max-width:90%;

    background:white;

    padding:10px;

    border-radius:12px;
}

.steps {

    text-align:left;

    margin-top:20px;

    line-height:1.8;

    color:#d1d5db;
}

</style>

</head>

<body>

<div class="box">

<h1>
🤖 Qadeer AI Bot
</h1>

<p>
WhatsApp se QR scan karo
</p>

<img src="${qrImage}" />

<div class="steps">

<b>📱 Steps:</b>
<br>

1. WhatsApp open karo
<br>

2. Settings → Linked Devices
<br>

3. Link a Device
<br>

4. QR scan karo

</div>

</div>

</body>

</html>
`);

    } catch (error) {

        console.log(
            "QR Error:",
            error.message
        );

        res.send(
            "QR generation error."
        );

    }

});

// ==========================================
// START WEB SERVER
// ==========================================

app.listen(
    PORT,
    () => {

        console.log(
            `🌐 Web server running on port ${PORT}`
        );

    }
);

// ==========================================
// START WHATSAPP BOT
// ==========================================

async function startBot() {

    try {

        console.log(
            "🚀 Starting Qadeer AI Bot..."
        );

        console.log(
            "📁 Auth folder:",
            AUTH_FOLDER
        );

        if (GEMINI_API_KEY) {

            console.log(
                "🟢 Gemini API key detected."
            );

        } else {

            console.log(
                "⚠️ GEMINI_API_KEY not found."
            );

        }

        // ==================================
        // WHATSAPP AUTH
        // ==================================

        const {
            state,
            saveCreds
        } =
            await useMultiFileAuthState(
                AUTH_FOLDER
            );

        // ==================================
        // CREATE SOCKET
        // ==================================

        sock =
            makeWASocket({

                auth: state,

                logger:
                    P({
                        level: "silent"
                    }),

                browser: [

                    "Qadeer AI Bot",

                    "Chrome",

                    "1.0.0"

                ]

            });

        // ==================================
        // SAVE AUTH
        // ==================================

        sock.ev.on(
            "creds.update",
            saveCreds
        );

        // ==================================
        // CONNECTION
        // ==================================

        sock.ev.on(
            "connection.update",

            async (update) => {

                const {

                    connection,

                    lastDisconnect,

                    qr

                } = update;

                if (qr) {

                    currentQR =
                        qr;

                    isConnected =
                        false;

                    console.log(
                        "📱 New QR generated."
                    );

                }

                if (
                    connection ===
                    "open"
                ) {

                    isConnected =
                        true;

                    currentQR =
                        null;

                    console.log(
                        "================================"
                    );

                    console.log(
                        "🟢 WhatsApp Connected!"
                    );

                    console.log(
                        "🤖 Qadeer AI Bot ONLINE"
                    );

                    console.log(
                        "================================"
                    );

                }

                if (
                    connection ===
                    "close"
                ) {

                    isConnected =
                        false;

                    currentQR =
                        null;

                    const statusCode =
                        lastDisconnect
                            ?.error
                            ?.output
                            ?.statusCode;

                    const reconnect =
                        statusCode !==
                        DisconnectReason.loggedOut;

                    console.log(
                        "🔴 WhatsApp connection closed."
                    );

                    if (reconnect) {

                        console.log(
                            "🔄 Reconnecting..."
                        );

                        setTimeout(
                            startBot,
                            5000
                        );

                    }

                }

            }
        );

        // ==================================
        // MESSAGES
        // ==================================

        sock.ev.on(
            "messages.upsert",

            async ({ messages }) => {

                try {

                    const msg =
                        messages[0];

                    if (!msg) return;

                    if (
                        msg.key?.fromMe
                    ) {
                        return;
                    }

                    const jid =
                        msg.key.remoteJid;

                    if (
                        jid ===
                        "status@broadcast"
                    ) {
                        return;
                    }

                    const message =
                        msg.message;

                    if (!message) {
                        return;
                    }

                    let text = "";

                    // ==================================
                    // NORMAL MESSAGE
                    // ==================================

                    if (
                        message.conversation
                    ) {

                        text =
                            message.conversation;

                    }

                    // ==================================
                    // EXTENDED MESSAGE
                    // ==================================

                    else if (
                        message
                            .extendedTextMessage
                            ?.text
                    ) {

                        text =
                            message
                                .extendedTextMessage
                                .text;

                    }

                    text =
                        text.trim();

                    if (!text) {
                        return;
                    }

                    const lower =
                        text.toLowerCase();

                    const isGroup =
                        jid.endsWith("@g.us");

                    console.log(
                        `📩 ${text}`
                    );

                    // ==================================
                    // AUTOCHAT ON
                    // ==================================

                    if (
                        isGroup &&
                        lower ===
                        ".autochat on"
                    ) {

                        autoChatGroups.add(
                            jid
                        );

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                    "🤖 AutoChat ON!\n\nAb group mein normal messages par main bhi conversation mein participate karunga. 😎🔥\n\nBand karne ke liye:\n`.autochat off`"
                            }
                        );

                        return;
                    }

                    // ==================================
                    // AUTOCHAT OFF
                    // ==================================

                    if (
                        isGroup &&
                        lower ===
                        ".autochat off"
                    ) {

                        autoChatGroups.delete(
                            jid
                        );

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                    "🔴 AutoChat OFF!\n\nAb main normal group messages par automatically reply nahi karunga.\n\n`bot` bolo to meri normal bot-reply system phir bhi active rahegi. 🤖"
                            }
                        );

                        return;
                    }

                    // ==================================
                    // AUTO BOT REPLY
                    // ==================================

                    if (
                        isGroup &&
                        !text.startsWith(".") &&
                        isBotMention(text)
                    ) {

                        const reply =
                            getBotReply(text);

                        if (reply) {

                            await sock.sendMessage(
                                jid,
                                {
                                    text:
                                        reply
                                }
                            );

                        }

                        return;
                    }

                    // ==================================
                    // .AI
                    // ==================================

                    if (
                        lower === ".ai" ||
                        lower.startsWith(".ai ")
                    ) {

                        const question =
                            text
                                .slice(3)
                                .trim();

                        if (!question) {

                            await sock.sendMessage(
                                jid,
                                {
                                    text:
                                        "🤖 Question likho.\n\nExample:\n`.ai Python kya hai?`"
                                }
                            );

                            return;
                        }

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                    "🤖 Gemini soch raha hai... ⏳"
                            }
                        );

                        const answer =
                            await askGemini(
                                question
                            );

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                    answer
                            }
                        );

                        return;
                    }

                    // ==================================
                    // .ASK
                    // ==================================

                    if (
                        lower === ".ask" ||
                        lower.startsWith(".ask ")
                    ) {

                        const question =
                            text
                                .slice(4)
                                .trim();

                        if (!question) {

                            await sock.sendMessage(
                                jid,
                                {
                                    text:
                                        "🧠 Question likho.\n\nExample:\n`.ask Pakistan ka capital kya hai?`"
                                }
                            );

                            return;
                        }

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                    "🧠 Gemini answer prepare kar raha hai... ⏳"
                            }
                        );

                        const answer =
                            await askGemini(
                                question
                            );

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                    answer
                            }
                        );

                        return;
                    }

                    // ==================================
                    // MENU
                    // ==================================

                    if (
                        lower === ".menu" ||
                        lower === "menu"
                    ) {

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                    getMenu()
                            }
                        );

                        return;
                    }

                    // ==================================
                    // PING
                    // ==================================

                    if (
                        lower === ".ping"
                    ) {

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                    "🏓 Pong! Qadeer AI Bot zinda hai 😎🔥"
                            }
                        );

                        return;
                    }

                    // ==================================
                    // HELLO
                    // ==================================

                    if (
                        lower === "hello" ||
                        lower === "hi"
                    ) {

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                    "😂 O bhai! Hello! Qadeer AI Bot online hai 😎🔥"
                            }
                        );

                        return;
                    }

                    // ==================================
                    // SALAM
                    // ==================================

                    if (
                        lower === "salam" ||
                        lower === "assalamualaikum"
                    ) {

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                    "Wa Alaikum Assalam ❤️🤖 Qadeer AI Bot hazir hai 😎"
                            }
                        );

                        return;
                    }

                    // ==================================
                    // OWNER
                    // ==================================

                    if (
                        lower === ".owner"
                    ) {

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                    "👑 Bot Owner: Qadeer\n🤖 Qadeer AI Bot"
                            }
                        );

                        return;
                    }

                    // ==================================
                    // TIME
                    // ==================================

                    if (
                        lower === ".time"
                    ) {

                        const now =
                            new Date();

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                    `🕐 Server Time:\n${now.toLocaleString()}`
                            }
                        );

                        return;
                    }

                    // ==================================
                    // DATE
                    // ==================================

                    if (
                        lower === ".date"
                    ) {

                        const now =
                            new Date();

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                    `📅 Date:\n${now.toDateString()}`
                            }
                        );

                        return;
                    }

                    // ==================================
                    // AUTOCHAT AI RESPONSE
                    // ==================================

                    if (
                        isGroup &&
                        autoChatGroups.has(jid) &&
                        !text.startsWith(".")
                    ) {

                        const answer =
                            await autoChatReply(
                                text,
                                jid
                            );

                        if (answer) {

                            await sock.sendMessage(
                                jid,
                                {
                                    text:
                                        answer
                                }
                            );

                        }

                        return;
                    }

                    // ==================================
                    // UNKNOWN COMMAND
                    // ==================================

                    if (
                        text.startsWith(".")
                    ) {

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                    "❌ Ye command abhi available nahi hai.\n\n`.menu` likho aur available commands dekho. 🤖"
                            }
                        );

                        return;
                    }

                } catch (error) {

                    console.log(
                        "❌ Message Error:",
                        error.message
                    );

                }

            }
        );

    } catch (error) {

        console.log(
            "❌ Startup Error:",
            error.message
        );

        setTimeout(
            startBot,
            5000
        );

    }

}

// ==========================================
// START BOT
// ==========================================

startBot();
