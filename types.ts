export interface ChatMessage {
  id: string;
  sender: 'user' | 'jim';
  text: string;
  options?: { title: string; description?: string; rationale?: string }[];
  items?: string[];
  chapterIdea?: { title: string; idea: string };
  isChapter?: boolean;
  isProgressUpdate?: boolean;
  isAuto?: boolean;
  isAnalysis?: boolean;
}

export interface ProgressItem {
  name: string;
  completed: boolean;
  suggestions?: string[];
}

export interface ProgressPhase {
  name: string;
  steps: ProgressItem[];
}

export type BookState = {
  [key: string]: any;
  workingTitle?: string;
  title?: string;
  chapterCount?: number;
  chapters?: { title: string; idea?: string; content: string }[];
  globalOutline?: string;
  kdpKeywords?: string[];
  bookCategories?: string[];
  blurb?: string;
  coverImageUrl?: string;
};

export interface BrainstormingIdea {
  idea: string;
  rationale: string;
}
