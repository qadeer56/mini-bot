// ==========================================
// QADEER AI BOT - WEATHER COMMANDS
// ==========================================

async function handleWeatherCommand(sock, jid, text) {

    const lower = text.toLowerCase().trim();

    if (
        lower === ".weather" ||
        lower.startsWith(".weather ")
    ) {

        const location = text.slice(8).trim();

        if (!location) {

            await sock.sendMessage(jid, {
                text:
`🌤️ WEATHER

Location bhi batao 😄

Example:

.weather Islamabad
.weather Lahore
.weather D.I. Khan
.weather Abbottabad`
            });

            return true;
        }

        const apiKey = process.env.WEATHER_API_KEY;

        if (!apiKey) {

            await sock.sendMessage(jid, {
                text:
`⚠️ Weather API configured nahi hai.

Owner ko WEATHER_API_KEY Railway Variables mein add karni hogi.`
            });

            return true;
        }

        try {

            const url =
                `https://api.openweathermap.org/data/2.5/weather` +
                `?q=${encodeURIComponent(location)}` +
                `&appid=${apiKey}` +
                `&units=metric`;

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {

                await sock.sendMessage(jid, {
                    text:
`❌ Weather nahi mil saka.

📍 Location:
${location}

Location ka naam dobara check karo.`
                });

                return true;
            }

            const city = data.name;
            const country = data.sys?.country || "Unknown";

            const temperature =
                Math.round(data.main.temp);

            const feelsLike =
                Math.round(data.main.feels_like);

            const humidity =
                data.main.humidity;

            const wind =
                data.wind?.speed || 0;

            const condition =
                data.weather?.[0]?.description || "Unknown";

            await sock.sendMessage(jid, {
                text:
`🌤️ WEATHER REPORT

📍 Location:
${city}, ${country}

🌡️ Temperature:
${temperature}°C

🤔 Feels Like:
${feelsLike}°C

☁️ Condition:
${condition}

💧 Humidity:
${humidity}%

💨 Wind:
${wind} m/s

🤖 Qadeer AI Bot`
            });

            return true;

        } catch (error) {

            console.log("Weather Error:", error);

            await sock.sendMessage(jid, {
                text:
`❌ Weather service se connection nahi ho saka.

Thori der baad dobara try karo.`
            });

            return true;
        }
    }

    return false;
}

module.exports = {
    handleWeatherCommand
};
