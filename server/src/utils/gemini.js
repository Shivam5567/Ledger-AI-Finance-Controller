import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let geminiCallCount = 0;

export function resetCallCount() {
  geminiCallCount = 0;
}

export function getCallCount() {
  return geminiCallCount;
}

// ---------------------------------------------------------------------------
// Key validation
// Accepts Google AI Studio keys (AIzaSy...) and other non-placeholder keys.
// The only things we reject are empty / the literal placeholder string.
// ---------------------------------------------------------------------------
export function hasValidApiKey() {
  const key = process.env.GEMINI_API_KEY;
  return !!(
    key &&
    key.trim() !== '' &&
    key !== 'your_gemini_api_key_here' &&
    key.length > 20
  );
}

function getGenAI() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  return genAI;
}

// Model fallback chain — tried in order on 404 (model not found for key).
// gemini-3.6-flash is first because it is the model this project's key has access to.
// Standard Google AI Studio models follow for when users switch to an AIzaSy... key.
const MODEL_CHAIN = [
  process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

export function getModel(modelName) {
  const name = modelName || MODEL_CHAIN[0];
  return getGenAI().getGenerativeModel({ model: name });
}

// ---------------------------------------------------------------------------
// Extract the retry delay (seconds) from a 429 error body
// ---------------------------------------------------------------------------
function getRetryDelayMs(error) {
  try {
    const match = (error.message || '').match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
    if (match) {
      const secs = parseFloat(match[1]);
      return Math.min(Math.ceil(secs) * 1000, 60_000); // cap at 60 s
    }
  } catch (_) { /* ignore */ }
  return 8_000; // safe default
}

// ---------------------------------------------------------------------------
// Safe JSON parsing wrapper for Gemini responses
// Strips markdown fences (```json ... ```) before parsing
// ---------------------------------------------------------------------------
export function safeParseJSON(raw) {
  if (typeof raw !== 'string') return raw;
  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('[Parser] Failed to parse Gemini response:', raw);
    throw new Error('Invalid JSON from Gemini');
  }
}

// ---------------------------------------------------------------------------
// Main call helper — tries models in chain, retries once on 429
// ---------------------------------------------------------------------------
export async function callGemini(prompt, options = {}) {
  if (!hasValidApiKey()) {
    throw new Error('NO_KEY');
  }

  geminiCallCount++;
  let lastError;

  for (const modelName of MODEL_CHAIN) {
    const model = getGenAI().getGenerativeModel({ model: modelName });

    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const text   = result.response.text();
        return options.json ? safeParseJSON(text) : text;

      } catch (err) {
        lastError = err;

        const status      = err.status || 0;
        const msg         = err.message || '';
        const is429       = status === 429 || msg.includes('429');
        const is404       = status === 404 || msg.includes('404') || msg.includes('not found');

        if (is429 && attempt === 0) {
          // Wait the server-specified delay then retry once on the same model
          const delay = getRetryDelayMs(err);
          console.log(`[Gemini] Rate limit on "${modelName}". Waiting ${delay / 1000}s then retrying…`);
          await new Promise(r => setTimeout(r, delay));
          continue; // retry
        }

        if (is429 && attempt === 1) {
          // Still rate-limited after waiting → signal fallback
          console.log(`[Gemini] Quota exhausted on "${modelName}". Using local fallback.`);
          throw new Error('RATE_LIMIT');
        }

        if (is404) {
          // Model doesn't exist for this key → try next in chain
          console.log(`[Gemini] Model "${modelName}" not found for this key. Trying next…`);
          break; // break attempt loop → next model
        }

        // Any other error: surface it immediately
        throw err;
      }
    }
  }

  // All models in the chain exhausted
  throw lastError || new Error('All Gemini models failed');
}
