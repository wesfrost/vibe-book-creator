
import { Type } from "@google/genai";
import { BookState, ChatMessage, BrainstormingIdea } from "../types";
import { callGemini } from './geminiService';
import { getMockResponseForStep, getMockBrainstormIdeas, getMockAnalysis } from './mockResponses';
import { ORCHESTRATOR_PERSONA } from './personas/orchestrator';
import { STRATEGIST_PERSONA } from './personas/strategist';
import { WRITER_PERSONA } from './personas/writer';
import { EDITOR_PERSONA } from './personas/editor';
import { MARKETER_PERSONA } from './personas/marketer';

// --- Schema Definitions (using 'Type' enum from @google/genai) ---
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
                    title: { 
                        type: Type.STRING, 
                        description: `The concise, user-facing title for this ${itemDescription}. This title IS the data. It should NOT contain prefixes like "Option 1:" or "Choice A:".` 
                    },
                    description: { type: Type.STRING, description: `A brief, compelling description of the ${itemDescription}.` },
                    rationale: { type: Type.STRING, description: "A concise, educational explanation of why this option aligns with best-seller trends, written for a beginner author." }
                },
                required: ['title', 'description', 'rationale']
            }
        }
    },
    required: ["message", "options"],
});

const getResponseSchemaForList = (itemDescription: string) => ({
    type: Type.OBJECT,
    properties: {
        message: { type: Type.STRING, description: "The AI's full, conversational response introducing the researched list and explaining its strategic importance." },
        items: { type: Type.ARRAY, description: `An array of researched ${itemDescription}.`, items: { type: Type.STRING } }
    },
    required: ["message", "items"],
});

const getResponseSchemaForText = () => ({
    type: Type.OBJECT, 
    properties: { 
        message: { type: Type.STRING, description: "The AI's full, conversational response to the user, or the fully generated text (like an outline), formatted in Markdown." } 
    }, 
    required: ["message"],
});

// --- Golden Rule Prompt Enhancer ---
const applyGoldenRule = (prompt: string): string => {
    const goldenRule = "Your primary goal is to provide actionable, structured 'options' for the user to select. If the user provides feedback, use it to refine and generate a *better* set of options for the same step. Always present the user with choices.";
    return `${prompt}\n\n**Golden Rule:** ${goldenRule}`;
};

// --- Prompt Construction ---
function constructPrompt(history: ChatMessage[], currentStep: string, bookState: BookState): string {
    const historyString = history.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n');
    let taskInstruction = `Based on all the above, perform your expert function for the author's current task.`;

    if (currentStep.startsWith("Research names for")) {
        taskInstruction = `Research and suggest 5-7 thematic and genre-appropriate names based on the provided character archetype.`;
    }
    
    const basePrompt = `
Here is the recent conversation history:
${historyString}

Here is the current state of the book we are writing:
${JSON.stringify(bookState, null, 2)}

The author's current task is: **${currentStep}**.

${taskInstruction}
`;
    return applyGoldenRule(basePrompt);
}

// --- Main Orchestration Logic ---
export const processStep = async (history: ChatMessage[], currentStep: string, bookState: BookState, modelId: string, isDevMode: boolean = false): Promise<any> => {
    if (isDevMode) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return getMockResponseForStep(currentStep);
    }

    let persona = ORCHESTRATOR_PERSONA;
    let responseSchema;
    let prompt = constructPrompt(history, currentStep, bookState);

    const strategistSteps = [
        "Genre Defined", "Working Title Defined", "Core Idea Locked In", "Vibe Defined", "Target Audience Identified",
        "Main Storyline Solidified", "Key Characters Defined", "Pacing Strategy Agreed",
    ];

    if (strategistSteps.includes(currentStep)) {
        persona = STRATEGIST_PERSONA;
        responseSchema = getResponseSchemaForOptions(currentStep);
    } else if (currentStep.startsWith("Research names for")) {
        persona = STRATEGIST_PERSONA;
        responseSchema = getResponseSchemaForList('character names');
    }
    else { 
        persona = ORCHESTRATOR_PERSONA;
        responseSchema = getResponseSchemaForText();
    }

    return callGemini({ systemInstruction: persona, prompt, responseSchema, modelId });
};
