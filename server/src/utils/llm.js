import Groq from 'groq-sdk';

let _groq = null;

function getClient() {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

// ---------------------------------------------------------------------------
// Preferred candidate lists — tried in order, first that actually works wins
// Note: openai/gpt-oss-20b and openai/gpt-oss-120b are verified active models on this key
const CANDIDATES = {
  fast: [
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
  ],
  smart: [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
  ],
};

// Resolved after first probe call — cached for the process lifetime
let _resolvedModels = null;

// Probe a model with a minimal real call to confirm it's actually usable
async function probeModel(modelId) {
  try {
    await getClient().chat.completions.create({
      model:      modelId,
      max_tokens: 30,
      messages:   [{ role: 'user', content: 'hi' }],
    });
    return true;
  } catch (err) {
    const blocked = err.status === 403 || err.status === 404 || err.status === 400;
    if (blocked) {
      console.log(`[LLM] Model "${modelId}" unavailable (${err.status}) — skipping`);
    }
    return !blocked; // retry-able errors (429 etc.) = treat as available
  }
}

async function resolveModels() {
  if (_resolvedModels) return _resolvedModels;

  console.log('[LLM] Probing available models...');

  let fast  = null;
  let smart = null;

  // Find best working fast model
  for (const id of CANDIDATES.fast) {
    if (await probeModel(id)) { fast = id; break; }
  }

  // Find best working smart model (may be same as fast if options are limited)
  for (const id of CANDIDATES.smart) {
    if (await probeModel(id)) { smart = id; break; }
  }

  fast  = fast  || CANDIDATES.fast[0];
  smart = smart || CANDIDATES.smart[0];

  _resolvedModels = { fast, smart };
  console.log(`[LLM] Using — fast: "${fast}" | smart: "${smart}"`);
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
    model     = 'smart',
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
      console.error('[LLM] Rate limit (429)');
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
