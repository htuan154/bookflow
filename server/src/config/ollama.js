'use strict';
const { fetch } = require('undici');

const BASE = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b-instruct';
const TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT_MS || '120000', 10);

async function generateJSON({ prompt, temperature = 0.2 }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);

  const res = await fetch(`${BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: { temperature },
      format: 'json'
    }),
    signal: ctrl.signal
  }).catch(e => { throw new Error('OLLAMA_REQUEST_FAILED: ' + e.message); });

  clearTimeout(timer);
  if (!res.ok) throw new Error(`OLLAMA_HTTP_${res.status}`);
  const data = await res.json();

  try {
    return JSON.parse(data.response);
  } catch {
    throw new Error('OLLAMA_BAD_JSON');
  }
}

module.exports = { generateJSON };
