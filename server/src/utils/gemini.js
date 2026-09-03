import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

function getGenAI() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. Gemini calls will fail.");
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  return genAI;
}

export function getModel() {
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  return getGenAI().getGenerativeModel({ model: modelName });
}

export async function callGemini(prompt, options = {}) {
  const model = getModel();
  let lastError;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      let text = result.response.text();
      
      if (options.json) {
        let cleaned = text.trim();
        const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch) {
          cleaned = codeBlockMatch[1].trim();
        } else {
          const firstBracket = cleaned.search(/[\[\{]/);
          const lastBracket = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
          if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            cleaned = cleaned.substring(firstBracket, lastBracket + 1);
          }
        }
        return JSON.parse(cleaned);
      }
      
      return text;
    } catch (error) {
      lastError = error;
      // If 429 Rate Limit, don't waste time retrying fast
      const isRateLimit = error.status === 429 || (error.message && error.message.includes('429'));
      if (isRateLimit) {
        console.log('[Gemini API] Quota/Rate limit reached (429). Using local intelligent fallback.');
        throw new Error('429 Rate Limit Exceeded');
      }

      if (attempt < 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  throw lastError;
}
