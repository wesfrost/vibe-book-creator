
export interface Option {
    title: string;
    description?: string;
    rationale?: string;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'jim';
    text: string;
    options?: Option[];
    bestOption?: number;
    isAnalysis?: boolean;
    isAuto?: boolean;
    isSystem?: boolean; // Add system message flag
    postChapterMessage?: string;
    chapterTitle?: string;
    chapterContent?: string;
}

export interface ProgressStep {
    id?: string;
    name: string;
    completed: boolean;
}

export interface ProgressPhase {
    name: string;
    steps: ProgressStep[];
}

export interface Chapter {
    title: string;
    summary?: string; 
    content: string;
    status: 'outlined' | 'drafted' | 'reviewed';
}

export interface BookState {
    format?: string;
    genre?: string;
    title?: string;
    coreIdea?: string;
    vibe?: string;
    writingStyle?: string;
    audience?: string;
    storyline?: string;
    storylineRationale?: string;
    protagonist?: any;
    antagonist?: any;
    supportingCharacters?: any[];
    numberOfChapters?: number;
    globalOutline?: any[];
    chapters: Chapter[];
    marketing?: any;
    draftingChapterIndex?: number;
}
