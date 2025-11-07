
import { GoogleGenAI, Schema, Type, ApiError } from "@google/genai";
import { DEFAULT_AI_MODEL_ID } from '../config/aiModels';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not set in your environment variables.");
}
const ai = new GoogleGenAI({apiKey});


export type GeminiResponse<T> = 
    | { success: true; data: T }
    | { success: false; error: string; rawResponse?: string };

export interface GeminiCallParams {
    systemInstruction: string;
    prompt: string;
    responseSchema?: Schema;
    modelId?: string;
    temperature?: number;
}

export const callGemini = async <T>(params: GeminiCallParams): Promise<GeminiResponse<T>> => {
    const { systemInstruction, prompt, responseSchema, modelId = DEFAULT_AI_MODEL_ID, temperature = 0.7 } = params;

    console.groupCollapsed(`%c✨ Gemini API Call (New SDK): ${new Date().toLocaleTimeString()}`, 'color: #34d399; font-weight: bold;');
    console.log('%cModel:', 'color: #a78bfa; font-weight: bold;', modelId);
    console.log('%cPersona:', 'color: #a78bfa; font-weight: bold;', systemInstruction.substring(0, 100) + '...');
    console.log('%cPrompt:', 'color: #a78bfa; font-weight: bold;', prompt);
    console.log('%cExpected Schema:', 'color: #a78bfa; font-weight: bold;', responseSchema);
    console.groupEnd();

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                systemInstruction: { role: "model", parts: [{ text: systemInstruction }] },
                temperature: temperature,
                responseMimeType: "application/json",
                ... (responseSchema && { responseSchema: responseSchema }), // Conditionally add responseSchema
            }
        });
        
        const rawResponse = response.text?.trim(); // Safely access and trim
        
        if (!rawResponse) {
             return { success: false, error: "Received an empty or undefined response from the API." };
        }
        
        try {
            const parsedJson = JSON.parse(rawResponse) as T;
            console.log('%c✅ Parsed Response:', 'color: #34d399; font-weight: bold;', parsedJson);
            return { success: true, data: parsedJson };
        } catch (parseError: unknown) {
            console.error('❌ JSON Parsing Error:', parseError);
            return { 
                success: false, 
                error: `Failed to parse JSON from the AI's response, even though a schema was requested. Error: ${(parseError instanceof Error) ? parseError.message : String(parseError)}`,
                rawResponse: rawResponse 
            };
        }

    } catch (error: unknown) {
        console.error('❌ Error calling Gemini API:', error);
        if (error instanceof ApiError) {
             return { 
                success: false, 
                error: `The Gemini API call failed with status ${error.status}. Message: ${error.message}` 
            };
        }
        return { 
            success: false, 
            error: `An unexpected error occurred. (Error: ${(error instanceof Error) ? error.message : String(error)})` 
        };
    }
};
