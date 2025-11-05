
import { GoogleGenAI, Schema } from "@google/genai";
import { DEFAULT_AI_MODEL_ID } from '../config/aiModels';

// In this managed proxy environment, the API key is handled entirely on the backend.
// We initialize the client with an empty object to satisfy the constructor,
// allowing it to make unauthenticated requests that the proxy will intercept.
const ai = new GoogleGenAI({});

interface GeminiCallParams {
    systemInstruction: string;
    prompt: string;
    responseSchema: Schema;
    modelId?: string;
    temperature?: number;
}

export const callGemini = async ({ systemInstruction, prompt, responseSchema, modelId = DEFAULT_AI_MODEL_ID, temperature = 0.7 }: GeminiCallParams): Promise<any> => {
    try {
        // Using the v1beta-compatible payload and model name
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `system: ${systemInstruction}\nuser: ${prompt}`,
            generation_config: {
                response_mime_type: "application/json",
                response_schema: responseSchema,
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
