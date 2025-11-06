
export interface ChatMessage {
    id: string;
    sender: 'user' | 'jim';
    text: string;
    options?: Option[];
    bestOption?: number;
}

export interface Option {
    title: string;
    description: string;
    rationale: string;
}

export interface ProgressStep {
    id: string;
    name: string;
    completed: boolean;
}

export interface ProgressPhase {
    name: string;
    steps: ProgressStep[];
}

export interface Chapter {
    title: string;
    content: string;
    status: 'outlined' | 'drafted' | 'reviewed';
}

export interface BookState {
    format?: string;
    genre?: string;
    coreIdea?: string;
    vibe?: string;
    audience?: string;
    title?: string;
    storyline?: string;
    characters?: string;
    blurb?: string;
    keywords?: string;
    globalOutline?: any[]; // Consider defining a more specific type
    chapters: Chapter[];
}
