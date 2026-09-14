const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const qrcode = require("qrcode-terminal");

async function startBot() {
    console.log("================================");
    console.log("🚀 QADEER AI BOT STARTING...");
    console.log("================================");

    const { state, saveCreds } =
        await useMultiFileAuthState("auth_info");

    const sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent" }),
        markOnlineOnConnect: false
    });

    // Save WhatsApp login/session
    sock.ev.on("creds.update", saveCreds);

    // Connection
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // QR Code
        if (qr) {
            console.log("");
            console.log("📱 WHATSAPP QR CODE:");
            console.log("Scan this QR from WhatsApp > Linked Devices");
            console.log("");

            qrcode.generate(qr, { small: true });
        }

        // Connected
        if (connection === "open") {
            console.log("");
            console.log("================================");
            console.log("✅ QADEER AI BOT READY");
            console.log("✅ WHATSAPP CONNECTED");
            console.log("================================");
        }

        // Disconnected
        if (connection === "close") {
            const statusCode =
                lastDisconnect?.error?.output?.statusCode;

            const shouldReconnect =
                statusCode !== DisconnectReason.loggedOut;

            console.log("❌ WhatsApp connection closed");
            console.log("Status:", statusCode);

            if (shouldReconnect) {
                console.log("🔄 Reconnecting...");
                setTimeout(startBot, 5000);
            } else {
                console.log("🔒 WhatsApp logged out.");
                console.log("Please login again.");
            }
        }
    });

    // Receive messages
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== "notify") return;

        const msg = messages[0];

        if (!msg || !msg.message) return;
        if (msg.key.fromMe) return;

        const jid = msg.key.remoteJid;

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            "";

        if (!text) return;

        console.log("");
        console.log("📩 MESSAGE RECEIVED");
        console.log("From:", jid);
        console.log("Text:", text);

        // Test reply
        if (text.toLowerCase().trim() === "hello") {
            await sock.sendMessage(jid, {
                text: "😂 O bhai! Hello! Qadeer AI Bot online hai 😎🔥"
            });

            console.log("✅ Reply sent");
        }

        // Test command
        if (text.toLowerCase().trim() === ".ping") {
            await sock.sendMessage(jid, {
                text: "🏓 Pong! Qadeer AI Bot zinda hai 😎"
            });

            console.log("🏓 Ping reply sent");
        }
    });
}

startBot().catch((error) => {
    console.error("🔥 BOT ERROR:");
    console.error(error);
});
