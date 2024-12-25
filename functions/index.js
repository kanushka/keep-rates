const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const axios = require("axios");
const logger = require("firebase-functions/logger");
const Mailjet = require('node-mailjet');
require('dotenv').config();

// initialize firebase admin sdk
initializeApp();
const db = getFirestore();

// initialize mailjet
// firebase functions:config:set mailjet.api_key="your_api_key" mailjet.secret_key="your_secret_key"
const mailjet = new Mailjet({
    apiKey: process.env.MAILJET_API_KEY || process.env.FIREBASE_CONFIG.mailjet.api_key,
    apiSecret: process.env.MAILJET_SECRET_KEY || process.env.FIREBASE_CONFIG.mailjet.secret_key
});

// fetch usd rate
async function fetchUsdRate() {
    try {
        const response = await axios.get("https://www.combank.lk/rates-tariff#exchange-rates");
        const html = response.data;

        // updated regex to capture the fifth numeric value in the row
        const regex = /US DOLLARS[\s\S]*?text-align:right">\s*[\d.]+\s*<\/td>[\s\S]*?text-align:right">\s*[\d.]+\s*<\/td>[\s\S]*?text-align:right">\s*[\d.]+\s*<\/td>[\s\S]*?text-align:right">\s*[\d.]+\s*<\/td>[\s\S]*?text-align:right">\s*([\d.]+)\s*</;
        const match = html.match(regex);

        if (match && match[1]) {
            return parseFloat(match[1]); // return the fifth rate value
        }
        throw new Error("USD rate not found");
    } catch (error) {
        logger.error("Error fetching USD rate:", error.message);
        return null;
    }
}

// save usd rate to database
async function saveUsdRateToDb(usdRate) {
    const now = new Date();
    const timestamp = now.toISOString();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0];

    const rateDoc = {
        rate: usdRate,
        date: date,
        time: time,
        timestamp: timestamp,
    };

    try {
        await db.collection("usdRates").add(rateDoc);
        logger.info("USD rate saved successfully:", rateDoc);
        return { success: true, data: rateDoc };
    } catch (error) {
        logger.error("Error saving USD rate:", error.message);
        throw error;
    }
}

// get last 14 days rates
async function getLast14DaysRates() {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    try {
        const snapshot = await db.collection("usdRates")
            .where("timestamp", ">=", fourteenDaysAgo.toISOString())
            .orderBy("timestamp", "desc")
            .get();

        // group rates by date and get max rate for each day
        const ratesByDate = snapshot.docs.reduce((acc, doc) => {
            const data = doc.data();
            if (!acc[data.date] || acc[data.date].rate < data.rate) {
                acc[data.date] = data;
            }
            return acc;
        }, {});

        // convert to array and sort by date descending
        return Object.values(ratesByDate).sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );
    } catch (error) {
        logger.error("Error fetching last 14 days rates:", error.message);
        throw error;
    }
}

// get all rates for a specific date
async function getDailyRates(date) {
    try {
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const snapshot = await db.collection("usdRates")
            .where("timestamp", ">=", startOfDay.toISOString())
            .where("timestamp", "<", endOfDay.toISOString())
            .orderBy("timestamp", "desc")
            .get();

        return snapshot.docs.map(doc => doc.data());
    } catch (error) {
        logger.error("Error fetching daily rates:", error.message);
        throw error;
    }
}

// send rates email
async function sendRatesEmail() {
    try {
        const rates = await getLast14DaysRates();

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const yesterdayRates = await getDailyRates(yesterdayStr);

        // calculate trends and statistics
        const trends = rates.reduce((acc, rate, index) => {
            if (index === rates.length - 1) return acc;

            const currentRate = rate.rate;
            const nextRate = rates[index + 1].rate;
            const difference = currentRate - nextRate;
            const percentageChange = ((difference) / nextRate * 100).toFixed(2);

            acc.push({
                date: rate.date,
                difference: difference.toFixed(2),
                percentageChange: percentageChange,
                trend: difference > 0 ? '🟢' : difference < 0 ? '🔴' : '⚪'
            });

            return acc;
        }, []);

        // calculate overall statistics
        const latestRate = rates[0].rate;
        const oldestRate = rates[rates.length - 1].rate;
        const overallChange = (latestRate - oldestRate).toFixed(2);
        const overallPercentage = ((overallChange / oldestRate) * 100).toFixed(2);
        const highestRate = Math.max(...rates.map(r => r.rate));
        const lowestRate = Math.min(...rates.map(r => r.rate));

        // calculate weekly statistics
        const lastWeekRates = rates.slice(0, 7);
        const previousWeekRates = rates.slice(7, 14);
        const lastWeekAvg = (lastWeekRates.reduce((sum, r) => sum + r.rate, 0) / lastWeekRates.length).toFixed(2);
        const previousWeekAvg = (previousWeekRates.reduce((sum, r) => sum + r.rate, 0) / previousWeekRates.length).toFixed(2);
        const weekOverWeekChange = (lastWeekAvg - previousWeekAvg).toFixed(2);
        const weekOverWeekPercentage = ((weekOverWeekChange / previousWeekAvg) * 100).toFixed(2);

        // determine if it's a good time to convert
        const isHighestInPeriod = latestRate === highestRate;
        const isLowestInPeriod = latestRate === lowestRate;
        const rateAdvice = isHighestInPeriod ?
            "Current rate is the highest in the last 14 days - might want to wait for a better rate" :
            isLowestInPeriod ?
                "Current rate is the lowest in the last 14 days - could be a good time to convert" :
                "Current rate is within the normal range";

        // add daily rate variations table to HTML
        const dailyRatesTable = `
            <h3>Yesterday's Rate Variations</h3>
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <tr style="background-color: #f2f2f2;">
                    <th style="padding: 8px;">Time</th>
                    <th style="padding: 8px;">Rate (LKR)</th>
                    <th style="padding: 8px;">Difference</th>
                </tr>
                ${yesterdayRates.map((rate, index) => {
            const diff = index < yesterdayRates.length - 1
                ? (rate.rate - yesterdayRates[index + 1].rate).toFixed(2)
                : '-';
            return `
                        <tr>
                            <td style="padding: 8px;">${rate.time}</td>
                            <td style="padding: 8px;">${rate.rate}</td>
                            <td style="padding: 8px; color: ${diff > 0 ? '#008000' : diff < 0 ? '#FF0000' : '#000000'
                };">${diff}</td>
                        </tr>
                    `;
        }).join('')}
            </table>
        `;

        // add link to ComBank rates page
        const ratesLink = `
            <p style="margin-top: 20px; margin-bottom: 20px;">
                For current exchange rates, you can also visit the Commercial Bank website:
                <a href="https://www.combank.lk/rates-tariff#exchange-rates" target="_blank">
                    Check Latest Exchange Rates
                </a>
            </p>
        `;

        const htmlContent = `
            <h2>USD Exchange Rates Analysis - Last 14 Days</h2>
            
            <h3>Current Status</h3>
            <p>Latest Rate: ${latestRate} LKR</p>
            <p>${rateAdvice}</p>
            
            <h3>14-Day Overview</h3>
            <ul>
                <li>Overall Change: ${overallChange} LKR (${overallPercentage}%)</li>
                <li>Highest Rate: ${highestRate} LKR</li>
                <li>Lowest Rate: ${lowestRate} LKR</li>
                <li>Rate Volatility: ${(highestRate - lowestRate).toFixed(2)} LKR</li>
            </ul>

            <h3>Week-over-Week Analysis</h3>
            <ul>
                <li>Last Week Average: ${lastWeekAvg} LKR</li>
                <li>Previous Week Average: ${previousWeekAvg} LKR</li>
                <li>Week-over-Week Change: ${weekOverWeekChange} LKR (${weekOverWeekPercentage}%)</li>
            </ul>
            
            <h3>Daily Rates and Trends</h3>
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <tr style="background-color: #f2f2f2;">
                    <th style="padding: 8px;">Date</th>
                    <th style="padding: 8px;">Time</th>
                    <th style="padding: 8px;">Rate (LKR)</th>
                    <th style="padding: 8px;">Daily Change</th>
                    <th style="padding: 8px;">% Change</th>
                    <th style="padding: 8px;">Trend</th>
                </tr>
                ${rates.map((rate, index) => `
                    <tr${index === 7 ? ' style="border-top: 2px solid #000;"' : ''}>
                        <td style="padding: 8px;">${rate.date}</td>
                        <td style="padding: 8px;">${rate.time}</td>
                        <td style="padding: 8px;">${rate.rate}</td>
                        <td style="padding: 8px; color: ${trends[index]?.difference > 0 ? '#008000' :
                trends[index]?.difference < 0 ? '#FF0000' :
                    '#000000'
            };">${trends[index]?.difference || '-'}</td>
                        <td style="padding: 8px; color: ${trends[index]?.difference > 0 ? '#008000' :
                trends[index]?.difference < 0 ? '#FF0000' :
                    '#000000'
            };">${trends[index]?.percentageChange || '-'}%</td>
                        <td style="padding: 8px;">${trends[index]?.trend || '-'}</td>
                    </tr>
                `).join('')}
            </table>
            
            ${dailyRatesTable}
            ${ratesLink}
        `;

        const request = await mailjet.post("send", { version: 'v3.1' }).request({
            Messages: [{
                From: {
                    Email: "kanushkanet@gmail.com",
                    Name: "KeepRates"
                },
                To: [
                    // {
                    //     Email: "kanushkanet@gmail.com",
                    //     Name: "Kanushka"
                    // },
                    // {
                    //     Email: "tharukavishwajiths@gmail.com",
                    //     Name: "Tharuka"
                    // },
                    // {
                    //     Email: "thisa030@gmail.com",
                    //     Name: "Thisara"
                    // },
                    {
                        Email: "kanushka@mailinator.com",
                        Name: "Kanushka"
                    }
                ],
                Subject: `USD Rate Update: ${latestRate} LKR ${trends[0]?.trend || ''}`,
                HTMLPart: htmlContent
            }]
        });
        logger.info("Email sent successfully");
        return request;
    } catch (error) {
        logger.error("Error sending email:", error.message);
        throw error;
    }
}

// schedule to save usd rate and send email
exports.scheduleUsdRateUpdate = onSchedule(
    { schedule: "0 8 * * *", timeZone: "Asia/Colombo" },
    async (event) => {
        const usdRate = await fetchUsdRate();
        if (!usdRate) {
            logger.warn("No USD rate fetched; skipping save.");
            return;
        }

        try {
            await saveUsdRateToDb(usdRate);

            // get yesterday's date
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            // get yesterday's rates
            const yesterdayRates = await getDailyRates(yesterdayStr);
            const yesterdayMaxRate = Math.max(...yesterdayRates.map(r => r.rate));

            // only send email if today's rate is different from yesterday's max rate
            if (usdRate !== yesterdayMaxRate) {
                await sendRatesEmail();
                logger.info("Email sent due to rate change");
            } else {
                logger.info("No rate change detected, skipping email");
            }
        } catch (error) {
            logger.error("Error in scheduled function:", error.message);
        }
    }
);

// post request to save usd rate
exports.saveUsdRate = onRequest(async (req, res) => {
    try {
        const usdRate = await fetchUsdRate();
        if (!usdRate) {
            return res.status(400).json({ error: "Failed to fetch USD rate" });
        }

        const result = await saveUsdRateToDb(usdRate);
        return res.status(200).json(result);
    } catch (error) {
        logger.error("Error in manual fetch:", error.message);
        return res.status(500).json({ error: error.message });
    }
});

// post request to send rates emails
exports.sendRatesEmailManually = onRequest(async (req, res) => {
    try {
        await sendRatesEmail();
        return res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
        logger.error("Error in send rates email:", error.message);
        return res.status(500).json({ error: error.message });
    }
});
