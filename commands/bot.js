// ==========================================
// QADEER AI BOT - BOT REPLY SYSTEM
// ==========================================

const botReplies = require("../data/botReplies");

// Recently used replies
let recentReplies = [];

// ==========================================
// RANDOM REPLY
// ==========================================

function getRandomReply() {

    if (!botReplies || botReplies.length === 0) {
        return "Bot online hai... lekin meri creativity thori der ke liye offline hai 😭";
    }

    // Recent replies ko avoid karo
    let availableReplies = botReplies.filter(
        reply => !recentReplies.includes(reply)
    );

    // Agar saare replies recently use ho chuke hain
    if (availableReplies.length === 0) {
        recentReplies = [];
        availableReplies = botReplies;
    }

    // Random reply select
    const reply =
        availableReplies[
            Math.floor(Math.random() * availableReplies.length)
        ];

    // Recent list mein add
    recentReplies.push(reply);

    // Last 30 replies remember
    if (recentReplies.length > 30) {
        recentReplies.shift();
    }

    return reply;
}


// ==========================================
// BOT WORD DETECTION
// ==========================================

function isBotMention(text) {

    if (!text) return false;

    const lower = text.toLowerCase().trim();

    return (
        /\bbot\b/i.test(lower) ||
        /\bchatbot\b/i.test(lower) ||
        /\bai bot\b/i.test(lower)
    );
}


// ==========================================
// GET BOT REPLY
// ==========================================

function getBotReply(text) {

    if (!isBotMention(text)) {
        return null;
    }

    return getRandomReply();
}


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    isBotMention,
    getBotReply
};
