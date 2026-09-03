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
  return getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash' });
}

export async function callGemini(prompt, options = {}) {
  const model = getModel();
  
  const delays = [1000, 2000, 4000];
  let lastError;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      let text = result.response.text();
      
      if (options.json) {
        // Strip markdown code fences if present (e.g. ```json ... ``` or ``` ...)
        let cleaned = text.trim();
        const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch) {
          cleaned = codeBlockMatch[1].trim();
        } else {
          // Find first [ or { and last ] or }
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
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, delays[attempt]));
      }
    }
  }

  throw lastError;
}
