
import { BookState } from '../types';
import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not set in your environment variables.");
}
const ai = new GoogleGenAI({apiKey});

/**
 * Generates book cover concepts using a generative AI model.
 * @param bookState - The current state of the book.
 * @returns A promise that resolves to an array of image URLs.
 */
export const generateCoverConcepts = async (bookState: BookState): Promise<string[]> => {
    if (!bookState.coverOptions) {
        return [];
    }

    console.log("Generating 4 cover concepts...");

    const imageGenerationPromises = bookState.coverOptions.map(async (option) => {
        const fullPrompt = `Create a visually stunning, high-impact book cover for a ${bookState.genre} novel titled "${bookState.title}". The concept is: ${option.title}. ${option.rationale}`;
        
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-fast-generate-001',
            prompt: fullPrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '3:4',
            },
        });
    
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        return imageUrl;
    });

    try {
        const imageUrls = await Promise.all(imageGenerationPromises);
        console.log("Generated image URLs:", imageUrls);
        return imageUrls;
    } catch (error) {
        console.error("Error generating cover concepts:", error);
        return [];
    }
};
