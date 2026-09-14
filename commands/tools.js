// ==========================================
// QADEER AI BOT - TOOLS COMMANDS
// ==========================================

const { DateTime } = require("luxon");


// ==========================================
// TOOLS COMMAND HANDLER
// ==========================================

async function handleToolsCommand(sock, jid, text) {

    const lower = text.toLowerCase().trim();

    // Pakistan timezone
    const now = DateTime.now().setZone("Asia/Karachi");


    // ======================================
    // TIME
    // ======================================

    if (lower === ".time") {

        await sock.sendMessage(jid, {
            text:
`🕐 CURRENT TIME

🇵🇰 Pakistan Time:
${now.toFormat("hh:mm:ss a")}

📍 Timezone:
Asia/Karachi`
        });

        return true;
    }


    // ======================================
    // DATE
    // ======================================

    if (lower === ".date") {

        await sock.sendMessage(jid, {
            text:
`📅 TODAY'S DATE

📆 Date:
${now.toFormat("dd MMMM yyyy")}

📌 Day:
${now.toFormat("EEEE")}

🇵🇰 Pakistan`
        });

        return true;
    }


    // ======================================
    // CALENDAR
    // ======================================

    if (lower === ".calendar") {

        await sock.sendMessage(jid, {
            text:
`╔════════════════════╗
       📅 CALENDAR
╚════════════════════╝

📆 Date:
${now.toFormat("dd MMMM yyyy")}

📌 Day:
${now.toFormat("EEEE")}

🕐 Time:
${now.toFormat("hh:mm:ss a")}

🇵🇰 Pakistan Time`
        });

        return true;
    }


    // ======================================
    // YEAR
    // ======================================

    if (lower === ".year") {

        await sock.sendMessage(jid, {
            text:
`📅 CURRENT YEAR

${now.toFormat("yyyy")}

🇵🇰 Pakistan Time`
        });

        return true;
    }


    // ======================================
    // DAY
    // ======================================

    if (lower === ".day") {

        await sock.sendMessage(jid, {
            text:
`📌 TODAY IS

${now.toFormat("EEEE")} 📅

Date: ${now.toFormat("dd MMMM yyyy")}`
        });

        return true;
    }


    // ======================================
    // MONTH
    // ======================================

    if (lower === ".month") {

        await sock.sendMessage(jid, {
            text:
`📅 CURRENT MONTH

${now.toFormat("MMMM")}

Year: ${now.toFormat("yyyy")}`
        });

        return true;
    }


    // ======================================
    // NOTHING MATCHED
    // ======================================

    return false;
}


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    handleToolsCommand
};
