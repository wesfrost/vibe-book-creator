
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

const buildMasterContext = (bookState: BookState, stepId: string): Content[] => {
    const stepConfig = bookCreationWorkflow.find(step => step.id === stepId);
    if (!stepConfig) return [];

    const bookStateForPrompt = { ...bookState };

    if (stepId === 'draft_chapter') {
        // For drafting, include the content of previously drafted chapters for context
        bookStateForPrompt.chapters = bookState.chapters.map((chapter, index) => {
            if (index < (bookState.draftingChapterIndex || 0)) {
                return chapter; // Include full chapter object for previous chapters
            }
            // For current and future chapters, just send the outline
            return { title: chapter.title, summary: chapter.summary, status: chapter.status };
        });
    } else {
        // For all other steps, only send the outline to save tokens
        // @ts-ignore
        bookStateForPrompt.chapters = bookState.chapters.map(({ title, summary, status }) => ({ title, summary, status }));
    }


    let prompt = `
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

    if (stepId === 'draft_chapter' && bookState.writingStyle) {
        prompt += `\n\n**Writing Style:** The writing style should be **${bookState.writingStyle}**.`
    }

    if (stepId === 'create_outline' && bookState.numberOfChapters) {
        prompt += `\n\n**Constraint:** The outline should be for a book with approximately **${bookState.numberOfChapters}** chapters.`
    }

    if (stepConfig.userActions.includes('select_option')) {
        prompt += `\n\n**Golden Rule:** Your primary goal is to provide researched, best selling, actionable, structured 'options' for the user to select. Always present the user with choices.`;
    }

    if (stepConfig.output.schema && stepConfig.output.schema.type === Type.OBJECT) {
        prompt += `\n\n**IMPORTANT:** Your response MUST be a single JSON object that strictly adheres to the provided schema. Do not add any extra text, commentary, or markdown formatting around the JSON.`;
    }
    
    return [{ role: "user", parts: [{ text: prompt }] }];
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

    const masterContext = buildMasterContext(bookState, stepId);
    
    // Filter out system messages and convert to the format Gemini expects
    const chatHistory: Content[] = history
        .filter(msg => !msg.isSystem)
        .map(msg => ({
            role: msg.sender === 'jim' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        })).slice(-10);

    const contents: Content[] = [...masterContext, ...chatHistory];

    const geminiParams: GeminiCallParams = {
        systemInstruction: personaMap[stepConfig.persona || 'ORCHESTRATOR'],
        contents: contents,
        modelId,
    };

    if (stepConfig.output.schema) {
        geminiParams.responseSchema = stepConfig.output.schema as Schema;
    }

    return await callGemini(geminiParams);
};
