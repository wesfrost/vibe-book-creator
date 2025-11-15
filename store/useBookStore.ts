
import { create } from 'zustand';
import { ChatMessage, ProgressPhase, BookState, Option, Chapter } from '../types';
import { bookCreationWorkflow } from '../config/bookCreationWorkflow';

// --- Utility Functions ---

const getFlatSteps = (workflow: typeof bookCreationWorkflow) => workflow.map(step => ({ id: step.id, title: step.title }));

// --- Store Definition ---

interface BookStore {
    messages: ChatMessage[];
    progress: ProgressPhase[];
    flatSteps: { id: string, title: string }[];
    currentStepIndex: number;
    bookState: BookState;
    isLoading: boolean;

    addMessage: (message: ChatMessage) => void;
    setBookState: (bookState: BookState) => void;
    updateBookState: (updates: Partial<BookState>) => void;
    setIsLoading: (isLoading: boolean) => void;
    
    updateChapterDetails: (chapterIndex: number, details: Partial<Chapter>) => void;
    
    getCurrentStep: () => { id: string, title: string };
    advanceToNextStep: () => void;
    handleChapterEditing: () => void;
}

export const useBookStore = create<BookStore>((set, get) => {
    const transformWorkflowToProgress = (workflow: typeof bookCreationWorkflow, bookState: BookState, currentStepIndex: number, flatSteps: { id: string, title: string }[]): ProgressPhase[] => {
        const phases: { [key: string]: ProgressPhase } = {};
        const currentStepId = flatSteps[currentStepIndex].id;
    
        workflow.forEach(step => {
            if (!phases[step.phase]) {
                phases[step.phase] = { name: step.phase, steps: [] };
            }
    
            const stepIndex = flatSteps.findIndex(s => s.id === step.id);
            const isCompleted = stepIndex < currentStepIndex;
    
            if (step.id === 'draft_chapter') {
                if (bookState.chapters.length > 0) {
                    bookState.chapters.forEach(chapter => {
                        phases[step.phase].steps.push({
                            id: `draft_chapter_${chapter.chapterNumber}`,
                            name: `Draft: ${chapter.title}`,
                            completed: chapter.status === 'drafted' || chapter.status === 'edited' || chapter.status === 'reviewed'
                        });
                    });
                }
            } else if (step.id === 'edit_chapter_loop') {
                if (bookState.chapters.length > 0) {
                    bookState.chapters.forEach(chapter => {
                        phases[step.phase].steps.push({
                            id: `edit_chapter_${chapter.chapterNumber}`,
                            name: `Edit: ${chapter.title}`,
                            completed: chapter.status === 'edited' || chapter.status === 'reviewed'
                        });
                    });
                }
            } else if (step.id === 'generate_cover_images') {
                phases[step.phase].steps.push({
                    id: step.id,
                    name: step.title,
                    completed: !!(isCompleted || (bookState.coverOptions && bookState.coverOptions.length > 0))
                });
            } else {
                phases[step.phase].steps.push({
                    id: step.id,
                    name: step.title,
                    completed: isCompleted
                });
            }
        });
        return Object.values(phases);
    };

    return {
        // --- Initial State ---
        messages: [],
        progress: [],
        flatSteps: getFlatSteps(bookCreationWorkflow),
        currentStepIndex: 0,
        bookState: { 
            chapters: [],
            finalReviewCompleted: false,
        },
        isLoading: false,

        // --- Actions ---
        addMessage: (message) => set(state => ({ messages: [...state.messages, message] })),
        setBookState: (bookState) => {
            set(state => ({
                bookState,
                progress: transformWorkflowToProgress(bookCreationWorkflow, bookState, state.currentStepIndex, state.flatSteps)
            }));
        },
        updateBookState: (updates) => {
            set(state => {
                const newBookState = { ...state.bookState, ...updates };
                return {
                    bookState: newBookState,
                    progress: transformWorkflowToProgress(bookCreationWorkflow, newBookState, state.currentStepIndex, state.flatSteps)
                };
            });
        },
        setIsLoading: (isLoading) => set({ isLoading }),
        updateChapterDetails: (chapterIndex, details) => {
            set(state => {
                const newChapters = [...state.bookState.chapters];
                if (newChapters[chapterIndex]) {
                    newChapters[chapterIndex] = { ...newChapters[chapterIndex], ...details };
                }
                const newBookState = { ...state.bookState, chapters: newChapters };
                return {
                    bookState: newBookState,
                    progress: transformWorkflowToProgress(bookCreationWorkflow, newBookState, state.currentStepIndex, state.flatSteps)
                };
            });
        },
        
        // --- Derived State ---
        getCurrentStep: () => {
            const { flatSteps, currentStepIndex } = get();
            return flatSteps[currentStepIndex];
        },

        // --- Complex Actions ---
        advanceToNextStep: () => {
            set(state => {
                const nextStepIndex = state.currentStepIndex + 1;
                if (nextStepIndex < state.flatSteps.length) {
                    const newBookState = { ...state.bookState };
                    const newProgress = transformWorkflowToProgress(bookCreationWorkflow, newBookState, nextStepIndex, state.flatSteps);
                    return { currentStepIndex: nextStepIndex, progress: newProgress };
                }
                return state;
            });
        },

        handleChapterEditing: () => {
            set(state => {
                const { editingChapterIndex, chapters } = state.bookState;
                if (editingChapterIndex === undefined) return state;
        
                const newChapters = chapters.map((chapter, index) => {
                    if (index === editingChapterIndex) {
                        return { ...chapter, status: 'reviewed' as const };
                    }
                    return chapter;
                });
        
                const nextChapterToEditIndex = newChapters.findIndex(chapter => chapter.status === 'drafted');
                
                const newBookState = {
                    ...state.bookState,
                    chapters: newChapters,
                    editingChapterIndex: nextChapterToEditIndex !== -1 ? nextChapterToEditIndex : undefined,
                };
                
                return {
                    ...state,
                    bookState: newBookState,
                    progress: transformWorkflowToProgress(bookCreationWorkflow, newBookState, state.currentStepIndex, state.flatSteps)
                };
            });
        },
    }
});
