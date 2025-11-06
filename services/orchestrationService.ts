
import { callGemini } from './geminiService';
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
): Promise<any> => {

    // 1. Find the current step in our workflow
    const stepConfig = bookCreationWorkflow.find(step => step.id === stepId);

    if (!stepConfig) {
        console.error(`Unknown step ID: ${stepId}`);
        return { message: "I seem to have lost my place in the story... can we go back a step? 🤷" };
    }

    // 2. Get the persona, prompt, and response schema from the workflow config
    const persona = personaMap[stepConfig.persona];
    const responseSchema = stepConfig.output.schema;
    
    // 3. Construct the prompt
    const historyString = history.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n');
    let prompt = `
Here is the recent conversation history:
${historyString}

Here is the current state of the book we are writing:
${JSON.stringify(bookState, null, 2)}

The author's current task is: **${stepConfig.title}**

**Your Instructions:**
${stepConfig.prompt}
`;

    // Add the "Golden Rule" if the step requires it
    if (stepConfig.userActions.includes('select_option')) {
        const goldenRule = "Your primary goal is to provide actionable, structured 'options' for the user to select. If the user provides feedback, use it to refine and generate a *better* set of options for the same step. Always present the user with choices. You may also suggest a `bestOption` (the 0-indexed number of the option you recommend the most).";
        prompt += `\n\n**Golden Rule:** ${goldenRule}`;
    }

    // Explicitly ask for JSON in markdown fences if a schema is present.
    if (responseSchema && responseSchema.type === Type.OBJECT) {
        prompt += `\n\n**IMPORTANT:** Always wrap your JSON output in a markdown code block, like this: \`\`\`json { ... } \`\`\``;
    }

    // 4. Call the Gemini API
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
