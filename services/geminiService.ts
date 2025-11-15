
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
    let jsonString = "";

    // First, try to extract JSON from a markdown code block
    const jsonRegex = /```json\n([\s\S]*?)\n```/;
    const match = rawResponse.match(jsonRegex);

    if (match && match[1]) {
        jsonString = match[1];
    } else {
        // If no markdown block, find the first '{' or '[' and last '}' or ']'
        const firstBrace = rawResponse.indexOf('{');
        const firstBracket = rawResponse.indexOf('[');
        
        let startIndex = -1;
        if (firstBrace === -1) startIndex = firstBracket;
        else if (firstBracket === -1) startIndex = firstBrace;
        else startIndex = Math.min(firstBrace, firstBracket);

        const lastBrace = rawResponse.lastIndexOf('}');
        const lastBracket = rawResponse.lastIndexOf(']');
        const endIndex = Math.max(lastBrace, lastBracket);

        if (startIndex !== -1 && endIndex !== -1) {
            jsonString = rawResponse.substring(startIndex, endIndex + 1);
        } else {
             throw new Error("No valid JSON object or array found in the response.");
        }
    }

    // Remove trailing commas before parsing
    const cleanedString = jsonString.replace(/,(?=\s*?[\]}])/g, '');

    try {
        return JSON.parse(cleanedString) as T;
    } catch (error: unknown) {
        console.error("Still failed to parse JSON after cleaning:", error);
        throw error; // Re-throw to be caught by the handler in callGemini
    }
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
        
        console.log('%c📄 Raw AI Response:', 'color: #ff79c6; font-weight: bold;', rawResponse);

        if (!rawResponse) {
             return { success: false, error: "Received an empty or undefined response from the AI. This might be due to safety filters or other issues." };
        }
        
        try {
            const parsedJson = cleanAndParseJson<T>(rawResponse);
            console.log('%c✅ Parsed Response:', 'color: #34d399; font-weight: bold;', parsedJson);
            return { success: true, data: parsedJson };
        } catch (parseError: unknown) {
            console.error('⚠️ JSON Parsing failed.', parseError);
            return { 
                success: false, 
                error: `Failed to parse JSON response from AI. Error: ${(parseError instanceof Error) ? parseError.message : 'Unknown parsing error.'}`,
                rawResponse: rawResponse
            };
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
