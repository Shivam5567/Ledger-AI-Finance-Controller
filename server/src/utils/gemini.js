import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

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

// Primary model to use. Falls back through the chain on 404.
const MODEL_CHAIN = [
  process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash-exp',
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
// Parse JSON out of a raw Gemini text response (strips markdown fences)
// ---------------------------------------------------------------------------
function parseJsonResponse(text) {
  let cleaned = text.trim();

  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  } else {
    const first = cleaned.search(/[\[{]/);
    const last  = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
    if (first !== -1 && last > first) {
      cleaned = cleaned.substring(first, last + 1);
    }
  }

  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// Main call helper — tries models in chain, retries once on 429
// ---------------------------------------------------------------------------
export async function callGemini(prompt, options = {}) {
  if (!hasValidApiKey()) {
    throw new Error('NO_KEY');
  }

  let lastError;

  for (const modelName of MODEL_CHAIN) {
    const model = getGenAI().getGenerativeModel({ model: modelName });

    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const text   = result.response.text();
        return options.json ? parseJsonResponse(text) : text;

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
