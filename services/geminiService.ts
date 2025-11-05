import { GoogleGenAI, Schema, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface GeminiCallParams {
    systemInstruction: string;
    prompt: string;
    responseSchema: Schema;
    temperature?: number;
}

export const callGemini = async ({ systemInstruction, prompt, responseSchema, temperature = 0.7 }: GeminiCallParams): Promise<any> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
                temperature,
            }
        });

        let jsonStr = response.text.trim();
        // Handle potential markdown code block fences
        if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Return a structured error message that the UI can handle
        return { message: "Oh, my dear author, it seems my typewriter is jammed! There was a little glitch. Could you try that again for me? 🛠️" };
    }
};