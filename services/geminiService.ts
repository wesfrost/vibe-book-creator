
import { GoogleGenAI, Schema } from "@google/genai";
import { DEFAULT_AI_MODEL_ID } from '../config/aiModels';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not set in your environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

interface GeminiCallParams {
    systemInstruction: string;
    prompt: string;
    responseSchema: Schema;
    modelId?: string;
    temperature?: number;
}

export const callGemini = async (params: GeminiCallParams): Promise<any> => {
    const { systemInstruction, prompt, responseSchema, modelId = DEFAULT_AI_MODEL_ID, temperature = 0.7 } = params;

    console.groupCollapsed(`%c✨ Gemini API Call: ${new Date().toLocaleTimeString()}`, 'color: #34d399; font-weight: bold;');
    console.log('%cPersona:', 'color: #a78bfa; font-weight: bold;', systemInstruction);
    console.log('%cPrompt:', 'color: #a78bfa; font-weight: bold;', prompt);
    console.log('%cExpected Schema:', 'color: #a78bfa; font-weight: bold;', responseSchema);

    try {
        // THIS IS THE CORRECT, STABLE PAYLOAD STRUCTURE
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `system: ${systemInstruction}\nuser: ${prompt}`,
            generation_config: {
                response_mime_type: "application/json",
                response_schema: responseSchema,
                temperature,
            }
        });

        const jsonStr = response.text.trim();
        
        try {
            const parsedResponse = JSON.parse(jsonStr);
            console.log('%c✅ Raw Response:', 'color: #34d399; font-weight: bold;', parsedResponse);
            console.groupEnd();
            return parsedResponse;
        } catch (error) {
            console.error('❌ Failed to parse Gemini response as JSON:', jsonStr);
            console.groupEnd();
            return { message: "The AI returned an unexpected response. Let's try that again! 🧠⚡️" };
        }

    } catch (error) {
        console.error('❌ Error calling Gemini API:', error);
        console.groupEnd();
        return { message: "Oh, my dear author, it seems my typewriter is jammed! Let's try that again. 🛠️" };
    }
};
