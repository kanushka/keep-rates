/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const { onRequest } = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const axios = require("axios");
const logger = require("firebase-functions/logger");
const Mailjet = require('node-mailjet');

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

// Add these constants at the top with other initializations
const MAILJET_API_KEY = '2a3034e24961515abbc18b1a24c86cae';
const MAILJET_SECRET_KEY = '65006d2a022907192f9f93b1fdd730b3';

const mailjet = new Mailjet({
    apiKey: MAILJET_API_KEY,
    apiSecret: MAILJET_SECRET_KEY
});

// Function to fetch USD rate
async function fetchUsdRate() {
    try {
        const response = await axios.get("https://www.combank.lk/rates-tariff#exchange-rates");
        const html = response.data;

        // Updated regex to capture the fifth numeric value in the row
        const regex = /US DOLLARS[\s\S]*?text-align:right">\s*[\d.]+\s*<\/td>[\s\S]*?text-align:right">\s*[\d.]+\s*<\/td>[\s\S]*?text-align:right">\s*[\d.]+\s*<\/td>[\s\S]*?text-align:right">\s*[\d.]+\s*<\/td>[\s\S]*?text-align:right">\s*([\d.]+)\s*</;
        const match = html.match(regex);

        if (match && match[1]) {
            return parseFloat(match[1]); // Return the fifth rate value
        }
        throw new Error("USD rate not found");
    } catch (error) {
        logger.error("Error fetching USD rate:", error.message);
        return null;
    }
}

// Separate function for saving USD rate to database
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

// Update function name and duration
async function getLast14DaysRates() {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    try {
        const snapshot = await db.collection("usdRates")
            .where("timestamp", ">=", fourteenDaysAgo.toISOString())
            .orderBy("timestamp", "desc")
            .get();

        return snapshot.docs.map(doc => doc.data());
    } catch (error) {
        logger.error("Error fetching last 14 days rates:", error.message);
        throw error;
    }
}

// Add new function to send email
async function sendRatesEmail() {
    try {
        const rates = await getLast14DaysRates();

        // Calculate trends and statistics
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

        // Calculate overall statistics
        const latestRate = rates[0].rate;
        const oldestRate = rates[rates.length - 1].rate;
        const overallChange = (latestRate - oldestRate).toFixed(2);
        const overallPercentage = ((overallChange / oldestRate) * 100).toFixed(2);
        const highestRate = Math.max(...rates.map(r => r.rate));
        const lowestRate = Math.min(...rates.map(r => r.rate));

        // Calculate weekly statistics
        const lastWeekRates = rates.slice(0, 7);
        const previousWeekRates = rates.slice(7, 14);
        const lastWeekAvg = (lastWeekRates.reduce((sum, r) => sum + r.rate, 0) / lastWeekRates.length).toFixed(2);
        const previousWeekAvg = (previousWeekRates.reduce((sum, r) => sum + r.rate, 0) / previousWeekRates.length).toFixed(2);
        const weekOverWeekChange = (lastWeekAvg - previousWeekAvg).toFixed(2);
        const weekOverWeekPercentage = ((weekOverWeekChange / previousWeekAvg) * 100).toFixed(2);

        // Determine if it's a good time to convert
        const isHighestInPeriod = latestRate === highestRate;
        const isLowestInPeriod = latestRate === lowestRate;
        const rateAdvice = isHighestInPeriod ?
            "Current rate is the highest in the last 14 days - might want to wait for a better rate" :
            isLowestInPeriod ?
                "Current rate is the lowest in the last 14 days - could be a good time to convert" :
                "Current rate is within the normal range";

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
            
            <h3>Analysis Summary</h3>
            <p>
                Over the last 14 days, the USD/LKR rate has ${overallChange > 0 ? 'increased' : 'decreased'} 
                by ${Math.abs(overallChange)} LKR (${Math.abs(overallPercentage)}%).
                ${Math.abs(overallPercentage) > 1
                ? `This represents a significant ${overallChange > 0 ? 'upward' : 'downward'} trend.`
                : 'The rate has remained relatively stable.'
            }
            </p>
            
        `;

        const request = await mailjet.post("send", { version: 'v3.1' }).request({
            Messages: [{
                From: {
                    Email: "kanushkanet@gmail.com",
                    Name: "KeepRates"
                },
                To: [
                    {
                        Email: "kanushkanet@gmail.com",
                        Name: "Kanushka"
                    },
                    {
                        Email: "tharukavishwajiths@gmail.com",
                        Name: "Tharuka"
                    },
                    {
                        Email: "thisa030@gmail.com",
                        Name: "Thisara"
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

// Modify saveUsdRate function
exports.saveUsdRate = onSchedule(
    { schedule: "0 8 * * *", timeZone: "Asia/Colombo" },
    async (event) => {
        const usdRate = await fetchUsdRate();
        if (!usdRate) {
            logger.warn("No USD rate fetched; skipping save.");
            return;
        }

        try {
            await saveUsdRateToDb(usdRate);
            sendRatesEmail();
        } catch (error) {
            logger.error("Error in scheduled function:", error.message);
        }
    }
);

// Trigger save usd rate
exports.triggerSaveUsdRate = onRequest(async (req, res) => {
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

// Trigger send rates email
exports.triggerSendRatesEmail = onRequest(async (req, res) => {
    try {
        await sendRatesEmail();
        return res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
        logger.error("Error in send rates email:", error.message);
        return res.status(500).json({ error: error.message });
    }
});
