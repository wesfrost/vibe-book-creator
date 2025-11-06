
import { GoogleGenAI, Schema } from "@google/genai";
import { DEFAULT_AI_MODEL_ID } from '../config/aiModels';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not set in your environment variables. Please add it to your .env.local file and restart your development server.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

interface GeminiCallParams {
    systemInstruction: string;
    prompt: string;
    responseSchema: Schema;
    modelId?: string;
    temperature?: number;
}

export const callGemini = async ({ systemInstruction, prompt, responseSchema, modelId = DEFAULT_AI_MODEL_ID, temperature = 0.7 }: GeminiCallParams): Promise<any> => {
    try {
        // This payload structure matches the known working example.
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
                temperature,
            }
        });

        let jsonStr = response.text.trim();
        if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return { message: "Oh, my dear author, it seems my typewriter is jammed! There was a little glitch. Could you try that again for me? 🛠️" };
    }
};
