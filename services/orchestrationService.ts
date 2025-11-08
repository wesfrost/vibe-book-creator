
import { callGemini, GeminiResponse, GeminiCallParams } from './geminiService';
import * as Personas from './personas';
import { bookCreationWorkflow } from '../config/bookCreationWorkflow';
import { ChatMessage, BookState } from '../types';
import { Type, Content, Schema } from "@google/genai";

const personaMap: { [key: string]: string } = {
    ORCHESTRATOR: Personas.ORCHESTRATOR_PERSONA,
    STRATEGIST: Personas.STRATEGIST_PERSONA,
    WRITER: Personas.WRITER_PERSONA,
    EDITOR: Personas.EDITOR_PERSONA,
    MARKETER: Personas.MARKETER_PERSONA,
};

export const processStep = async (
    history: ChatMessage[],
    stepId: string,
    bookState: BookState,
    modelId: string
): Promise<GeminiResponse<any>> => {
    const stepConfig = bookCreationWorkflow.find(step => step.id === stepId);
    if (!stepConfig) {
        return { success: false, error: "I seem to have lost my place in the story... can we go back a step? 🤷" };
    }

    const bookStateForPrompt = { ...bookState };
    // @ts-ignore
    bookStateForPrompt.chapters = bookState.chapters.map(({ title, summary, status }) => ({ title, summary, status }));

    let prompt = `
# MASTER CONTEXT
## Current State of the Book
${JSON.stringify(bookStateForPrompt, null, 2)}

## Author's Current Task: ${stepConfig.title}
**Your Instructions:** ${stepConfig.prompt}
`;

    if (stepId === 'draft_chapter' && bookState.draftingChapterIndex !== undefined) {
        const chapterToDraft = bookState.chapters[bookState.draftingChapterIndex];
        if (chapterToDraft) {
            prompt += `\n\n**Specifically, you are to draft Chapter ${bookState.draftingChapterIndex + 1}: ${chapterToDraft.title}**`;
        }
    }

    if (stepConfig.userActions.includes('select_option')) {
        prompt += `\n\n**Golden Rule:** Your primary goal is to provide researched, best selling, actionable, structured 'options' for the user to select. Always present the user with choices.`;
    }

    if (stepConfig.output.schema && stepConfig.output.schema.type === Type.OBJECT) {
        prompt += `\n\n**IMPORTANT:** Your response MUST be a single JSON object that strictly adheres to the provided schema. Do not add any extra text, commentary, or markdown formatting around the JSON.`;
    }

    const masterContext: Content = { role: "user", parts: [{ text: prompt }] };
    
    const chatHistory: Content[] = history
        .map(msg => ({
            role: msg.role,
            parts: msg.parts
        })).slice(-10);

    const contents: Content[] = [masterContext, ...chatHistory];

    const geminiParams: GeminiCallParams = {
        systemInstruction: personaMap[stepConfig.persona || 'ORCHESTRATOR'],
        contents: contents,
        modelId,
        temperature: stepConfig.temperature // Pass the temperature from the workflow
    };

    if (stepConfig.output.schema) {
        geminiParams.responseSchema = stepConfig.output.schema as Schema;
    }

    return await callGemini(geminiParams);
};
