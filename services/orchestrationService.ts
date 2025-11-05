
import { Type } from "@google/genai";
import { BookState, ChatMessage, BrainstormingIdea } from "../types";
import { callGemini } from './geminiService';
import { getMockResponseForStep, getMockBrainstormIdeas, getMockAnalysis } from './mockResponses';
import { ORCHESTRATOR_PERSONA } from './personas/orchestrator';
import { STRATEGIST_PERSONA } from './personas/strategist';
import { WRITER_PERSONA } from './personas/writer';
import { EDITOR_PERSONA } from './personas/editor';
import { MARKETER_PERSONA } from './personas/marketer';

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
                    title: { type: Type.STRING, description: `The title of the ${itemDescription}.` },
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
    type: Type.OBJECT, properties: { message: { type: Type.STRING, description: "The AI's full, conversational response to the user, or the fully generated text (like an outline), formatted in Markdown." } }, required: ["message"],
});
const getResponseSchemaForChapterIdea = () => ({
    type: Type.OBJECT,
    properties: {
        message: { type: Type.STRING, description: "The AI's conversational intro before presenting the chapter idea." },
        chapterTitle: { type: Type.STRING, description: "The proposed title for the chapter (e.g., 'Chapter 1: The Echo')." },
        chapterIdea: { type: Type.STRING, description: "A concise, compelling summary of the chapter's purpose, key events, and character moments." }
    },
    required: ["message", "chapterTitle", "chapterIdea"],
});
const getResponseSchemaForChapter = () => ({
    type: Type.OBJECT,
    properties: {
        postChapterMessage: { type: Type.STRING, description: "The AI's conversational message AFTER providing the chapter text, to tee up the next action." },
        chapterTitle: { type: Type.STRING, description: "The title of the generated chapter (e.g., 'Chapter 1: The Echo')." },
        chapterContent: { type: Type.STRING, description: "The full text of the chapter, formatted in Markdown." }
    },
    required: ["postChapterMessage", "chapterTitle", "chapterContent"],
});
const getResponseSchemaForOutline = () => ({
    type: Type.OBJECT,
    properties: {
        message: { type: Type.STRING, description: "The AI's conversational intro before presenting the detailed outline." },
        outlineContent: { type: Type.STRING, description: "The full plot outline, formatted in Markdown." },
        options: {
            type: Type.ARRAY, description: "Options for the user to approve the outline.",
            items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, rationale: { type: Type.STRING } }, required: ['title', 'rationale'] }
        }
    },
    required: ["message", "outlineContent", "options"],
});
const getResponseSchemaForCelebration = () => ({
    type: Type.OBJECT,
    properties: {
        message: { type: Type.STRING, description: "A warm, celebratory message congratulating the author on completing their manuscript." },
        options: {
            type: Type.ARRAY,
            description: "Options to guide the user to the final polishing and export phase.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    rationale: { type: Type.STRING }
                },
                required: ['title', 'rationale']
            }
        }
    },
    required: ["message", "options"],
});

// --- Golden Rule Prompt Enhancer ---
const applyGoldenRule = (prompt: string): string => {
    const goldenRule = "Crucially, you must always end your response with a clear, direct question to guide the user to the next logical step.";
    return `${prompt}\n\n**Golden Rule:** ${goldenRule}`;
};

// --- Prompt Construction ---
function constructPrompt(history: ChatMessage[], currentStep: string, bookState: BookState): string {
    const historyString = history.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n');
    let taskInstruction = `Based on all the above, perform your expert function for the author's current task.`;

    if (currentStep === "Genre Defined") {
        taskInstruction = `Research and return a list of the top 10 bestselling book genres on Amazon KDP, ordered from most to least popular. Present this to the user and explain why choosing a popular genre is a key strategic decision for a new author.`
    } else if (currentStep === "KDP Keywords Researched" || currentStep === "Book Categories Selected") {
        taskInstruction = `Based on the book's details, perform in-depth research and provide the requested marketing materials. Explain the 'why' behind your recommendations.`
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
export const processStep = async (history: ChatMessage[], currentStep: string, bookState: BookState, isDevMode: boolean = false): Promise<any> => {
    if (isDevMode) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return getMockResponseForStep(currentStep);
    }

    let persona = ORCHESTRATOR_PERSONA;
    let responseSchema;
    let prompt = constructPrompt(history, currentStep, bookState);

    const strategistSteps = [
        "Genre Defined", "Core Idea Locked In", "Vibe Defined", "Target Audience Identified",
        "Global Outline Approved", "Key Characters Defined", "Pacing Strategy Agreed",
        "Topic & Niche Defined", "Core Problem Identified", "The 'Promise' Defined", "Target Reader Profiled",
        "Structural Outline Approved", "Key Concepts & Takeaways Defined", "Engagement Strategy Agreed",
        "Central Theme Defined", "Core Narrative Arc Locked In", "Key Life Periods Identified",
        "Detailed Outline Approved", "Key Figures Defined", "Scene Outline Approved"
    ];

    const writerSteps = ["Generate idea for", "Draft Chapter", "Draft Module"];
    
    const marketerSteps = ["KDP Keywords Researched", "Book Categories Selected", "Compelling Blurb Drafted"];
    
    const orchestratorSteps = ["Number of Chapters Defined", "Number of Modules Defined", "Final Manuscript Review", "Revision & Final Polish Complete"];

    if (strategistSteps.includes(currentStep)) {
        persona = STRATEGIST_PERSONA;
        if (currentStep === "Genre Defined") {
            responseSchema = getResponseSchemaForList('genres');
        }
        else if (currentStep.includes("Outline Approved")) {
            responseSchema = getResponseSchemaForOutline();
        } else if (currentStep.includes("Key Characters") || currentStep.includes("Key Figures")) {
             responseSchema = getResponseSchemaForList('characters or figures');
        } else {
            responseSchema = getResponseSchemaForOptions('strategic option');
        }
    } else if (writerSteps.some(s => currentStep.startsWith(s))) {
        persona = WRITER_PERSONA;
        if (currentStep.startsWith('Generate idea for')) {
            responseSchema = getResponseSchemaForChapterIdea();
        } else {
            responseSchema = getResponseSchemaForChapter();
        }
    } else if (marketerSteps.includes(currentStep)) {
        persona = MARKETER_PERSONA;
        if (currentStep.includes("Keywords") || currentStep.includes("Categories")) {
            responseSchema = getResponseSchemaForList('marketing items');
        } else {
             responseSchema = getResponseSchemaForText();
        }
    } else { 
        persona = ORCHESTRATOR_PERSONA;
         if (currentStep === "Final Manuscript Review") {
             responseSchema = getResponseSchemaForOptions('review option');
         } else if (currentStep === "Full Book Compiled") {
            responseSchema = getResponseSchemaForCelebration();
         } else {
            responseSchema = getResponseSchemaForText();
         }
    }

    return callGemini({ systemInstruction: persona, prompt, responseSchema });
};

export const analyzeChapter = async (chapterContent: string, bookState: BookState, isDevMode: boolean = false): Promise<string> => {
     if (isDevMode) {
        await new Promise(resolve => setTimeout(resolve, 200));
        return getMockAnalysis();
    }
    const prompt = `
        The book's genre is "${bookState['Genre Defined'] || bookState['Topic & Niche Defined']}" and its core vibe is "${bookState['Vibe Defined'] || bookState['The \'Promise\' Defined']}".
        Please analyze the following draft:
        ---
        ${chapterContent}
        ---
        Provide a concise "Bestseller Analysis" in Markdown format. Frame it as helpful, educational advice. For each point, explain the 'why' behind it.
        1.  **Tone & Style:** Does the writing style match the genre and intended vibe? Explain *why* this is important.
        2.  **Pacing:** How is the pacing? Explain *how* pacing affects reader engagement.
        3.  **Hooks:** Analyze the opening and closing hooks. Explain *why* a strong hook is critical.
    `;
    const response = await callGemini({
        systemInstruction: EDITOR_PERSONA,
        prompt: applyGoldenRule(prompt),
        responseSchema: getResponseSchemaForText()
    });
    return response.message || "I'm sorry, my analytical engine seems to be on a coffee break.";
};

export const brainstormIdeas = async (currentStep: string, bookState: BookState, isDevMode: boolean = false): Promise<BrainstormingIdea[]> => {
    if (isDevMode) {
        await new Promise(resolve => setTimeout(resolve, 150));
        return getMockBrainstormIdeas();
    }
    try {
        const prompt = `
            The author is a beginner, currently working on the task: "${currentStep}".
            Their book concept so far is: ${JSON.stringify(bookState, null, 2)}.
            Based on current New York Times best-seller trends for this genre/format, generate 3 concise and creative brainstorming ideas.
            For each idea, provide a brief 'rationale' that explains the market insight or creative trend behind it.
        `;
        const response = await callGemini({
            systemInstruction: STRATEGIST_PERSONA,
            prompt: applyGoldenRule(prompt),
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    ideas: {
                        type: Type.ARRAY,
                        description: "An array of 3 brainstorming ideas, each with a rationale.",
                        items: {
                            type: Type.OBJECT,
                            properties: { idea: { type: Type.STRING }, rationale: { type: Type.STRING } },
                            required: ["idea", "rationale"]
                        }
                    }
                },
                required: ["ideas"],
            },
            temperature: 0.8
        });
        return response.ideas || [];
    } catch (error) {
        console.error("Error in brainstormIdeas:", error);
        return [];
    }
};
