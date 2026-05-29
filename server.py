import os
import json
import urllib.request
import urllib.error
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='.')

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
    message = data.get('message')
    if not message:
        return jsonify({'error': 'Message is required'}), 400

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
        "6. Every factual answer must contain a clear reference to the official source."
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
