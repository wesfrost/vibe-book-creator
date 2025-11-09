
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
    dynamicOptions: Option[] | null;

    addMessage: (message: ChatMessage) => void;
    setBookState: (bookState: BookState) => void;
    updateBookState: (updates: Partial<BookState>) => void;
    setIsLoading: (isLoading: boolean) => void;
    setDynamicOptions: (options: Option[] | null) => void;
    updateChapterStatus: (chapterIndex: number, status: Chapter['status']) => void;
    updateChapterContent: (chapterIndex: number, content: string) => void;
    
    getCurrentStep: () => { id: string, title: string };
    markStepAsComplete: (stepId: string) => void;
    advanceToNextStep: () => void;
    handleChapterEditing: () => void;
}

export const useBookStore = create<BookStore>((set, get) => {
    const transformWorkflowToProgress = (workflow: typeof bookCreationWorkflow, bookState: BookState): ProgressPhase[] => {
        const { flatSteps, currentStepIndex } = get();
        const currentStep = flatSteps[currentStepIndex];

        const phases: { [key: string]: ProgressPhase } = {};
        workflow.forEach(step => {
            if (!phases[step.phase]) {
                phases[step.phase] = { name: step.phase, steps: [] };
            }
            if (step.id === 'draft_chapter') {
                if (bookState.chapters.length > 0) {
                    bookState.chapters.forEach(chapter => {
                        phases[step.phase].steps.push({
                            id: `draft_chapter_${chapter.chapterNumber}`,
                            name: `Draft: ${chapter.title}`,
                            completed: chapter.status === 'drafted' || chapter.status === 'reviewed'
                        });
                    });
                }
            } else if (step.id === 'edit_chapter_loop') {
                if (bookState.chapters.length > 0) {
                    bookState.chapters.forEach(chapter => {
                        phases[step.phase].steps.push({
                            id: `edit_chapter_${chapter.chapterNumber}`,
                            name: `Edit: ${chapter.title}`,
                            completed: chapter.status === 'reviewed'
                        });
                    });
                }
            } else {
                const isCompleted = currentStep ? currentStep.id === step.id : false;
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
            lastCompletedActionId: undefined,
        },
        isLoading: false,
        dynamicOptions: null,

        // --- Actions ---
        addMessage: (message) => set(state => ({ messages: [...state.messages, message] })),
        setBookState: (bookState) => {
            set(state => ({
                bookState,
                progress: transformWorkflowToProgress(bookCreationWorkflow, bookState)
            }));
        },
        updateBookState: (updates) => {
            set(state => {
                const newBookState = { ...state.bookState, ...updates };
                return {
                    bookState: newBookState,
                    progress: transformWorkflowToProgress(bookCreationWorkflow, newBookState)
                };
            });
        },
        setIsLoading: (isLoading) => set({ isLoading }),
        setDynamicOptions: (options) => set({ dynamicOptions: options }),
        updateChapterStatus: (chapterIndex, status) => {
            const { bookState } = get();
            const newChapters = [...bookState.chapters];
            if (newChapters[chapterIndex]) {
                newChapters[chapterIndex].status = status;
                set(state => ({
                    bookState: { ...bookState, chapters: newChapters },
                    progress: transformWorkflowToProgress(bookCreationWorkflow, { ...bookState, chapters: newChapters })
                }));
            }
        },
        updateChapterContent: (chapterIndex, content) => {
            const { bookState } = get();
            const newChapters = [...bookState.chapters];
            if (newChapters[chapterIndex]) {
                newChapters[chapterIndex].content = content;
                set(state => ({
                    bookState: { ...bookState, chapters: newChapters }
                }));
            }
        },
        
        // --- Derived State ---
        getCurrentStep: () => {
            const { flatSteps, currentStepIndex } = get();
            return flatSteps[currentStepIndex];
        },

        // --- Complex Actions ---
        markStepAsComplete: (stepId) => {
            set(state => ({
                progress: state.progress.map(phase => ({
                    ...phase,
                    steps: phase.steps.map(step =>
                        step.id === stepId ? { ...step, completed: true } : step
                    )
                }))
            }));
        },

        advanceToNextStep: () => {
            const { flatSteps, currentStepIndex } = get();
            const nextStepIndex = currentStepIndex + 1;
            if (nextStepIndex < flatSteps.length) {
                set({ currentStepIndex: nextStepIndex });
            }
        },

        handleChapterEditing: () => {
            const { bookState, advanceToNextStep, updateChapterStatus } = get();
            const { editingChapterIndex, chapters } = bookState;

            if (editingChapterIndex !== undefined) {
                updateChapterStatus(editingChapterIndex, 'reviewed');
                const nextChapterToEditIndex = chapters.findIndex(chapter => chapter.status === 'drafted');

                if (nextChapterToEditIndex !== -1) {
                    set({ bookState: { ...bookState, editingChapterIndex: nextChapterToEditIndex } });
                } else {
                    advanceToNextStep();
                }
            }
        },
    }
});
