
import { GoogleGenAI, Schema } from "@google/genai";
import { DEFAULT_AI_MODEL_ID } from '../config/aiModels';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not set in your environment variables. Please add it to your .env.local file and restart your development server.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

// Get the model instance one time, this is a cleaner pattern.
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-latest" });


interface GeminiCallParams {
    systemInstruction: string;
    prompt: string;
    responseSchema: Schema;
    temperature?: number;
}

export const callGemini = async ({ systemInstruction, prompt, responseSchema, temperature = 0.7 }: GeminiCallParams): Promise<any> => {
    try {
        // This is the correct payload structure based on your working example.
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            systemInstruction: {
                parts: [{ text: systemInstruction }]
            },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature,
            }
        });

        const response = result.response;
        let jsonStr = response.text().trim();
        
        if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return { message: "Oh, my dear author, it seems my typewriter is jammed! There was a little glitch. Could you try that again for me? 🛠️" };
    }
};
