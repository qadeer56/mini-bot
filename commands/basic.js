// ==========================================
// QADEER AI BOT - BASIC COMMANDS
// File: commands/basic.js
// ==========================================

async function handleBasicCommand(sock, jid, text) {

    const lower = text.toLowerCase().trim();

    // HELLO / HI
    if (
        lower === "hello" ||
        lower === "hi" ||
        lower === "hey"
    ) {
        await sock.sendMessage(jid, {
            text: "Hello bhai 👋\nMain Qadeer AI Bot hoon 🤖"
        });

        return true;
    }

    // SALAM
    if (
        lower === "salam" ||
        lower === "assalamualaikum" ||
        lower === "aoa"
    ) {
        await sock.sendMessage(jid, {
            text: "Wa Alaikum Assalam bhai ❤️🤖"
        });

        return true;
    }

    // PING
    if (lower === ".ping") {
        await sock.sendMessage(jid, {
            text: "🏓 Pong!\nBot bilkul active hai ✅"
        });

        return true;
    }

    // OWNER
    if (lower === ".owner") {
        await sock.sendMessage(jid, {
            text: "👑 Owner: Qadeer"
        });

        return true;
    }

    // MENU
    if (lower === ".menu") {
        await sock.sendMessage(jid, {
            text:
`🤖 *QADEER AI BOT*

━━━━━━━━━━━━━━━━
📌 BASIC
━━━━━━━━━━━━━━━━

• .menu
• .ping
• .owner

━━━━━━━━━━━━━━━━
🕐 TOOLS
━━━━━━━━━━━━━━━━

• .time
• .date

━━━━━━━━━━━━━━━━
🧠 AI
━━━━━━━━━━━━━━━━

• .ai
• .ask

━━━━━━━━━━━━━━━━
🎮 FUN
━━━━━━━━━━━━━━━━

Coming Soon...

━━━━━━━━━━━━━━━━
⚙️ GROUP
━━━━━━━━━━━━━━━━

Coming Soon...

━━━━━━━━━━━━━━━━
❤️ Qadeer AI Bot
━━━━━━━━━━━━━━━━`
        });

        return true;
    }

    // Agar command basic nahi hai
    return false;
}


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    handleBasicCommand
};
