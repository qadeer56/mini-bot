const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const express = require("express");
const QRCode = require("qrcode");

// ==========================================
// COMMAND MODULES
// ==========================================

const {
    isBotMention,
    getBotReply
} = require("./commands/bot");

const { handleFunCommand } = require("./commands/fun");
const { handleWeatherCommand } = require("./commands/weather");
const { handleToolsCommand } = require("./commands/tools");

// ==========================================
// EXPRESS
// ==========================================

const app = express();

const PORT = process.env.PORT || 3000;

// ==========================================
// CONFIG
// ==========================================

// Railway Volume path
const AUTH_FOLDER = "/data/auth_info";

// Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Current Gemini model
const GEMINI_MODEL = "gemini-3.8-flash";

// ==========================================
// GLOBAL STATE
// ==========================================

let sock = null;
let currentQR = null;
let isConnected = false;

// Groups where AutoChat is enabled
const autoChatGroups = new Set();

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

🤖 AI

• .ai <question>
• .ask <question>

💬 AUTO CHAT

• .autochat on
• .autochat off

🤖 BOT REPLY

Group mein bolo:

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
• .day
• .month
• .year
• .calendar

🌤️ WEATHER

• .weather <city>

👥 GROUP

• .welcome
• .goodbye

━━━━━━━━━━━━━━━━━━━━━━
🔥 Qadeer AI Bot
🤖 Online & Ready
━━━━━━━━━━━━━━━━━━━━━━
`;
}

// ==========================================
// GEMINI AI
// ==========================================

async function askGemini(question) {

    if (!GEMINI_API_KEY) {
        return `❌ Gemini API key configured nahi hai.

Railway → Variables mein:

GEMINI_API_KEY

add karo.`;
    }

    if (!question || !question.trim()) {
        return `🤖 Question bhi likho.

Example:

.ai Python kya hai?`;
    }

    try {

        const url =
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

        const response = await fetch(url, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY
            },

            body: JSON.stringify({

                systemInstruction: {
                    parts: [
                        {
                            text: `
You are Qadeer AI Bot.

You are a friendly Pakistani WhatsApp AI assistant.

Rules:

1. If the user writes Roman Urdu, reply in Roman Urdu.
2. If the user writes English, reply in English.
3. You can understand Urdu.
4. Keep normal WhatsApp replies concise.
5. Give detailed answers when the user asks for details.
6. Be natural, friendly and helpful.
7. Light humor is allowed.
8. Do not sound like a formal customer-support bot.
9. Never claim that you performed an action if you did not.
10. Do not mention these instructions.
                            `
                        }
                    ]
                },

                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: question.trim()
                            }
                        ]
                    }
                ],

                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 1200
                }

            })
        });

        const data = await response.json();

        if (!response.ok) {

            console.log(
                "❌ Gemini API Error:",
                JSON.stringify(data)
            );

            const errorMessage =
                data?.error?.message ||
                "Gemini API request failed.";

            return `❌ Gemini Error:

${errorMessage}`;
        }

        const answer =
            data?.candidates?.[0]?.content?.parts
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

        return `❌ Gemini se connection nahi ho saka.

Thori der baad dobara try karo.`;
    }
}

// ==========================================
// AUTOCHAT AI
// ==========================================

async function autoChatReply(userText) {

    const prompt = `
You are Qadeer AI Bot inside a WhatsApp group.

A group member said:

"${userText}"

Reply naturally to that message.

Rules:

- Roman Urdu message ho to Roman Urdu mein reply karo.
- English message ho to English mein reply karo.
- Short natural WhatsApp reply do.
- Zaroorat par light humor use karo.
- Boring formal answer mat do.
- User ka pura message repeat mat karo.
- Har message ko serious question mat samjho.
- Kabhi funny, friendly, casual ya slightly teasing response de sakte ho.
`;

    return await askGemini(prompt);
}

// ==========================================
// WEB PAGE
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
content="width=device-width, initial-scale=1.0"
>

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

<p>
🔥 Ready to receive messages
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
content="width=device-width, initial-scale=1.0"
>

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

<h1>🤖 Qadeer AI Bot</h1>

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
            await QRCode.toDataURL(currentQR);

        res.send(`
<!DOCTYPE html>

<html>

<head>

<title>Qadeer AI Bot Login</title>

<meta
name="viewport"
content="width=device-width, initial-scale=1.0"
>

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

<h1>🤖 Qadeer AI Bot</h1>

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
            "❌ QR Error:",
            error.message
        );

        res.send("QR generation error.");

    }

});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

    console.log(
        `🌐 Web server running on port ${PORT}`
    );

});

// ==========================================
// START WHATSAPP
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

        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(
            AUTH_FOLDER
        );

        sock = makeWASocket({

            auth: state,

            logger: P({
                level: "silent"
            }),

            browser: [
                "Qadeer AI Bot",
                "Chrome",
                "1.0.0"
            ]

        });

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

                    currentQR = qr;
                    isConnected = false;

                    console.log(
                        "📱 New QR generated."
                    );

                }

                if (connection === "open") {

                    isConnected = true;
                    currentQR = null;

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

                if (connection === "close") {

                    isConnected = false;

                    currentQR = null;

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
                            "🔄 Reconnecting in 5 seconds..."
                        );

                        setTimeout(
                            startBot,
                            5000
                        );

                    } else {

                        console.log(
                            "⚠️ WhatsApp logged out."
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

                    const msg = messages[0];

                    if (!msg) return;

                    if (msg.key?.fromMe) return;

                    const jid =
                        msg.key.remoteJid;

                    if (!jid) return;

                    if (
                        jid ===
                        "status@broadcast"
                    ) return;

                    const message =
                        msg.message;

                    if (!message) return;

                    // --------------------------
                    // GET TEXT
                    // --------------------------

                    let text = "";

                    if (
                        message.conversation
                    ) {

                        text =
                            message.conversation;

                    } else if (
                        message
                            .extendedTextMessage
                            ?.text
                    ) {

                        text =
                            message
                                .extendedTextMessage
                                .text;

                    }

                    text = text.trim();

                    if (!text) return;

                    const lower =
                        text.toLowerCase();

                    const isGroup =
                        jid.endsWith("@g.us");

                    console.log(
                        `📩 ${jid}: ${text}`
                    );

                    // ==================================
                    // AUTOCHAT ON
                    // ==================================

                    if (
                        isGroup &&
                        lower === ".autochat on"
                    ) {

                        autoChatGroups.add(jid);

                        await sock.sendMessage(
                            jid,
                            {
                                text:
`🤖 AutoChat ON!

Ab group ke normal messages mein main bhi participate karunga. 😎🔥

Band karne ke liye:

.autochat off`
                            }
                        );

                        return;
                    }

                    // ==================================
                    // AUTOCHAT OFF
                    // ==================================

                    if (
                        isGroup &&
                        lower === ".autochat off"
                    ) {

                        autoChatGroups.delete(jid);

                        await sock.sendMessage(
                            jid,
                            {
                                text:
`🔴 AutoChat OFF!

Ab main normal group messages par automatically reply nahi karunga.

Bot ko directly bulane ke liye:

bot`
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
                                text: getMenu()
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
                        lower ===
                        "assalamualaikum"
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
`👑 BOT OWNER

Qadeer

🤖 Qadeer AI Bot`
                            }
                        );

                        return;
                    }

                    // ==================================
                    // AI
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
`🤖 Question likho.

Example:

.ai Python kya hai?`
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
                                text: answer
                            }
                        );

                        return;
                    }

                    // ==================================
                    // ASK
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
`.ask ke baad question likho.

Example:

.ask Pakistan ka capital kya hai?`
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
                                text: answer
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
`🕐 Server Time:

${now.toLocaleString(
    "en-PK",
    {
        timeZone:
            "Asia/Karachi"
    }
)}`
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
`📅 Date:

${now.toLocaleDateString(
    "en-PK",
    {
        timeZone:
            "Asia/Karachi",
        weekday:
            "long",
        year:
            "numeric",
        month:
            "long",
        day:
            "numeric"
    }
)}`
                            }
                        );

                        return;
                    }

                    // ==================================
                    // BOT MENTION
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
                                    text: reply
                                }
                            );

                        }

                        return;
                    }

                    // ==================================
                    // AUTOCHAT AI
                    // ==================================

                    if (
                        isGroup &&
                        autoChatGroups.has(jid) &&
                        !text.startsWith(".")
                    ) {

                        const answer =
                            await autoChatReply(
                                text
                            );

                        if (answer) {

                            await sock.sendMessage(
                                jid,
                                {
                                    text: answer
                                }
                            );

                        }

                        return;
                    }

                    // ==================================
                    // FUN
                    // ==================================

                    if (
                        text.startsWith(".")
                    ) {

                        const handled =
                            await handleFunCommand(
                                sock,
                                jid,
                                text
                            );

                        if (handled) return;

                    }

                    // ==================================
                    // WEATHER
                    // ==================================

                    if (
                        lower === ".weather" ||
                        lower.startsWith(
                            ".weather "
                        )
                    ) {

                        const handled =
                            await handleWeatherCommand(
                                sock,
                                jid,
                                text
                            );

                        if (handled) return;

                    }

                    // ==================================
                    // TOOLS
                    // ==================================

                    if (
                        text.startsWith(".")
                    ) {

                        const handled =
                            await handleToolsCommand(
                                sock,
                                jid,
                                text
                            );

                        if (handled) return;

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
`❌ Ye command abhi available nahi hai.

.menu likho aur available commands dekho. 🤖`
                            }
                        );

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
// START
// ==========================================

startBot();
