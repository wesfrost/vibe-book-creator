
import { GoogleGenAI, ApiError } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not set in your environment variables.");
}

export const ai = new GoogleGenAI({apiKey});

// --- New, Bulletproof Return Type ---
export type GeminiResponse<T> = 
    | { success: true; data: T }
    | { success: false; error: string; rawResponse?: string };
    
// --- Error Handling Utility ---
export const handleApiError = (error: unknown): GeminiResponse<never> => {
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
};
