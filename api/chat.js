import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    if (detectPII(message)) {
        return res.status(200).json({
            text: '⚠️ Privacy Warning: Please do not share sensitive personal information (such as PAN, Aadhaar, account numbers, OTPs, emails, or phone numbers). Your request has been blocked for safety.'
        });
    }

    if (isOutOfScope(message)) {
        return res.status(200).json({
            text: 'I only answer objective, factual questions about Parag Parikh Mutual Fund schemes (such as expense ratios, exit loads, or statement downloads). This query is outside the scope of this assistant.'
        });
    }

    if (checkPerformance(message)) {
        return res.status(200).json({
            text: 'I do not compute, compare, or display mutual fund performance returns. For official, up-to-date performance figures, benchmarks, and historical returns, please refer to the official PPFAS Monthly Factsheets.',
            groundingMetadata: {
                groundingChunks: [{
                    web: {
                        uri: 'https://ppfas.com/downloads/monthly-factsheets/',
                        title: 'PPFAS Monthly Factsheets Archive'
                    }
                }]
            }
        });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API Key is not configured on the server environment.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `
You are a highly precise and objective Mutual Fund FAQ Assistant specializing in Parag Parikh Financial Advisory Services (PPFAS) Mutual Fund schemes.
You answer specific facts about PPFAS schemes (expense ratio, exit load, minimum SIP, lock-in (ELSS), riskometer, benchmark, and statement downloads).

Strict Instructions:
1. Identify if the query is opinionated, subjective, or asking for investment advice, suggestions to buy/sell (e.g. "Should I buy Flexi Cap?", "Is PPFAS Flexi Cap better than others?", "When to sell PPFAS Liquid?").
2. If it is an advice or recommendation query, you MUST politely refuse to answer. State that you only provide objective facts and do not offer investment advice or recommendations. Include the text: "For more details on PPFAS mutual fund operations and general guidelines, please review the official educational resources." 
3. If the user asks to calculate, compare, or report on mutual fund returns or performance, you must refuse to answer. Direct them to the official PPFAS Monthly Factsheets page at https://ppfas.com/downloads/monthly-factsheets/.
4. Limit your factual answers to a maximum of 3 sentences. Be extremely concise, direct, and factual. Do not make any performance claims, compute returns, or compare returns.
5. Search and grounding MUST only use official public information sources (e.g. amc.ppfas.com, ppfas.com, sebi.gov.in, amfiindia.com). Do NOT refer to third-party blogs, forums, or unofficial sites. You must not describe or reference any application backend screenshots or designs.
6. Every factual answer must contain a clear reference to the official source.
7. If the query is not related to Parag Parikh Mutual Fund schemes or standard mutual fund operations (e.g. general knowledge, math, unrelated topics, or other fund houses), you MUST politely refuse to answer. State that you only answer objective factual queries regarding Parag Parikh Mutual Fund schemes.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: message,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ googleSearch: {} }],
                temperature: 0.1
            }
        });

        const textResponse = response.text || "No response generated.";
        const metadata = response.candidates?.[0]?.groundingMetadata || {};
        
        const d = new Date();
        const day = String(d.getDate()).padStart(2, '0');
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        const formattedDate = `${day} ${month} ${year}`;
        const finalText = textResponse.trim() + `\n\n_Last updated from sources: ${formattedDate}_`;
        
        return res.status(200).json({
            text: finalText,
            groundingMetadata: metadata
        });

    } catch (error) {
        console.error("Gemini API Backend Error:", error);
        return res.status(500).json({ error: error.message || 'An error occurred on the server.' });
    }
}

function detectPII(text) {
    const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/i;
    const aadhaarRegex = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
    const phoneRegex = /\b(?:\+?91[\s-]?)?[6-9](?:[\s-]?\d){9}\b/;
    const accountRegex = /(?:account|acc|folio|bank|ifsc)[\s\W]{0,10}\d{9,18}/i;
    
    const hasOtpKeyword = /otp|one-time password/i.test(text);
    const codeRegex = /\b\d{4,6}\b/;
    const hasOtpCode = hasOtpKeyword && codeRegex.test(text);

    return panRegex.test(text) || 
           aadhaarRegex.test(text) || 
           emailRegex.test(text) || 
           phoneRegex.test(text) || 
           accountRegex.test(text) || 
           hasOtpCode;
}

function checkPerformance(text) {
    const lowercaseQuery = text.toLowerCase();
    const hasTaxReturns = /tax return/i.test(lowercaseQuery);
    const returnsRegex = /\breturn(s)?\b|\bperformance\b|\bcagr\b|\byield(s)?\b|\bgrowth rate(s)?\b|\bannualized\b/i;
    return returnsRegex.test(lowercaseQuery) && !hasTaxReturns;
}

function isOutOfScope(text) {
    const lowercase = text.toLowerCase();
    const greetings = ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening"];
    const cleanText = lowercase.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").trim();
    if (greetings.includes(cleanText)) {
        return false;
    }
    const mutualFundKeywords = [
        "fund", "scheme", "parag", "ppfas", "load", "sip", "expense", "exit", "lock", "cams", "cas", "capital-gains", "statement", "flexi", "large", "elss", "tax saver", "hybrid", "liquid", "arbitrage", "dynamic", "benchmark", "riskometer", "nav", "portfolio", "asset", "amc", "operational", "report", "factsheet", "contact"
    ];
    return !mutualFundKeywords.some(keyword => lowercase.includes(keyword));
}
