
import { create } from 'zustand';
import { ChatMessage, ProgressPhase, BookState, Option } from '../types';
import { bookCreationWorkflow } from '../config/bookCreationWorkflow';

// --- Utility Functions (could be moved to a separate file if they grow) ---

type WorkflowStep = {
    id: string;
    title: string;
    phase: string;
};

const transformWorkflowToProgress = (workflow: WorkflowStep[]): ProgressPhase[] => {
    const phases: { [key: string]: ProgressPhase } = {};
    workflow.forEach(step => {
        if (!phases[step.phase]) {
            phases[step.phase] = { name: step.phase, steps: [] };
        }
        phases[step.phase].steps.push({ id: step.id, name: step.title, completed: false });
    });
    return Object.values(phases);
};

const getFlatSteps = (workflow: typeof bookCreationWorkflow) => workflow.map(step => ({ id: step.id, title: step.title }));

// --- Store Definition ---

interface BookStore {
    // State
    messages: ChatMessage[];
    progress: ProgressPhase[];
    flatSteps: { id: string, title: string }[];
    currentStepIndex: number;
    bookState: BookState;
    isLoading: boolean;
    dynamicOptions: Option[] | null;

    // Actions
    addMessage: (message: ChatMessage) => void;
    setProgress: (progress: ProgressPhase[]) => void;
    setCurrentStepIndex: (index: number) => void;
    setBookState: (bookState: BookState) => void;
    setIsLoading: (isLoading: boolean) => void;
    setDynamicOptions: (options: Option[] | null) => void;
    
    // Derived State (optional, but good practice)
    getCurrentStep: () => { id: string, title: string };

    // Complex Actions
    advanceStep: (stepId: string) => void;
}

export const useBookStore = create<BookStore>((set, get) => ({
    // --- Initial State ---
    messages: [],
    progress: transformWorkflowToProgress(bookCreationWorkflow),
    flatSteps: getFlatSteps(bookCreationWorkflow),
    currentStepIndex: 0,
    bookState: { chapters: [] },
    isLoading: false,
    dynamicOptions: null,

    // --- Actions ---
    addMessage: (message) => set(state => ({ messages: [...state.messages, message] })),
    setProgress: (progress) => set({ progress }),
    setCurrentStepIndex: (index) => set({ currentStepIndex: index }),
    setBookState: (bookState) => set({ bookState }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setDynamicOptions: (options) => set({ dynamicOptions: options }),
    
    // --- Derived State ---
    getCurrentStep: () => {
        const { flatSteps, currentStepIndex } = get();
        return flatSteps[currentStepIndex];
    },

    // --- Complex Actions ---
    advanceStep: (stepId: string) => {
        const { progress, currentStepIndex, flatSteps } = get();
        
        // Update progress completion
        const newProgress = progress.map(phase => ({
            ...phase,
            steps: phase.steps.map(step => step.id === stepId ? { ...step, completed: true } : step)
        }));
        
        // Advance to the next step if not at the end
        const nextStepIndex = currentStepIndex + 1;
        if (nextStepIndex < flatSteps.length) {
            set({ progress: newProgress, currentStepIndex: nextStepIndex });
        } else {
            set({ progress: newProgress }); // Just update progress if it's the last step
        }
    },
}));
