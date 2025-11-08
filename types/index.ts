
import { Part } from "@google/genai";

export interface Option {
    title: string;
    description?: string;
    rationale?: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    parts: Part[];
    options?: Option[];
    bestOption?: number;
    isAnalysis?: boolean;
    isAuto?: boolean;
    isSystem?: boolean; // This remains for our internal logic
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
    audience?: string;
    storyline?: string;
    storylineRationale?: string;
    characters?: any;
    charactersRationale?: string;
    globalOutline?: any[];
    chapters: Chapter[];
    marketing?: any;
    draftingChapterIndex?: number;
}
