
import { BookState } from '../types';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

/**
 * Generates a sophisticated prompt for a book cover based on the book's state.
 */
const createCoverPrompt = (bookState: BookState): string => {
    const {
        title = "Untitled",
        genre = "fiction",
        vibe = "mysterious",
        storylineRationale = "A compelling journey of discovery.",
        charactersRationale = "A cast of unforgettable characters."
    } = bookState;

    // We can get even more creative here, perhaps by asking another AI to summarize the vibe and story into a visual concept.
    // For now, a detailed prompt is a great start.
    return `Create a visually stunning, high-impact book cover for a ${genre} novel titled "${title}".

    The overall vibe is ${vibe}.

    The story is about: ${storylineRationale}.

    The main characters are: ${charactersRationale}.

    The design should be photorealistic, with high contrast to be impactful as a small thumbnail. It needs to look professional and enticing to the target audience for this genre. Do not include any text in the image.`;
};

/**
 * Generates book cover concepts using a generative AI model.
 * @param bookState - The current state of the book.
 * @returns A promise that resolves to an array of base64 encoded image strings.
 */
export const generateCoverConcepts = async (bookState: BookState): Promise<string[]> => {
    const prompt = createCoverPrompt(bookState);
    console.log("Generating cover with prompt:", prompt);

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-fast-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 4, 
              outputMimeType: 'image/jpeg',
              aspectRatio: '3:4', 
            },
        });

        const imagePrompts = response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
        return imagePrompts;

    } catch (error) {
        console.error("Error generating cover concepts:", error);
        // Return an empty array or throw the error, depending on how the caller should handle it.
        return [];
    }
};
