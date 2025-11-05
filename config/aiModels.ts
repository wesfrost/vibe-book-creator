
export interface AIModel {
    id: string; 
    displayName: string;
    description: string;
    active: boolean;
}

// Sticking to the most compatible model name for the v1beta API provided by the importmap.
export const AI_MODELS: AIModel[] = [
    {
        id: "gemini-pro",
        displayName: "Gemini Pro",
        description: "A powerful and reliable model for a wide range of tasks.",
        active: true,
    }
];

export const DEFAULT_AI_MODEL_ID: string = "gemini-pro";
