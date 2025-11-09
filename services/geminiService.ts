
import { GoogleGenAI, Schema, ApiError, Content, GenerateContentResponse } from "@google/genai";
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
    contents: Content[];
    responseSchema?: Schema;
    modelId?: string;
    temperature?: number;
}

const cleanAndParseJson = <T>(rawResponse: string): T => {
    
    const jsonRegex = /```json\n([\s\S]*?)\n```/;
    const match = rawResponse.match(jsonRegex);

    if (match && match[1]) {
        try {
            return JSON.parse(match[1]) as T;
        } catch (error) {
            throw new Error("Failed to parse JSON from the response.");
        }
    }
    
    const startIndex = rawResponse.indexOf('{');
    const endIndex = rawResponse.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
        throw new Error("No valid JSON object found in the response.");
    }
    
    const jsonString = rawResponse.substring(startIndex, endIndex + 1);
    return JSON.parse(jsonString) as T;
};

export const callGemini = async <T>(params: GeminiCallParams): Promise<GeminiResponse<T>> => {
    const { systemInstruction, contents, responseSchema, modelId = DEFAULT_AI_MODEL_ID, temperature = 0.7 } = params;

    console.groupCollapsed(`%c✨ Gemini API Call (Stateless): ${new Date().toLocaleTimeString()}`, 'color: #34d399; font-weight: bold;');
    console.log('%cModel:', 'color: #a78bfa; font-weight: bold;', modelId);
    console.log('%cPersona:', 'color: #a78bfa; font-weight: bold;', systemInstruction.substring(0, 100) + '...');
    console.log('%cContents:', 'color: #a78bfa; font-weight: bold;', contents);
    console.log('%cExpected Schema:', 'color: #a78bfa; font-weight: bold;', responseSchema);
    console.log('%cTemperature:', 'color: #a78bfa; font-weight: bold;', temperature);
    console.groupEnd();

    try {
        const result: GenerateContentResponse = await ai.models.generateContent({
            model: modelId,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                temperature: temperature,
                responseMimeType: "application/json",
                ... (responseSchema && { responseSchema: responseSchema }),
            }
        });
        
        const rawResponse = result.text?.trim();
        
        if (!rawResponse) {
             return { success: false, error: "Received an empty or undefined response from the AI. This might be due to safety filters or other issues." };
        }
        
        try {
            const parsedJson = cleanAndParseJson<T>(rawResponse);
            console.log('%c✅ Parsed Response:', 'color: #34d399; font-weight: bold;', parsedJson);
            return { success: true, data: parsedJson };
        } catch (parseError: unknown) {
            console.log('⚠️ JSON Parsing failed, treating as a conversational text response.');
            const fallbackData = { refinementMessage: rawResponse, options: [] } as T;
            return { success: true, data: fallbackData };
        }

    } catch (error: unknown) {
        console.error('❌ Error calling Gemini API:', error);
        if (error instanceof ApiError) {
             return { 
                success: false, 
                error: `API call failed with status ${error.status}. Message: ${error.message}` 
            };
        }
        return { 
            success: false, 
            error: `An unexpected error occurred. (Error: ${(error instanceof Error) ? error.message : String(error)})` 
        };
    }
};
