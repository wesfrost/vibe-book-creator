
import { Type } from "@google/genai";
import { BookState, ChatMessage } from "../types";
import { callGemini } from './geminiService';
import { getMockResponseForStep } from './mockResponses';
import { ORCHESTRATOR_PERSONA } from './personas/orchestrator';
import { STRATEGIST_PERSONA } from './personas/strategist';
import { WRITER_PERSONA } from './personas/writer';

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
export const processStep = async (history: ChatMessage[], currentStep: string, bookState: BookState, modelId: string): Promise<any> => {
    let persona;
    let responseSchema;
    let applyGoldenRule = false;

    const strategistSteps = [ "Genre Defined", "Working Title Defined", "Core Idea Locked In", "Vibe Defined", "Target Audience Identified", "Main Storyline Solidified", "Key Characters Defined", "Number of Chapters Defined", "Pacing Strategy Agreed" ];

    if (currentStep === "Chapter Outline") {
        persona = WRITER_PERSONA;
        responseSchema = getResponseSchemaForOutline();
    } else if (currentStep.includes("Drafted")) {
        persona = WRITER_PERSONA;
        responseSchema = getResponseSchemaForChapterDraft();
    } else if (strategistSteps.includes(currentStep)) {
        persona = STRATEGIST_PERSONA;
        responseSchema = getResponseSchemaForOptions(currentStep);
        applyGoldenRule = true; // Only apply the golden rule for these steps
    } else {
        persona = ORCHESTRATOR_PERSONA;
        responseSchema = { type: Type.OBJECT, properties: { message: { type: Type.STRING } }, required: ["message"] };
    }
    
    let prompt = constructPrompt(history, currentStep, bookState, applyGoldenRule);
    const response = await callGemini({ systemInstruction: persona, prompt, responseSchema, modelId });

    return {
        message: response.message || response.postChapterMessage,
        options: response.options || null,
        outline: response.outline || null,
        chapterTitle: response.chapterTitle || null,
        chapterContent: response.chapterContent || null,
    };
};

function constructPrompt(history: ChatMessage[], currentStep: string, bookState: BookState, applyGoldenRule: boolean): string {
    const historyString = history.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n');
    let taskInstruction = `Based on all the above, perform your expert function for the author's current task.`;
    if(currentStep === "Chapter Outline") {
        taskInstruction = `You are a master storyteller... **Only generate the outline and the introductory message.**`
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
