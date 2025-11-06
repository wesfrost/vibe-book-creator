
import { GoogleGenAI, Schema } from "@google/genai";
import { DEFAULT_AI_MODEL_ID } from '../config/aiModels';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not set in your environment variables. Please add it to your .env.local file.");
}

// Correctly instantiate the GoogleGenAI client by passing the API key directly.
const ai = new GoogleGenAI(apiKey);

interface GeminiCallParams {
    systemInstruction: string;
    prompt: string;
    responseSchema: Schema;
    modelId?: string;
    temperature?: number;
}

export const callGemini = async (params: GeminiCallParams): Promise<any> => {
    const { systemInstruction, prompt, responseSchema, modelId = DEFAULT_AI_MODEL_ID, temperature = 0.7 } = params;

    // Use a collapsed group for tidiness
    console.groupCollapsed(`%c✨ Gemini API Call: ${new Date().toLocaleTimeString()}`, 'color: #34d399; font-weight: bold;');
    console.log('%cModel:', 'color: #a78bfa; font-weight: bold;', modelId);
    console.log('%cPersona:', 'color: #a78bfa; font-weight: bold;', systemInstruction.substring(0, 100) + '...');
    console.log('%cPrompt:', 'color: #a78bfa; font-weight: bold;', prompt);
    console.log('%cExpected Schema:', 'color: #a78bfa; font-weight: bold;', responseSchema);
    console.groupEnd();

    try {
        const model = ai.getGenerativeModel({ 
            model: modelId, 
            systemInstruction 
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature,
            }
        });

        // In the new SDK, the response is directly available without needing to call .text()
        const response = result.response;
        const json = response.text();

        if (!json) {
             throw new Error("Received an empty response from the API.");
        }

        const parsedResponse = JSON.parse(json);
        console.log('%c✅ Parsed Response:', 'color: #34d399; font-weight: bold;', parsedResponse);
        return parsedResponse;

    } catch (error) {
        console.error('❌ Error calling Gemini API:', error);
        // Return a structured error message for the UI
        return {
             message: `Oh dear, my creative circuits seem to have shorted out! I couldn't connect to the AI. Please check the console for more details. (Error: ${error.message})` 
        };
    }
};



