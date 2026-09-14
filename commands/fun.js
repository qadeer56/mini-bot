// ==========================================
// QADEER AI BOT - FUN COMMANDS
// ==========================================

const memes = require("../data/memes");
const jokes = require("../data/jokes");
const quotes = require("../data/quotes");
const poetry = require("../data/poetry");


// ==========================================
// RANDOM ITEM FUNCTION
// ==========================================

function randomItem(array) {

    if (!array || array.length === 0) {
        return "Data abhi available nahi hai 😭";
    }

    return array[
        Math.floor(Math.random() * array.length)
    ];
}


// ==========================================
// FUN COMMAND HANDLER
// ==========================================

async function handleFunCommand(sock, jid, text) {

    const lower = text.toLowerCase().trim();


    // ======================================
    // MEME
    // ======================================

    if (
        lower === ".meme" ||
        lower === ".memes"
    ) {

        await sock.sendMessage(jid, {
            text:
`😂 MEME OF THE MOMENT

${randomItem(memes)}`
        });

        return true;
    }


    // ======================================
    // JOKE
    // ======================================

    if (
        lower === ".joke" ||
        lower === ".jokes"
    ) {

        await sock.sendMessage(jid, {
            text:
`😂 JOKE TIME

${randomItem(jokes)}`
        });

        return true;
    }


    // ======================================
    // QUOTE
    // ======================================

    if (
        lower === ".quote" ||
        lower === ".quotes"
    ) {

        await sock.sendMessage(jid, {
            text:
`💭 QUOTE

${randomItem(quotes)}`
        });

        return true;
    }


    // ======================================
    // POETRY
    // ======================================

    if (
        lower === ".poetry" ||
        lower === ".shayari" ||
        lower === ".shairi"
    ) {

        await sock.sendMessage(jid, {
            text:
`🌙 SHAYARI

${randomItem(poetry)}`
        });

        return true;
    }


    // ======================================
    // FUN MENU
    // ======================================

    if (lower === ".fun") {

        await sock.sendMessage(jid, {
            text:
`🎭 FUN ZONE

😂 .meme
🤣 .joke
💭 .quote
🌙 .shayari

Random content milega har command par.

🤖 Qadeer AI Bot`
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
    handleFunCommand
};
