
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

    const conversationalHistory = history
        .filter(msg => !msg.isSystem)
        .map(msg => ({
            role: msg.role,
            message: msg.parts.map(p => p.text || '').join('\n')
        })).slice(-10);

    const fullContextObject: any = {
        bookSpec: bookState,
        chatHistory: conversationalHistory,
        currentTask: {
            title: stepConfig.title,
            instructions: stepConfig.prompt
        }
    };
    
    const lastMessage = history[history.length - 1];
    const isRefinement = lastMessage && lastMessage.role === 'user' && !lastMessage.isSystem;

    if (isRefinement) {
        const userRefinementRequest = lastMessage.parts[0].text || '';
        fullContextObject.userRefinement = userRefinementRequest;
        
        if (stepId === 'draft_chapter') {
            fullContextObject.currentTask.instructions += `\n\nThe user has requested a change to the current chapter draft. Here is their request: "${userRefinementRequest}". Please rewrite the entire chapter, incorporating this feedback, and return it in the 'chapterContent' field of the JSON response. You must still return the correct 'chapterNumber'.`;
        } else if (stepId === 'create_outline') {
            fullContextObject.currentTask.instructions += `\n\nThe user has requested a change to the current chapter outline. Here is their request: "${userRefinementRequest}". Please regenerate the entire outline, incorporating this feedback, and return it in the 'globalOutline' field of the JSON response.`;
        } else {
            fullContextObject.currentTask.instructions += `\n\nThe user has provided the following refinement: "${userRefinementRequest}". Please generate a new set of options based on this feedback and provide a personal response back to the user in the 'refinementMessage' field of the JSON response.`;
        }
    }

    if (stepId === 'draft_chapter' && bookState.draftingChapterIndex !== undefined) {
        const chapterToDraft = bookState.chapters[bookState.draftingChapterIndex];
        if (chapterToDraft) {
            fullContextObject.currentTask.instructions += `\n\n**Specifically, you are to draft Chapter ${bookState.draftingChapterIndex + 1}: ${chapterToDraft.title}**`;
        }
    }

    let promptForAI = `You are an AI assistant helping an author create a book. Here is the full context for your current task. Review the entire object carefully before responding.\n\n${JSON.stringify(fullContextObject, null, 2)}`;

    if (stepConfig.userActions.includes('select_option')) {
        promptForAI += `\n\n**Golden Rule:** Your primary goal is to provide researched, best selling, actionable, structured 'options' for the user to select. Always present the user with choices.`;
    }
    if (stepConfig.output.schema && stepConfig.output.schema.type === Type.OBJECT) {
        promptForAI += `\n\n**IMPORTANT:** Your response MUST be a single JSON object that strictly adheres to the provided schema. Do not add any extra text, commentary, or markdown formatting around the JSON.`;
    }

    const contents: Content[] = [{ role: "user", parts: [{ text: promptForAI }] }];

    const geminiParams: GeminiCallParams = {
        systemInstruction: personaMap[stepConfig.persona || 'ORCHESTRATOR'],
        contents: contents,
        modelId,
        temperature: stepConfig.temperature
    };

    if (stepConfig.output.schema) {
        geminiParams.responseSchema = stepConfig.output.schema as Schema;
    }

    return await callGemini(geminiParams);
};
