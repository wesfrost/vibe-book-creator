
import { Type } from "@google/genai";
import { BookState, ChatMessage } from "../types";
import { callGemini } from './geminiService';
// ... other imports

// ... schema definitions ...

// --- Main Orchestration Logic ---
export const processStep = async (history: ChatMessage[], currentStep: string, bookState: BookState, modelId: string): Promise<any> => {
    // ... existing logic ...
};

function constructPrompt(history: ChatMessage[], currentStep: string, bookState: BookState, applyGoldenRule: boolean): string {
    const historyString = history.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n');
    let taskInstruction = `Based on all the above, perform your expert function for the author's current task.`;
    
    if(currentStep === "Chapter Outline") {
        taskInstruction = `You are a master storyteller and bestselling author. Based on all the book's details (especially the genre, vibe, and storyline), generate a complete, chapter-by-chapter outline for all ${bookState.chapterCount} chapters. Each chapter in the outline should have a compelling title and a detailed, paragraph-long description of its key events, character arcs, and plot points. The full outline should follow a proven story structure (like the three-act structure) to maximize reader engagement.`;
    }

    let basePrompt = `
Here is the recent conversation history:
${historyString}
Here is the current state of the book we are writing:
${JSON.stringify(bookState, null, 2)}
The author's current task is: **${currentStep}**.
${taskInstruction}
`;
    if (applyGoldenRule) {
        const goldenRule = "Your primary goal is to provide actionable, structured 'options' for the user to select...";
        basePrompt += `\n\n**Golden Rule:** ${goldenRule}`;
    }
    return basePrompt;
}
