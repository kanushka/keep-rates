const createEmailTemplate = ({
    latestRate,
    rateAdvice,
    overallChange,
    overallPercentage,
    highestRate,
    lowestRate,
    rateVolatility,
    rates,
    trends,
}) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Poppins', Arial, sans-serif; color: #111827">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
            <!-- Header Section -->
            <tr>
                <td style="padding: 20px; background: #ffffff;">
                    <h2 style="color: #333; margin-bottom: 20px; font-family: 'Poppins', Arial, sans-serif; font-weight: 600;">USD Exchange Rates Analysis - Last 14 Days</h2>
                    
                    <!-- Current Rate Box -->
                    <table width="100%" style="background: #f8f9fa; border-radius: 4px; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 15px; border-radius: 6px;">
                                <h3 style="color: #0066cc; margin: 0 0 10px 0; font-family: 'Poppins', Arial, sans-serif; font-weight: 500;">Current Rate</h3>
                                <div style="font-size: 24px; font-weight: 600; color: #333; font-family: 'Poppins', Arial, sans-serif;">${latestRate} LKR</div>
                                <div style="color: #666; margin-top: 5px; font-family: 'Poppins', Arial, sans-serif;">${rateAdvice}</div>
                            </td>
                        </tr>
                    </table>

                    <!-- Key Stats -->
                    <table width="100%" cellspacing="5" style="margin-bottom: 20px;">
                        <tr>
                            <td width="25%" style="background: #ffffff; border: 1px solid #dee2e6; padding: 10px; text-align: center; border-radius: 6px;">
                                <div style="color: #666; font-size: 14px; margin-bottom:4px;">Overall Change</div>
                                <div style="color: ${overallChange > 0 ? '#28a745' : '#dc3545'}; font-weight: bold;">
                                    ${overallChange} LKR (${overallPercentage}%)
                                </div>
                            </td>
                            <td width="25%" style="background: #ffffff; border: 1px solid #dee2e6; padding: 10px; text-align: center; border-radius: 6px;">
                                <div style="color: #666; font-size: 14px; margin-bottom:4px;">Highest Rate</div>
                                <div style="font-weight: bold;">${highestRate} LKR</div>
                            </td>
                            <td width="25%" style="background: #ffffff; border: 1px solid #dee2e6; padding: 10px; text-align: center; border-radius: 6px;">
                                <div style="color: #666; font-size: 14px; margin-bottom:4px;">Lowest Rate</div>
                                <div style="font-weight: bold;">${lowestRate} LKR</div>
                            </td>
                            <td width="25%" style="background: #ffffff; border: 1px solid #dee2e6; padding: 10px; text-align: center; border-radius: 6px;">
                                <div style="color: #666; font-size: 14px; margin-bottom:4px;">Rate Volatility</div>
                                <div style="font-weight: bold;">${rateVolatility} LKR</div>
                            </td>
                        </tr>
                    </table>

                    <!-- Daily Rates Table -->
                    <table width="100%" style="border-collapse: collapse; margin-bottom: 20px;">
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 8px; border: 1px solid #dee2e6;">Date</th>
                            <th style="padding: 8px; border: 1px solid #dee2e6;">Time</th>
                            <th style="padding: 8px; border: 1px solid #dee2e6;">Rate (LKR)</th>
                            <th style="padding: 8px; border: 1px solid #dee2e6;">Daily Change</th>
                            <th style="padding: 8px; border: 1px solid #dee2e6;">% Change</th>
                            <th style="padding: 8px; border: 1px solid #dee2e6;">Trend</th>
                        </tr>
                        ${rates.map((rate, index) => `
                            <tr${index === 7 ? ' style="border-top: 2px solid #000;"' : ''}>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">${rate.date}</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">${rate.time}</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">${rate.rate}</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6; color: ${trends[index]?.difference > 0 ? '#28a745' :
            trends[index]?.difference < 0 ? '#dc3545' : '#000000'
        };">${trends[index]?.difference || '-'}</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6; color: ${trends[index]?.difference > 0 ? '#28a745' :
            trends[index]?.difference < 0 ? '#dc3545' : '#000000'
        };">${trends[index]?.percentageChange || '-'}%</td>
                                <td style="padding: 8px; border: 1px solid #dee2e6;">${trends[index]?.trend || '-'}</td>
                            </tr>
                        `).join('')}
                    </table>

                    <!-- Footer -->
                    <div style="margin-top: 20px;">
                        <div style="margin-bottom: 10px;">
                            <p style="margin-top: 20px; margin-bottom: 4px;">
                                For current exchange rates, you can also visit the 
                                <a href="https://www.combank.lk/rates-tariff#exchange-rates" target="_blank">
                                    Commercial Bank website
                                </a>
                            </p>
                            <p style="margin-top: 20px; margin-bottom: 20px;">
                                Visit <a href="https://keeprates-770e5.web.app/" target="_blank">
                                    KeepRates
                                </a> for more detailed analysis.
                            </p>
                        </div>
                    </div>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

const formatPercentage = (value) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

module.exports = {
    createEmailTemplate,
    formatCurrency,
    formatPercentage
}; 
