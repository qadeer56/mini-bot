 const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const express = require("express");
const QRCode = require("qrcode");


// ===============================
// CONFIG
// ===============================

const app = express();
const PORT = process.env.PORT || 3000;

// Railway Persistent Volume
const AUTH_FOLDER = "/data/auth_info";

// Apna WhatsApp number yahan baad mein set karna
// Example: 923001234567
const OWNER_NUMBER = "923XXXXXXXXX";


// ===============================
// GLOBAL VARIABLES
// ===============================

let currentQR = null;
let isConnected = false;
let sock = null;


// ===============================
// BOT MENU
// ===============================

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


// ===============================
// EXPRESS WEB SERVER
// ===============================

app.get("/", async (req, res) => {

    if (isConnected) {

        return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Qadeer AI Bot</title>

            <meta name="viewport"
            content="width=device-width, initial-scale=1.0">

            <style>

                body {
                    background: #111827;
                    color: white;
                    font-family: Arial, sans-serif;

                    display: flex;
                    justify-content: center;
                    align-items: center;

                    min-height: 100vh;
                    margin: 0;
                }

                .box {
                    background: #1f2937;
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    width: 90%;
                    max-width: 450px;

                    box-shadow:
                    0 10px 30px rgba(0,0,0,0.4);
                }

                .status {
                    color: #22c55e;
                    font-size: 24px;
                    font-weight: bold;
                }

                p {
                    color: #d1d5db;
                }

            </style>
        </head>

        <body>

            <div class="box">

                <div class="status">
                    🟢 WhatsApp Connected
                </div>

                <p>
                    Qadeer AI Bot is online and running.
                </p>

                <p>
                    🤖 Ready for messages
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
            <meta name="viewport"
            content="width=device-width, initial-scale=1.0">

            <style>

                body {
                    background: #111827;
                    color: white;
                    font-family: Arial, sans-serif;

                    display: flex;
                    justify-content: center;
                    align-items: center;

                    min-height: 100vh;
                    margin: 0;
                }

                .box {
                    background: #1f2937;
                    padding: 35px;
                    border-radius: 20px;
                    text-align: center;
                    width: 90%;
                    max-width: 450px;
                }

                h1 {
                    margin-bottom: 10px;
                }

                p {
                    color: #d1d5db;
                }

            </style>
        </head>

        <body>

            <div class="box">

                <h1>🤖 Qadeer AI Bot</h1>

                <p>
                    QR code is being generated...
                </p>

                <p>
                    Please refresh this page.
                </p>

            </div>

        </body>
        </html>
        `);
    }


    try {

        const qrImage = await QRCode.toDataURL(currentQR);

        res.send(`
        <!DOCTYPE html>

        <html>

        <head>

            <title>Qadeer AI Bot - WhatsApp Login</title>

            <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0">

            <style>

                * {
                    box-sizing: border-box;
                }

                body {

                    background: #111827;

                    color: white;

                    font-family: Arial, sans-serif;

                    display: flex;

                    justify-content: center;

                    align-items: center;

                    min-height: 100vh;

                    margin: 0;

                    padding: 20px;

                }

                .box {

                    background: #1f2937;

                    padding: 30px;

                    border-radius: 20px;

                    text-align: center;

                    width: 100%;

                    max-width: 430px;

                    box-shadow:
                    0 10px 30px
                    rgba(0,0,0,0.4);

                }

                h1 {

                    margin-top: 0;

                }

                img {

                    width: 280px;

                    max-width: 90%;

                    background: white;

                    padding: 10px;

                    border-radius: 12px;

                }

                .steps {

                    text-align: left;

                    margin-top: 20px;

                    line-height: 1.8;

                    color: #d1d5db;

                }

                .refresh {

                    margin-top: 15px;

                    color: #60a5fa;

                }

            </style>

        </head>

        <body>

            <div class="box">

                <h1>🤖 Qadeer AI Bot</h1>

                <p>Scan this QR code with WhatsApp</p>

                <img src="${qrImage}" />

                <div class="steps">

                    <b>📱 WhatsApp:</b><br>

                    1. Open WhatsApp<br>

                    2. Settings → Linked Devices<br>

                    3. Link a Device<br>

                    4. Scan this QR code

                </div>

                <div class="refresh">

                    QR expire ho jaye to page refresh karein.
                </div>

            </div>

        </body>

        </html>
        `);

    } catch (error) {

        res.send("QR generation error.");

    }

});


// ===============================
// START WEB SERVER
// ===============================

app.listen(PORT, () => {

    console.log(`🌐 Web server running on port ${PORT}`);

});


// ===============================
// START WHATSAPP BOT
// ===============================

async function startBot() {

    try {

        console.log("🚀 Starting Qadeer AI Bot...");

        console.log("📁 Auth folder:", AUTH_FOLDER);


        // Persistent authentication
        const { state, saveCreds } =
            await useMultiFileAuthState(AUTH_FOLDER);


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


        // Save login credentials
        sock.ev.on(
            "creds.update",
            saveCreds
        );


        // ===============================
        // CONNECTION UPDATE
        // ===============================

        sock.ev.on(
            "connection.update",
            async (update) => {

                const {
                    connection,
                    lastDisconnect,
                    qr
                } = update;


                // New QR received
                if (qr) {

                    currentQR = qr;

                    isConnected = false;

                    console.log(
                        "📱 New QR generated."
                    );

                    console.log(
                        "🌐 Open Railway domain to scan QR."
                    );

                }


                // Connected
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
                        "🤖 Qadeer AI Bot is ONLINE"
                    );

                    console.log(
                        "================================"
                    );

                }


                // Connection closed
                if (connection === "close") {

                    isConnected = false;

                    currentQR = null;


                    const statusCode =
                        lastDisconnect
                        ?.error
                        ?.output
                        ?.statusCode;


                    const shouldReconnect =
                        statusCode !==
                        DisconnectReason.loggedOut;


                    console.log(
                        "🔴 WhatsApp connection closed."
                    );


                    if (shouldReconnect) {

                        console.log(
                            "🔄 Reconnecting..."
                        );

                        setTimeout(() => {

                            startBot();

                        }, 5000);

                    } else {

                        console.log(
                            "⚠️ WhatsApp logged out."
                        );

                        console.log(
                            "📱 New QR login required."
                        );

                    }

                }

            }
        );


        // ===============================
        // MESSAGE HANDLER
        // ===============================

        sock.ev.on(
            "messages.upsert",
            async ({ messages }) => {

                try {

                    const msg = messages[0];


                    if (!msg) return;


                    // Ignore own messages
                    if (
                        msg.key &&
                        msg.key.fromMe
                    ) {
                        return;
                    }


                    const jid =
                        msg.key.remoteJid;


                    // Ignore status
                    if (
                        jid ===
                        "status@broadcast"
                    ) {
                        return;
                    }


                    const message =
                        msg.message;


                    if (!message) return;


                    // ===============================
                    // GET TEXT
                    // ===============================

                    let text = "";


                    if (
                        message.conversation
                    ) {

                        text =
                            message.conversation;

                    }

                    else if (
                        message.extendedTextMessage
                        ?.text
                    ) {

                        text =
                            message
                            .extendedTextMessage
                            .text;

                    }


                    text =
                        text
                        .trim();


                    if (!text) return;


                    const lower =
                        text.toLowerCase();


                    console.log(
                        `📩 Message: ${text}`
                    );


                    // ===============================
                    // MENU
                    // ===============================

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


                    // ===============================
                    // PING
                    // ===============================

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


                    // ===============================
                    // HELLO
                    // ===============================

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


                    // ===============================
                    // SALAM
                    // ===============================

                    if (
                        lower === "salam" ||
                        lower ===
                        "assalamualaikum"
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


                    // ===============================
                    // OWNER
                    // ===============================

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


                    // ===============================
                    // TIME
                    // ===============================

                    if (
                        lower === ".time"
                    ) {

                        const now =
                            new Date();

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                `🕐 Current Server Time:\n${now.toLocaleString()}`
                            }
                        );

                        return;

                    }


                    // ===============================
                    // DATE
                    // ===============================

                    if (
                        lower === ".date"
                    ) {

                        const now =
                            new Date();

                        await sock.sendMessage(
                            jid,
                            {
                                text:
                                `📅 Today:\n${now.toDateString()}`
                            }
                        );

                        return;

                    }


                    // ===============================
                    // UNKNOWN COMMAND
                    // ===============================

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


                    // ===============================
                    // NORMAL MESSAGE
                    // ===============================

                    console.log(
                        "💬 Normal message received:",
                        text
                    );


                } catch (error) {

                    console.log(
                        "❌ Message error:",
                        error.message
                    );

                }

            }
        );


    } catch (error) {

        console.log(
            "❌ Bot startup error:",
            error
        );


        setTimeout(() => {

            startBot();

        }, 5000);

    }

}


// ===============================
// START
// ===============================

startBot();
