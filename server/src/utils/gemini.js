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
        // Simple JSON extraction
        const match = text.match(/```json\n([\s\S]*?)\n```/);
        if (match) {
          text = match[1];
        } else {
           const match2 = text.match(/```\n([\s\S]*?)\n```/);
           if (match2) text = match2[1];
        }
        return JSON.parse(text);
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
