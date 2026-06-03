import os
import json
import urllib.request
import urllib.error
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='.')

import re

def detect_pii(text):
    pan_regex = re.compile(r'[A-Z]{5}[0-9]{4}[A-Z]{1}', re.IGNORECASE)
    aadhaar_regex = re.compile(r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b')
    email_regex = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')
    phone_regex = re.compile(r'\b(?:\+?91[\s-]?)?[6-9](?:[\s-]?\d){9}\b')
    account_regex = re.compile(r'\b\d{9,18}\b')
    
    has_otp_keyword = bool(re.search(r'otp|one-time password', text, re.IGNORECASE))
    has_otp_code = False
    if has_otp_keyword:
        has_otp_code = bool(re.search(r'\b\d{4,6}\b', text))
        
    return bool(
        pan_regex.search(text) or
        aadhaar_regex.search(text) or
        email_regex.search(text) or
        phone_regex.search(text) or
        account_regex.search(text) or
        has_otp_code
    )

def check_performance(text):
    lowercase_query = text.lower()
    has_tax_returns = "tax return" in lowercase_query
    returns_regex = re.compile(r'\breturn(s)?\b|\bperformance\b|\bcagr\b|\byield(s)?\b|\bgrowth rate(s)?\b|\bannualized\b|\binterest\b', re.IGNORECASE)
    return bool(returns_regex.search(lowercase_query) and not has_tax_returns)

def is_out_of_scope(text):
    lowercase = text.lower()
    greetings = ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening"]
    clean_text = re.sub(r'[.,\/#!$%\^&\*;:{}=\-_`~()?]', '', lowercase).strip()
    if clean_text in greetings:
        return False
        
    mutual_fund_keywords = [
        "fund", "scheme", "parag", "ppfas", "load", "sip", "expense", "exit", "lock", "cams", "cas", "capital-gains", "statement", "flexi", "large", "elss", "tax saver", "hybrid", "liquid", "arbitrage", "dynamic", "benchmark", "riskometer", "nav", "portfolio", "asset", "amc", "operational", "report", "factsheet", "contact"
    ]
    return not any(kw in lowercase for kw in mutual_fund_keywords)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/status')
def status():
    return jsonify({
        'keyConfigured': bool(os.environ.get('GEMINI_API_KEY'))
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json or {}
    message = data.get('message', '')
    if not message:
        return jsonify({'error': 'Message is required'}), 400

    if detect_pii(message):
        return jsonify({
            'text': '⚠️ Privacy Warning: Please do not share sensitive personal information (such as PAN, Aadhaar, account numbers, OTPs, emails, or phone numbers). Your request has been blocked for safety.'
        })

    if is_out_of_scope(message):
        return jsonify({
            'text': 'I only answer objective, factual questions about Parag Parikh Mutual Fund schemes (such as expense ratios, exit loads, or statement downloads). This query is outside the scope of this assistant.'
        })

    if check_performance(message):
        return jsonify({
            'text': 'I do not compute, compare, or display mutual fund performance returns. For official, up-to-date performance figures, benchmarks, and historical returns, please refer to the official PPFAS Monthly Factsheets.',
            'groundingMetadata': {
                'groundingChunks': [{
                    'web': {
                        'uri': 'https://ppfas.com/downloads/monthly-factsheets/',
                        'title': 'PPFAS Monthly Factsheets Archive'
                    }
                }]
            }
        })

    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return jsonify({'error': 'Gemini API Key is not configured in server environment variables.'}), 500

    system_instruction = (
        "You are a highly precise and objective Mutual Fund FAQ Assistant specializing in Parag Parikh Financial Advisory Services (PPFAS) Mutual Fund schemes.\n"
        "You answer specific facts about PPFAS schemes (expense ratio, exit load, minimum SIP, lock-in (ELSS), riskometer, benchmark, and statement downloads).\n\n"
        "Strict Instructions:\n"
        "1. Identify if the query is opinionated, subjective, or asking for investment advice, suggestions to buy/sell (e.g. \"Should I buy Flexi Cap?\", \"Is PPFAS Flexi Cap better than others?\", \"When to sell PPFAS Liquid?\").\n"
        "2. If it is an advice or recommendation query, you MUST politely refuse to answer. State that you only provide objective facts and do not offer investment advice or recommendations. Include the text: \"For more details on PPFAS mutual fund operations and general guidelines, please review the official educational resources.\"\n"
        "3. If the user asks to calculate, compare, or report on mutual fund returns or performance, you must refuse to answer. Direct them to the official PPFAS Monthly Factsheets page at https://ppfas.com/downloads/monthly-factsheets/.\n"
        "4. Limit your factual answers to a maximum of 3 sentences. Be extremely concise, direct, and factual. Do not make any performance claims, compute returns, or compare returns.\n"
        "5. Search and grounding MUST only use official public information sources (e.g. amc.ppfas.com, ppfas.com, sebi.gov.in, amfiindia.com). Do NOT refer to third-party blogs, forums, or unofficial sites. You must not describe or reference any application backend screenshots or designs.\n"
        "6. Every factual answer must contain a clear reference to the official source.\n"
        "7. If the query is not related to Parag Parikh Mutual Fund schemes or standard mutual fund operations (e.g. general knowledge, math, unrelated topics, or other fund houses), you MUST politely refuse to answer. State that you only answer objective factual queries regarding Parag Parikh Mutual Fund schemes."
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": message}]}],
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "tools": [{"googleSearch": {}}],
        "generationConfig": {"temperature": 0.1}
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            
            candidates = res_data.get('candidates', [])
            candidate = candidates[0] if candidates else {}
            content = candidate.get('content', {})
            parts = content.get('parts', [])
            text_response = parts[0].get('text', 'No response generated.') if parts else 'No response generated.'
            metadata = candidate.get('groundingMetadata', {})
            
            return jsonify({
                'text': text_response,
                'groundingMetadata': metadata
            })
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        try:
            err_json = json.loads(err_msg)
            message = err_json.get('error', {}).get('message', 'Gemini API Error')
        except Exception:
            message = err_msg
        return jsonify({'error': f"Gemini API Error: {message}"}), e.code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"Starting server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
