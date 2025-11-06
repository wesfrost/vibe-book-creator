
import { GoogleGenAI, Schema, Type, ApiError } from "@google/genai";
import { DEFAULT_AI_MODEL_ID } from '../config/aiModels';

// Per the new guidelines, the API key is passed directly to the constructor.
// Vite handles .env files, so this remains the standard way for client-side apps.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not set in your environment variables.");
}
const ai = new GoogleGenAI({apiKey});


// --- New, Bulletproof Return Type ---
export type GeminiResponse<T> = 
    | { success: true; data: T }
    | { success: false; error: string; rawResponse?: string };

// --- Function Parameters ---
interface GeminiCallParams {
    systemInstruction: string;
    prompt: string;
    responseSchema: Schema;
    modelId?: string;
    temperature?: number;
}

/**
 * A robust, type-safe function for calling the Google Gemini API,
 * adhering to the latest @google/genai SDK standards.
 * @param params The parameters for the Gemini API call.
 * @returns A GeminiResponse object containing either the parsed data or an error message.
 */
export const callGemini = async <T>(params: GeminiCallParams): Promise<GeminiResponse<T>> => {
    const { systemInstruction, prompt, responseSchema, modelId = DEFAULT_AI_MODEL_ID, temperature = 0.7 } = params;

    // --- 1. Log the Request for Debugging ---
    console.groupCollapsed(`%c✨ Gemini API Call (New SDK): ${new Date().toLocaleTimeString()}`, 'color: #34d399; font-weight: bold;');
    console.log('%cModel:', 'color: #a78bfa; font-weight: bold;', modelId);
    console.log('%cPersona:', 'color: #a78bfa; font-weight: bold;', systemInstruction.substring(0, 100) + '...');
    console.log('%cPrompt:', 'color: #a78bfa; font-weight: bold;', prompt);
    console.log('%cExpected Schema:', 'color: #a78bfa; font-weight: bold;', responseSchema);
    console.groupEnd();

    try {
        // --- 2. Make the API Call using the new `ai.models.generateContent` structure ---
        const response = await ai.models.generateContent({
            model: modelId,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                systemInstruction: { role: "model", parts: [{ text: systemInstruction }] },
                temperature: temperature,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });
        
        const rawResponse = response.text.trim();
        
        if (!rawResponse) {
             return { success: false, error: "Received an empty response from the API." };
        }
        
        // --- 3. Parse the JSON (The SDK should now guarantee JSON if schema is used) ---
        try {
            const parsedJson = JSON.parse(rawResponse) as T;
            console.log('%c✅ Parsed Response:', 'color: #34d399; font-weight: bold;', parsedJson);
            return { success: true, data: parsedJson };
        } catch (parseError) {
            console.error('❌ JSON Parsing Error:', parseError);
            return { 
                success: false, 
                error: `Failed to parse JSON from the AI's response, even though a schema was requested. Error: ${parseError.message}`,
                rawResponse: rawResponse 
            };
        }

    } catch (error) {
        console.error('❌ Error calling Gemini API:', error);
        if (error instanceof ApiError) {
             return { 
                success: false, 
                error: `The Gemini API call failed with status ${error.status}. Message: ${error.message}` 
            };
        }
        return { 
            success: false, 
            error: `An unexpected error occurred. (Error: ${error.message})` 
        };
    }
};
