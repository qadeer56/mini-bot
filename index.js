const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const express = require("express");
const QRCode = require("qrcode");

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// CONFIG
// ==========================================

const AUTH_FOLDER = "/data/auth_info";

// ==========================================
// GLOBAL VARIABLES
// ==========================================

let currentQR = null;
let isConnected = false;
let sock = null;

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

🤖 AI
• .ai <question>
• .ask <question>

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
• .autochat on
• .autochat off

👑 OWNER
• .owner

━━━━━━━━━━━━━━━━━━━━━━
🔥 Qadeer AI Bot
🚀 Online & Ready
━━━━━━━━━━━━━━━━━━━━━━
`;
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
<meta name="viewport" content="width=device-width, initial-scale=1.0">

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
<meta name="viewport" content="width=device-width, initial-scale=1.0">

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

<title>Qadeer AI Bot - Login</title>

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

<h1>🤖 Qadeer AI Bot</h1>

<p>WhatsApp se QR scan karo</p>

<img src="${qrImage}" />

<div class="steps">

<b>📱 Steps:</b><br>

1. WhatsApp open karo<br>
2. Settings → Linked Devices<br>
3. Link a Device<br>
4. QR scan karo

</div>

</div>

</body>

</html>
`);

    } catch (error) {

        console.log("QR Error:", error.message);

        res.send("QR generation error.");

    }

});

// ==========================================
// START WEB SERVER
// ==========================================

app.listen(PORT, () => {

    console.log(
        `🌐 Web server running on port ${PORT}`
    );

});

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

        // Save WhatsApp authentication
        sock.ev.on(
            "creds.update",
            saveCreds
        );

        // ======================================
        // CONNECTION
        // ======================================

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

        // ======================================
        // MESSAGES
        // ======================================

        sock.ev.on(
            "messages.upsert",
            async ({ messages }) => {

                try {

                    const msg = messages[0];

                    if (!msg) return;

                    // Ignore own messages
                    if (msg.key?.fromMe) return;

                    const jid =
                        msg.key.remoteJid;

                    // Ignore WhatsApp status
                    if (
                        jid ===
                        "status@broadcast"
                    ) {
                        return;
                    }

                    const message =
                        msg.message;

                    if (!message) return;

                    let text = "";

                    // Normal message
                    if (
                        message.conversation
                    ) {

                        text =
                            message.conversation;

                    }

                    // Reply / quoted / extended message
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

                    text = text.trim();

                    if (!text) return;

                    const lower =
                        text.toLowerCase();

                    console.log(
                        `📩 ${text}`
                    );

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
                        lower === "assalamualaikum"
                    ) {

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                    "Wa Alaikum Assalam bhai ❤️🤖 Qadeer AI Bot hazir hai 😎"
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
                    // AI PLACEHOLDER
                    // ==================================

                    if (
                        lower === ".ai" ||
                        lower.startsWith(".ai ")
                    ) {

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                    "🤖 AI system ready hai, lekin API credits abhi available nahi hain."
                            }
                        );

                        return;
                    }

                    // ==================================
                    // ASK PLACEHOLDER
                    // ==================================

                    if (
                        lower === ".ask" ||
                        lower.startsWith(".ask ")
                    ) {

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                    "🧠 AI system ready hai, lekin API credits abhi available nahi hain."
                            }
                        );

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
// START
// ==========================================

startBot();
