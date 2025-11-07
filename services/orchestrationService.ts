
import { GeminiResponse, handleApiError } from './geminiService';
import * as Personas from './personas';
import { bookCreationWorkflow } from '../config/bookCreationWorkflow';
import { BookState } from '../types';
import { Type, Chat } from "@google/genai";

const personaMap: { [key: string]: string } = {
    ORCHESTRATOR: Personas.ORCHESTRATOR_PERSONA,
    STRATEGIST: Personas.STRATEGIST_PERSONA,
    WRITER: Personas.WRITER_PERSONA,
    EDITOR: Personas.EDITOR_PERSONA,
    MARKETER: Personas.MARKETER_PERSONA,
};

const buildMasterContext = (bookState: BookState, stepId: string): string => {
    const stepConfig = bookCreationWorkflow.find(step => step.id === stepId);
    if (!stepConfig) return "";

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
    
    return prompt;
};

export const processUserMessage = async (
    chatSession: Chat,
    bookState: BookState,
    stepId: string,
    userInput: string
): Promise<GeminiResponse<any>> => {
    try {
        const masterContext = buildMasterContext(bookState, stepId);
        const fullPrompt = `${masterContext}\n\n# USER MESSAGE\n${userInput}`;
        
        const result = await chatSession.sendMessage(fullPrompt);
        
        if (!result.response) {
            return { success: false, error: "The AI did not provide a response. This might be due to safety filters or other issues." };
        }

        const rawResponse = result.response.text().trim();
        if (!rawResponse) {
            return { success: false, error: "Received an empty response from the AI." };
        }

        try {
            const parsedJson = JSON.parse(rawResponse);
            return { success: true, data: parsedJson };
        } catch (parseError: unknown) {
            return { 
                success: false, 
                error: `Failed to parse JSON. Error: ${(parseError instanceof Error) ? parseError.message : String(parseError)}`,
                rawResponse: rawResponse 
            };
        }
    } catch (error) {
        return handleApiError(error);
    }
};
