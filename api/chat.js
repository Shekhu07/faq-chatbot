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
        
        return res.status(200).json({
            text: textResponse,
            groundingMetadata: metadata
        });

    } catch (error) {
        console.error("Gemini API Backend Error:", error);
        return res.status(500).json({ error: error.message || 'An error occurred on the server.' });
    }
}
