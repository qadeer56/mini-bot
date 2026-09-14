// ==========================================
// QADEER AI BOT - TOOLS COMMANDS
// File: commands/tools.js
// ==========================================

const { DateTime } = require("luxon");


// ==========================================
// TOOLS COMMAND HANDLER
// ==========================================

async function handleToolsCommand(sock, jid, text) {

    const lower = text.toLowerCase().trim();

    // ==========================================
    // TIME
    // ==========================================

    if (lower === ".time") {

        const now = DateTime.now()
            .setZone("Asia/Karachi");

        const time = now.toFormat("hh:mm:ss a");

        await sock.sendMessage(jid, {
            text:
`🕐 *PAKISTAN TIME*

Time: ${time}

🇵🇰 Time Zone: Pakistan Standard Time`
        });

        return true;
    }


    // ==========================================
    // DATE
    // ==========================================

    if (lower === ".date") {

        const now = DateTime.now()
            .setZone("Asia/Karachi");

        const date = now.toFormat("dd MMMM yyyy");
        const day = now.toFormat("EEEE");

        await sock.sendMessage(jid, {
            text:
`📅 *TODAY*

Date: ${date}
Day: ${day}

🇵🇰 Pakistan`
        });

        return true;
    }


    // ==========================================
    // CALENDAR
    // ==========================================

    if (lower === ".calendar") {

        const now = DateTime.now()
            .setZone("Asia/Karachi");

        const month = now.toFormat("MMMM");
        const year = now.toFormat("yyyy");

        await sock.sendMessage(jid, {
            text:
`📅 *CALENDAR*

Month: ${month}
Year: ${year}

Today:
${now.toFormat("EEEE, dd MMMM yyyy")}

🇵🇰 Pakistan`
        });

        return true;
    }


    // ==========================================
    // UNKNOWN TOOL COMMAND
    // ==========================================

    return false;
}


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    handleToolsCommand
};
