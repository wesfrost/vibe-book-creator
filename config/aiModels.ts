
export interface AIModel {
    id: string; 
    displayName: string;
    description: string;
    active: boolean;
}

// Using the stable, auto-updating alias for the latest Flash model to ensure future compatibility.
export const AI_MODELS: AIModel[] = [
    {
        id: "gemini-2.5-flash",
        displayName: "Gemini 2.5 Flash",
        description: "The latest, most powerful and reliable model for a wide range of tasks.",
        active: true,
    },
    {
        id: "gemini-2.5-flash-lite",
        displayName: "Gemini 2.5 Flash Lite",
        description: "A lighter, faster version for quicker responses.",
        active: true,
    }
];

export const DEFAULT_AI_MODEL_ID: string = "gemini-2.5-flash-lite";
