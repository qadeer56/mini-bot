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

let currentQR = null;
let isConnected = false;
let sock = null;

// ================================
// WEB PAGE
// ================================

app.get("/", async (req, res) => {
    let qrImage = "";

    if (currentQR) {
        qrImage = await QRCode.toDataURL(currentQR);
    }

    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Qadeer AI Bot</title>

    <style>
        body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: #111827;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .box {
            background: #1f2937;
            width: 90%;
            max-width: 430px;
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            box-sizing: border-box;
            box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        }

        h1 {
            margin-top: 0;
            font-size: 28px;
        }

        .status {
            margin: 15px 0 25px;
            padding: 12px;
            border-radius: 10px;
            background: #374151;
        }

        img {
            width: 280px;
            max-width: 100%;
            background: white;
            padding: 12px;
            border-radius: 12px;
        }

        .instruction {
            margin-top: 25px;
            line-height: 1.6;
            color: #d1d5db;
        }

        .connected {
            font-size: 22px;
            padding: 25px;
            background: #065f46;
            border-radius: 15px;
        }

        .waiting {
            font-size: 18px;
            padding: 25px;
        }
    </style>

    <meta http-equiv="refresh" content="5">
</head>

<body>

<div class="box">

    <h1>🤖 Qadeer AI Bot</h1>

    ${
        isConnected
        ?
        `
        <div class="connected">
            ✅ WhatsApp Connected
        </div>

        <p class="instruction">
            Qadeer AI Bot is online and ready.
        </p>
        `
        :
        currentQR
        ?
        `
        <div class="status">
            📱 Scan this QR with WhatsApp
        </div>

        <img src="${qrImage}" alt="WhatsApp QR Code">

        <div class="instruction">
            Open WhatsApp →<br>
            Linked Devices →<br>
            Link a Device →<br>
            Scan this QR
        </div>
        `
        :
        `
        <div class="waiting">
            ⏳ Waiting for WhatsApp QR...
            <br><br>
            Please wait.
        </div>
        `
    }

</div>

</body>
</html>
    `);
});


// ================================
// SERVER
// ================================

app.listen(PORT, () => {
    console.log("================================");
    console.log("🌐 QADEER AI BOT WEB SERVER");
    console.log("================================");
    console.log("PORT:", PORT);
});


// ================================
// WHATSAPP BOT
// ================================

async function startBot() {

    console.log("");
    console.log("🚀 Starting WhatsApp Bot...");

    const { state, saveCreds } =
        await useMultiFileAuthState("auth_info");

    sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent" }),
        markOnlineOnConnect: false
    });

    // Save WhatsApp session
    sock.ev.on("creds.update", saveCreds);


    // ================================
    // CONNECTION
    // ================================

    sock.ev.on("connection.update", async (update) => {

        const {
            connection,
            lastDisconnect,
            qr
        } = update;


        // New QR received
        if (qr) {

            currentQR = qr;
            isConnected = false;

            console.log("");
            console.log("📱 NEW WHATSAPP QR GENERATED");
            console.log("🌐 Open your Railway domain to scan it.");
        }


        // Connected
        if (connection === "open") {

            currentQR = null;
            isConnected = true;

            console.log("");
            console.log("================================");
            console.log("✅ QADEER AI BOT READY");
            console.log("✅ WHATSAPP CONNECTED");
            console.log("================================");
        }


        // Connection closed
        if (connection === "close") {

            isConnected = false;
            currentQR = null;

            const statusCode =
                lastDisconnect?.error?.output?.statusCode;

            console.log("");
            console.log("❌ WhatsApp connection closed");
            console.log("Status:", statusCode);

            const shouldReconnect =
                statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {

                console.log("🔄 Reconnecting in 5 seconds...");

                setTimeout(() => {
                    startBot();
                }, 5000);

            } else {

                console.log("🔒 WhatsApp logged out.");
                console.log("Please reconnect the device.");
            }
        }
    });


    // ================================
    // RECEIVE MESSAGES
    // ================================

    sock.ev.on("messages.upsert", async ({ messages, type }) => {

        if (type !== "notify") return;

        for (const msg of messages) {

            if (!msg.message) continue;
            if (msg.key.fromMe) continue;

            const jid = msg.key.remoteJid;

            const text =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                "";

            if (!text) continue;

            console.log("");
            console.log("📩 MESSAGE RECEIVED");
            console.log("From:", jid);
            console.log("Text:", text);


            // HELLO TEST
            if (text.toLowerCase().trim() === "hello") {

                await sock.sendMessage(jid, {
                    text:
                        "😂 O bhai! Hello! Qadeer AI Bot online hai 😎🔥"
                });

                console.log("✅ Hello reply sent");
            }


            // PING TEST
            if (text.toLowerCase().trim() === ".ping") {

                await sock.sendMessage(jid, {
                    text:
                        "🏓 Pong! Qadeer AI Bot zinda hai 😎🔥"
                });

                console.log("✅ Ping reply sent");
            }
        }
    });
}


// ================================
// START
// ================================

startBot().catch((error) => {

    console.error("");
    console.error("🔥 BOT ERROR:");
    console.error(error);

});
