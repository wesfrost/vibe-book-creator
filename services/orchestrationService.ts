
import { callGemini, GeminiResponse, GeminiCallParams } from './geminiService';
import * as Personas from './personas';
import { bookCreationWorkflow } from '../config/bookCreationWorkflow';
import { ChatMessage, BookState } from '../types';
import { Type } from "@google/genai";

// A simple map to get the persona object from its name
const personaMap: { [key: string]: string } = {
    ORCHESTRATOR: Personas.ORCHESTRATOR_PERSONA,
    STRATEGIST: Personas.STRATEGIST_PERSONA,
    WRITER: Personas.WRITER_PERSONA,
    EDITOR: Personas.EDITOR_PERSONA,
    MARKETER: Personas.MARKETER_PERSONA,
};

// --- Main Orchestration Logic ---
export const processStep = async (
    history: ChatMessage[],
    stepId: string,
    bookState: BookState,
    modelId: string
): Promise<GeminiResponse<any>> => {

    const stepConfig = bookCreationWorkflow.find(step => step.id === stepId);

    if (!stepConfig) {
        const errorMsg = `Unknown step ID: ${stepId}`;
        console.error(errorMsg);
        return { success: false, error: "I seem to have lost my place in the story... can we go back a step? 🤷" };
    }

    const personaText = personaMap[stepConfig.persona || 'ORCHESTRATOR'];
    const responseSchema = stepConfig.output.schema;
    
    // Determine which book state to use
    const bookStateForPrompt = bookState.minimizedBookSpec || bookState;

    // Construct the prompt
    const historyString = history.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n');
    let prompt = `
Here is the recent conversation history:
${historyString}

Here is the current state of the book we are writing:
${JSON.stringify(bookStateForPrompt, null, 2)}

The author's current task is: **${stepConfig.title}**

**Your Instructions:**
${stepConfig.prompt}
`;

    if (stepId === 'draft_chapter' && bookState.draftingChapterIndex !== undefined) {
        const chapterToDraft = bookState.chapters[bookState.draftingChapterIndex];
        if (chapterToDraft) {
            prompt += `\n\n**Specifically, you are to draft Chapter ${bookState.draftingChapterIndex + 1}: ${chapterToDraft.title}**`;
        }
    }

    if (stepConfig.userActions.includes('select_option')) {
        const goldenRule = "Your primary goal is to provide researched, best selling, actionable, structured 'options' for the user to select. If the user provides feedback, use it to refine and generate a *better* set of options for the same step. Always present the user with choices. You may also suggest a `bestOption` (the 0-indexed number of the option you recommend the most).";
        prompt += `\n\n**Golden Rule:** ${goldenRule}`;
    }

    if (responseSchema && responseSchema.type === Type.OBJECT) {
        prompt += `\n\n**IMPORTANT:** Your response MUST be a single JSON object that strictly adheres to the provided schema. Do not add any extra text, commentary, or markdown formatting around the JSON.`;
    }

    const geminiParams: GeminiCallParams = {
        systemInstruction: personaText,
        prompt,
        modelId,
    };

    if (responseSchema) {
        geminiParams.responseSchema = responseSchema;
    }

    return await callGemini(geminiParams);
};
