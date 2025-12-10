'use strict';
const { fetch } = require('undici');

const BASE = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const CHAT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct';
const EMBED_MODEL = 'nomic-embed-text'; // Model chuyên dùng cho Vector
const TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT_MS || '120000', 10);

/**
 * Gửi prompt lên server Ollama để sinh ra kết quả dạng JSON.
 * - Dùng cho các tác vụ AI cần trả về object (phân tích, chọn lựa, trích xuất...)
 * - Có timeout để tránh treo request.
 * - Nếu lỗi HTTP hoặc không parse được JSON sẽ throw lỗi.
 *
 * @param {object} param0 - { prompt, temperature }
 * @returns {object} Kết quả JSON trả về từ AI
 */
async function generateJSON({ prompt, temperature = 0.2 }) {
  // Tạo controller để có thể abort request nếu quá timeout
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);

  // Gửi request lên Ollama, truyền prompt và các option
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

  // Kết quả trả về là chuỗi JSON, cần parse thành object
  try {
    return JSON.parse(data.response);
  } catch {
    throw new Error('OLLAMA_BAD_JSON');
  }
}

/**
 * Tạo vector embedding từ text bằng model embedding của Ollama.
 * - Dùng cho các tác vụ tìm kiếm ngữ nghĩa, lưu vector vào DB.
 * - Gửi text lên endpoint /api/embeddings, nhận về mảng số thực (vector).
 * - Có timeout ngắn để tránh treo request.
 * - Nếu lỗi hoặc không nhận được embedding, trả về null.
 *
 * @param {string} text - Đoạn text cần nhúng thành vector
 * @returns {Array<number>|null} Mảng embedding hoặc null nếu lỗi
 */
async function generateEmbedding(text) {
  if (!text) return null;
  // Tạo controller để có thể abort request nếu quá timeout
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000); // Timeout ngắn hơn cho embedding

  try {
    // Gửi request lên Ollama để lấy embedding
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
        // Nếu lỗi HTTP, log ra và trả về null
        console.error('Ollama Embedding Error:', res.statusText);
        return null;
    }
    
    // Kết quả trả về là object có trường embedding (mảng số thực)
    const data = await res.json();
    return data.embedding; // Mảng float [0.1, -0.2, ...]
  } catch (err) {
    // Nếu lỗi, log ra và trả về null
    console.error('Embed func error:', err.message);
    return null;
  }
}

module.exports = { generateJSON, generateEmbedding };