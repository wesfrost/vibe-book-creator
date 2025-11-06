
import { Type } from "@google/genai";
import { BookState, ChatMessage } from "../types";
import { callGemini } from './geminiService';
import { getMockResponseForStep } from './mockResponses';
import { ORCHESTRATOR_PERSONA } from './personas/orchestrator';
import { STRATEGIST_PERSONA } from './personas/strategist';
import { WRITER_PERSONA } from './personas/writer';

// --- Schema Definitions ---
const getResponseSchemaForOptions = (itemDescription: string) => ({
    type: Type.OBJECT,
    properties: {
        message: { type: Type.STRING, description: "The AI's full, conversational response to the user, formatted in Markdown." },
        options: {
            type: Type.ARRAY,
            description: "An array of 2-4 actionable, best-seller engineered options for the user.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: `The concise, user-facing title for this ${itemDescription}.` },
                    description: { type: Type.STRING, description: `A brief, compelling description of the ${itemDescription}.` },
                    rationale: { type: Type.STRING, description: "A concise, educational explanation of why this option aligns with best-seller trends." }
                },
                required: ['title', 'description', 'rationale']
            }
        }
    },
    required: ["message", "options"],
});

// NEW SCHEMA for the book outline
const getResponseSchemaForOutline = () => ({
    type: Type.OBJECT,
    properties: {
        message: { type: Type.STRING, description: "A brief, conversational message for the chat window introducing the proposed outline." },
        outline: {
            type: Type.ARRAY,
            description: "The full, chapter-by-chapter outline of the book.",
            items: {
                type: Type.OBJECT,
                properties: {
                    chapterTitle: { type: Type.STRING, description: "The proposed, compelling title for this chapter." },
                    chapterDescription: { type: Type.STRING, description: "A detailed, paragraph-long description of the key events, character arcs, and plot points for this chapter." }
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
        postChapterMessage: { type: Type.STRING, description: "A brief, conversational message for the chat window indicating the draft is ready." },
        chapterTitle: { type: Type.STRING, description: "The official title for this chapter." },
        chapterContent: { type: Type.STRING, description: "The full, complete, well-written chapter draft, formatted in Markdown." }
    },
    required: ["postChapterMessage", "chapterTitle", "chapterContent"],
});

// --- Main Orchestration Logic ---
export const processStep = async (history: ChatMessage[], currentStep: string, bookState: BookState, modelId: string): Promise<any> => {
    let persona;
    let responseSchema;
    let prompt = constructPrompt(history, currentStep, bookState);

    const strategistSteps = [ "Genre Defined", "Working Title Defined", "Core Idea Locked In", "Vibe Defined", "Target Audience Identified", "Main Storyline Solidified", "Key Characters Defined", "Pacing Strategy Agreed", "Number of Chapters Defined" ];

    if (currentStep === "Outline Approved") {
        persona = WRITER_PERSONA;
        responseSchema = getResponseSchemaForOutline();
    } else if (currentStep.includes("Drafted")) {
        persona = WRITER_PERSONA;
        responseSchema = getResponseSchemaForChapterDraft();
    } else if (strategistSteps.includes(currentStep)) {
        persona = STRATEGIST_PERSONA;
        responseSchema = getResponseSchemaForOptions(currentStep);
    } else {
        persona = ORCHESTRATOR_PERSONA; // Fallback for simple text messages
        responseSchema = { type: Type.OBJECT, properties: { message: { type: Type.STRING } }, required: ["message"] };
    }

    const response = await callGemini({ systemInstruction: persona, prompt, responseSchema, modelId });

    return {
        message: response.message || response.postChapterMessage,
        options: response.options || null,
        outline: response.outline || null,
        chapterTitle: response.chapterTitle || null,
        chapterContent: response.chapterContent || null,
    };
};

function constructPrompt(history: ChatMessage[], currentStep: string, bookState: BookState): string {
    const historyString = history.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n');
    let taskInstruction = `Based on all the above, perform your expert function for the author's current task.`;
    if(currentStep === "Outline Approved") {
        taskInstruction = `You are a master storyteller and bestselling author. Based on all the book's details, generate a complete, chapter-by-chapter outline. Each chapter should have a compelling title and a detailed description of its events. The outline should follow a proven story structure (like the three-act structure) to maximize reader engagement.`
    }
    const basePrompt = `
Here is the recent conversation history:
${historyString}
Here is the current state of the book we are writing:
${JSON.stringify(bookState, null, 2)}
The author's current task is: **${currentStep}**.
${taskInstruction}
`;
    const applyGoldenRule = (prompt: string): string => {
        const goldenRule = "Your primary goal is to provide actionable, structured 'options' for the user to select. If the user provides feedback, use it to refine and generate a *better* set of options for the same step. Always present the user with choices.";
        return `${prompt}\n\n**Golden Rule:** ${goldenRule}`;
    };
    return applyGoldenRule(basePrompt);
}
