import Groq from 'groq-sdk';
import 'dotenv/config';

let _groq = null;

function getClient() {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

// ---------------------------------------------------------------------------
// Preferred model lists — tried in order, first available on this account wins
// ---------------------------------------------------------------------------
const PREFERRED = {
  fast: [
    // Fast/small models — for batch categorization
    'openai/gpt-oss-20b',
    'qwen/qwen3.6-27b',
    'allam-2-7b',
    // Standard Groq models (may be available on other accounts)
    'llama-3.1-8b-instant',
    'llama3-8b-8192',
    'gemma2-9b-it',
  ],
  smart: [
    // Best models — for anomaly explanations, action drafts, chat
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'groq/compound',
    'qwen/qwen3.6-27b',
    'openai/gpt-oss-20b',
    // Standard Groq models (may be available on other accounts)
    'llama-3.3-70b-versatile',
    'llama3-70b-8192',
    'mixtral-8x7b-32768',
  ],
};

// Resolved after first model discovery call — cached for the process lifetime
let _resolvedModels = null;

async function resolveModels() {
  if (_resolvedModels) return _resolvedModels;

  try {
    const resp      = await getClient().models.list();
    const available = new Set((resp.data || []).map(m => m.id));
    console.log(`[LLM] Available models: ${[...available].join(', ')}`);

    const fast  = PREFERRED.fast.find(m => available.has(m))  || PREFERRED.fast[0];
    const smart = PREFERRED.smart.find(m => available.has(m)) || PREFERRED.smart[0];

    _resolvedModels = { fast, smart };
    console.log(`[LLM] Selected — fast: "${fast}" | smart: "${smart}"`);
  } catch (e) {
    console.warn('[LLM] Could not list models, using defaults:', e.message);
    _resolvedModels = { fast: PREFERRED.fast[0], smart: PREFERRED.smart[0] };
  }

  return _resolvedModels;
}

// ---------------------------------------------------------------------------
// Per-run call counter
// ---------------------------------------------------------------------------
let callCount = 0;
export function resetCallCount() { callCount = 0; }
export function getCallCount()   { return callCount; }

// ---------------------------------------------------------------------------
// Key validation
// ---------------------------------------------------------------------------
export function hasValidApiKey() {
  const key = process.env.GROQ_API_KEY;
  return !!(key && key.trim() !== '' && key !== 'your_groq_api_key_here' && key.length > 10);
}

// ---------------------------------------------------------------------------
// Main call helper
// ---------------------------------------------------------------------------
export async function callLLM(prompt, options = {}) {
  const {
    model     = 'smart',   // 'fast' | 'smart'
    maxTokens = 4096,
    tools     = null,
    messages  = null,
  } = options;

  const models    = await resolveModels();
  const modelName = models[model] || model;

  callCount++;
  console.log(`[LLM] API call #${callCount} — model: ${modelName}`);

  const body = {
    model:      modelName,
    max_tokens: maxTokens,
    messages:   messages || [{ role: 'user', content: prompt }],
  };
  if (tools) { body.tools = tools; body.tool_choice = 'auto'; }

  try {
    return await getClient().chat.completions.create(body);
  } catch (error) {
    if (error.status === 429) {
      console.error('[LLM] Rate limit (429) — reduce call frequency');
    } else {
      console.error('[LLM] API error:', error.message);
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Streaming call helper (for chat)
// ---------------------------------------------------------------------------
export async function callLLMStream(prompt, options = {}) {
  const { model = 'smart', maxTokens = 4096, messages = null } = options;

  const models    = await resolveModels();
  const modelName = models[model] || model;

  callCount++;
  console.log(`[LLM] API call #${callCount} (stream) — model: ${modelName}`);

  return getClient().chat.completions.create({
    model:      modelName,
    max_tokens: maxTokens,
    messages:   messages || [{ role: 'user', content: prompt }],
    stream:     true,
  });
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------
export function extractText(response) {
  const msg = response.choices?.[0]?.message;
  if (!msg) return '';
  // Some "thinking" models (qwen3, gpt-oss) emit their answer in `content`
  // but only after the chain-of-thought in `reasoning` finishes.
  // If content is empty, fall back to reasoning (truncated to avoid returning raw CoT).
  return msg.content || '';
}

export function extractToolCalls(response) {
  return response.choices?.[0]?.message?.tool_calls || [];
}

// ---------------------------------------------------------------------------
// Safe JSON parsing — strips markdown fences before parsing
// ---------------------------------------------------------------------------
export function safeParseJSON(raw) {
  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('[Parser] Failed to parse LLM response as JSON:', raw.slice(0, 200));
    throw new Error('Invalid JSON from LLM');
  }
}
