'use strict';
const { fetch } = require('undici');

const BASE = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const CHAT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct';
const EMBED_MODEL = 'nomic-embed-text'; // Model chuyên dùng cho Vector
const TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT_MS || '120000', 10);

async function generateJSON({ prompt, temperature = 0.2 }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);

  const res = await fetch(`${BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CHAT_MODEL,
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

/**
 * [NEW] Tạo Vector Embedding từ text
 */
async function generateEmbedding(text) {
  if (!text) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000); // Timeout ngắn hơn cho embedding

  try {
    const res = await fetch(`${BASE}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: EMBED_MODEL,
        prompt: text
      }),
      signal: ctrl.signal
    });
    
    clearTimeout(timer);
    if (!res.ok) {
        console.error('Ollama Embedding Error:', res.statusText);
        return null;
    }
    
    const data = await res.json();
    return data.embedding; // Mảng float [0.1, -0.2, ...]
  } catch (err) {
    console.error('Embed func error:', err.message);
    return null;
  }
}

module.exports = { generateJSON, generateEmbedding };