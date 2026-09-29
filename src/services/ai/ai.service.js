const config = require('../../config/bot.config');

const chatSessions = new Map();
const MAX_SESSION_MESSAGES = 10;
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 menit

const DEFAULT_SYSTEM_PROMPT = `Kamu adalah ALBEDO, asisten AI WhatsApp pintar, sopan, dan berpengetahuan luas. Jawab dalam Bahasa Indonesia secara ringkas, jelas, dan akurat. Hindari jawaban bertele-tele kecuali diminta penjelasan rinci.`;

function getSession(chatId) {
  const session = chatSessions.get(chatId);
  if (!session) return [];
  if (Date.now() - session.updatedAt > SESSION_TTL_MS) {
    chatSessions.delete(chatId);
    return [];
  }
  return session.messages;
}

function updateSession(chatId, messages) {
  const trimmed = messages.slice(-MAX_SESSION_MESSAGES);
  chatSessions.set(chatId, {
    messages: trimmed,
    updatedAt: Date.now(),
  });
}

function clearSession(chatId) {
  chatSessions.delete(chatId);
}

async function requestApmix(messages, { model, maxTokens = 1024, temperature = 0.7 } = {}) {
  const baseUrl = config.ai?.baseUrl || 'https://api.apmix.ai/v1';
  const apiKey = config.ai?.apiKey || '';
  const selectedModel = model || config.ai?.model || 'deepseek-v4-flash-free';

  if (!apiKey) {
    throw new Error('APMIX API Key belum dikonfigurasi.');
  }

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    let errBody = {};
    try {
      errBody = await response.json();
    } catch {}

    const status = response.status;
    const errCode = errBody?.error?.code || errBody?.error?.type || '';
    const errMsg = errBody?.error?.message || response.statusText;

    if (status === 429) {
      throw new Error('Limit kuota AI tercapai atau sedang padat. Silakan tunggu beberapa detik.');
    }
    if (status === 401) {
      throw new Error('Autentikasi APMIX AI gagal (API key invalid/expired).');
    }
    if (status >= 500) {
      throw new Error('Layanan AI sedang gangguan sementara (Upstream error). Coba sesaat lagi.');
    }

    throw new Error(`AI API error (${status}): ${errMsg || errCode || 'Gagal memproses'}`);
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error('AI tidak memberikan jawaban.');
  }

  return reply;
}

/**
 * Single-turn reasoning / Q&A (.ai)
 */
async function askAi(prompt, { systemPrompt = DEFAULT_SYSTEM_PROMPT, model, maxTokens } = {}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: String(prompt).trim() },
  ];
  return requestApmix(messages, { model, maxTokens });
}

/**
 * Multi-turn conversational chat with memory (.chat)
 */
async function chatAi(chatId, userMessage, { systemPrompt = DEFAULT_SYSTEM_PROMPT, model, maxTokens } = {}) {
  const text = String(userMessage).trim();
  if (!text) throw new Error('Pesan tidak boleh kosong.');

  if (text.toLowerCase() === 'reset' || text.toLowerCase() === 'clear') {
    clearSession(chatId);
    return '🔄 Riwayat percakapan AI telah direset.';
  }

  const history = getSession(chatId);
  const currentMessages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: text },
  ];

  const reply = await requestApmix(currentMessages, { model, maxTokens });

  // Simpan ke sesi tanpa system prompt
  const updatedHistory = [...history, { role: 'user', content: text }, { role: 'assistant', content: reply }];
  updateSession(chatId, updatedHistory);

  return reply;
}

module.exports = {
  DEFAULT_SYSTEM_PROMPT,
  askAi,
  chatAi,
  clearSession,
  getSession,
};
