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
// Model selection by task type
// ---------------------------------------------------------------------------
export const MODELS = {
  fast:  'llama-3.1-8b-instant',     // categorization — simple classification
  smart: 'llama-3.3-70b-versatile',  // anomaly explanations, action drafts, chat
};

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
    model      = 'smart',
    maxTokens  = 4096,
    tools      = null,
    messages   = null,
  } = options;

  callCount++;
  const modelName = MODELS[model] || model;
  console.log(`[LLM] API call #${callCount} — model: ${modelName}`);

  const body = {
    model:      modelName,
    max_tokens: maxTokens,
    messages:   messages || [{ role: 'user', content: prompt }],
  };

  if (tools) {
    body.tools       = tools;
    body.tool_choice = 'auto';
  }

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
  const modelName = MODELS[model] || model;

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
  return response.choices?.[0]?.message?.content || '';
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
