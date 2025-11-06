import { callGemini } from './geminiService';
import { ORCHESTRATOR_PERSONA } from './personas/orchestrator';
import { STRATEGIST_PERSONA } from './personas/strategist';
import { WRITER_PERSONA } from './personas/writer';
import { ChatMessage, BookState } from '../types';
import { Type } from "@google/genai";

// --- Schema Definitions (Corrected and complete) ---
const getResponseSchemaForOptions = (itemDescription: string) => ({
    type: Type.OBJECT,
    properties: {
        message: { type: Type.STRING },
        options: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    rationale: { type: Type.STRING }
                },
                required: ['title', 'description', 'rationale']
            }
        }
    },
    required: ["message", "options"],
});

const getResponseSchemaForOutline = () => ({
    type: Type.OBJECT,
    properties: {
        message: { type: Type.STRING },
        outline: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    chapterTitle: { type: Type.STRING },
                    chapterDescription: { type: Type.STRING }
                },
                required: ['chapterTitle', 'chapterDescription']
            }
        }
    },
    required: ["message", "outline"],
});

const getResponseSchemaForChapterDraft = () => ({
    type: Type.OBJECT,
    properties: {
        postChapterMessage: { type: Type.STRING },
        chapterTitle: { type: Type.STRING },
        chapterContent: { type: Type.STRING }
    },
    required: ["postChapterMessage", "chapterTitle", "chapterContent"],
});

// --- Main Orchestration Logic ---
export const processStep = async (
    history: ChatMessage[],
    step: string,
    bookState: BookState,
    modelId: string
): Promise<any> => {

    const persona = getPersonaForStep(step);
    const responseSchema = getResponseSchemaForSchemaType(step);
    let applyGoldenRule = shouldApplyGoldenRule(step); // Determine if Golden Rule applies
    
    // Construct prompt and explicitly ask for JSON in markdown fences if a schema is present.
    let prompt = constructPrompt(history, step, bookState, applyGoldenRule);
    if (responseSchema && responseSchema.type === Type.OBJECT) {
        prompt += `\n\n**IMPORTANT:** Always wrap your JSON output in a markdown code block, like this: \`\`\`json { ... } \`\`\``;
    }

    try {
        const response = await callGemini({
            systemInstruction: persona,
            prompt,
            responseSchema: responseSchema,
            modelId
        });
        return response;
    } catch (error) {
        console.error("Error processing step:", error);
        return { message: "Oh no! My creative circuits are buzzing with errors. Let's try that again! 🤖⚡️" };
    }
};

// Helper to determine the persona based on the current step
const getPersonaForStep = (step: string): string => {
    if (["Book Format Selected", "Genre Defined", "Working Title Defined", "Core Idea Locked In", "Vibe Defined", "Target Audience Identified", "Main Storyline Solidified", "Key Characters Defined", "Number of Chapters Defined", "Pacing Strategy Agreed"].includes(step)) return STRATEGIST_PERSONA;
    if (step === "Chapter Outline" || step.includes("Drafted")) return WRITER_PERSONA;
    return ORCHESTRATOR_PERSONA; // Default persona
};

// Helper to determine which schema to use for the response
const getResponseSchemaForSchemaType = (step: string): any => {
    if (["Book Format Selected", "Genre Defined", "Working Title Defined", "Core Idea Locked In", "Vibe Defined", "Target Audience Identified", "Main Storyline Solidified", "Key Characters Defined", "Number of Chapters Defined", "Pacing Strategy Agreed"].includes(step)) return getResponseSchemaForOptions(step);
    if (step === "Chapter Outline") return getResponseSchemaForOutline();
    if (step.includes("Drafted")) return getResponseSchemaForChapterDraft();
    return { type: Type.OBJECT, properties: { message: { type: Type.STRING } }, required: ["message"] }; // Default schema
};

// Helper to apply the Golden Rule based on the step
const shouldApplyGoldenRule = (step: string): boolean => {
    return ["Book Format Selected", "Genre Defined", "Working Title Defined", "Core Idea Locked In", "Vibe Defined", "Target Audience Identified", "Main Storyline Solidified", "Key Characters Defined", "Number of Chapters Defined", "Pacing Strategy Agreed"].includes(step);
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
        const goldenRule = "Your primary goal is to provide actionable, structured 'options' for the user to select. If the user provides feedback, use it to refine and generate a *better* set of options for the same step. Always present the user with choices.";
        basePrompt += `\n\n**Golden Rule:** ${goldenRule}`;
    }
    return basePrompt;
}
