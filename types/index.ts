
export interface Option {
    title: string;
    description: string;
    rationale?: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    parts: { text: string }[];
    isSystem?: boolean;
    options?: Option[];
    bestOption?: number;
    isAnalysis?: boolean;
    isAuto?: boolean;
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
    chapterNumber: number;
    title: string;
    summary?: string;
    content: string;
    status: 'outlined' | 'drafted' | 'edited' | 'reviewed';
}

export interface Suggestion {
    chapterNumber: number;
    originalText: string;
    proposedChange: string;
    rationale: string;
}

export interface BookState {
    format?: string;
    genre?: string;
    title?: string;
    coreIdea?: string;
    vibe?: string;
    audience?: string;
    storyline?: string;
    storylineRationale?: string;
    characters?: any;
    charactersRationale?: string;
    globalOutline?: any[];
    chapters: Chapter[];
    marketing?: any;
    editingChapterIndex?: number;
    finalReviewCompleted?: boolean;
    suggestions?: Suggestion[];
    coverOptions?: Option[];
    coverImages?: string[];
    coverImage?: string;
    kdpKeywords?: string[];
    bookCategories?: string[];
    blurb?: string;
}

export type MainView = 'progress' | 'editor' | 'dashboard' | 'outline' | 'manuscript' | 'cover';
