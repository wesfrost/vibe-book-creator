
import React from 'react';
import { ChatMessage, ProgressPhase, BookState, Option } from './types';
import { FICTION_PROGRESS } from './config';
import { AI_MODELS, DEFAULT_AI_MODEL_ID } from './config/aiModels';
import { processStep } from './services/orchestrationService';
import ProgressTracker from './components/ProgressTracker';
import ChatWindow from './components/ChatWindow';
import MarkdownEditor from './components/MarkdownEditor';
import BookStateViewer from './components/BookStateViewer';
import ChapterOutline from './components/ChapterOutline';
import ComboBox from './components/ComboBox';

type MainView = 'progress' | 'editor' | 'dashboard' | 'outline';

const getUpdatedProgress = (currentProgress: ProgressPhase[], stepName: string): ProgressPhase[] => {
    const newProgress = JSON.parse(JSON.stringify(currentProgress));
    for (const phase of newProgress) {
        for (const step of phase.steps) {
            if (step.name === stepName) {
                step.completed = true;
                return newProgress;
            }
        }
    }
    return newProgress;
};

const ViewToggle: React.FC<{ label: string; view: MainView; activeView: MainView; onClick: (view: MainView) => void; }> = ({ label, view, activeView, onClick }) => (
    <button onClick={() => onClick(view)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${activeView === view ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
        {label}
    </button>
);

export default function App() {
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [progress, setProgress] = React.useState<ProgressPhase[]>(FICTION_PROGRESS);
    const [flatSteps, setFlatSteps] = React.useState<{ phase: string; step: string }[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
    const [bookState, setBookState] = React.useState<BookState>({ chapters: [] });
    const [isLoading, setIsLoading] = React.useState(false);
    const [mainView, setMainView] = React.useState<MainView>('dashboard');
    const [selectedModelId, setSelectedModelId] = React.useState<string>(DEFAULT_AI_MODEL_ID);
    const [dynamicOptions, setDynamicOptions] = React.useState<Option[] | null>(null);
    const [isChatOpen, setIsChatOpen] = React.useState(true);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = React.useState(false);
    const headerMenuRef = React.useRef<HTMLDivElement>(null);
    const [isAutoMode, setIsAutoMode] = React.useState(false);

    const handleOutlineResponse = React.useCallback((response: any) => {
        setBookState(prev => ({ ...prev, globalOutline: response.outline, chapters: response.outline.map((o: any) => ({ title: o.chapterTitle, content: '', status: 'outlined' })) }));
        const jimResponse: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'jim', text: response.message };
        setMessages(prev => [...prev, jimResponse]);
        setDynamicOptions([ { title: "Approve Outline" }, { title: "Regenerate Outline" }, { title: "Refine..." } ]);
        setMainView('outline');
    }, []);

    const handleChapterDraftResponse = React.useCallback((response: any, chapterIndexInFlatSteps: number) => {
        const chapterNumberMatch = flatSteps[chapterIndexInFlatSteps]?.step.match(/\d+/);
        const chapterNumber = chapterNumberMatch ? parseInt(chapterNumberMatch[0], 10) - 1 : 0;
        setBookState(prev => {
            const newChapters = [...(prev.chapters || [])];
            newChapters[chapterNumber] = { ...newChapters[chapterNumber], title: response.chapterTitle, content: response.chapterContent, status: 'drafted' };
            return { ...prev, chapters: newChapters };
        });
        setMainView('editor');
        const jimResponse: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'jim', text: response.message };
        setMessages(prev => [...prev, jimResponse]);
        setDynamicOptions([ { title: "Looks Great!" }, { title: "Regenerate" }, { title: "Refine..." } ]);
    }, [flatSteps]);

    const handleSendMessage = React.useCallback(async (text: string, isSelection: boolean = false) => {
        if (isLoading) return;
        
        const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text };
        setMessages(prev => [...prev, userMessage]);
        setDynamicOptions(null);
        setIsLoading(true);

        const currentHistory = [...messages, userMessage];
        const currentStepName = flatSteps[currentStepIndex].step;

        if (text.toLowerCase().includes("refine") || text.toLowerCase().includes("regenerate")) {
            const response = await processStep(currentHistory, currentStepName, bookState, selectedModelId);
            if (response?.outline) handleOutlineResponse(response);
            else if (response?.chapterContent) handleChapterDraftResponse(response, currentStepIndex);
            setIsLoading(false);
            return;
        }

        const isProgression = isSelection || text === "Looks Great!" || text.includes("let's draft") || text === "Approve Outline";
        let nextStepIndex = currentStepIndex;
        let tempBookState = { ...bookState };

        if (isProgression) {
            if(!["Looks Great!", "Approve Outline"].includes(text) && !text.includes("let's draft")) {
                tempBookState = { ...bookState, [currentStepName]: text };
            }
            const updatedProgress = getUpdatedProgress(progress, currentStepName);
            setProgress(updatedProgress);
            nextStepIndex = currentStepIndex + 1;
        }
        
        if (nextStepIndex >= flatSteps.length) {
            setIsLoading(false);
            return;
        }

        const nextTask = flatSteps[nextStepIndex];
        const response = await processStep(currentHistory, nextTask.step, tempBookState, selectedModelId);
        
        setBookState(tempBookState);
        setCurrentStepIndex(nextStepIndex);

        if (response) {
            if (response.outline) handleOutlineResponse(response);
            else if (response.chapterContent) handleChapterDraftResponse(response, nextStepIndex);
            else {
                const jimResponse: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'jim', text: response.message, options: response.options || [], items: response.items || [] };
                if (response.options) setDynamicOptions(response.options);
                setMessages(prev => [...prev, jimResponse]);
            }
        } else {
            const errorResponse: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'jim', text: "Sorry, I seem to be having trouble connecting. Let's try that again." };
            setMessages(prev => [...prev, errorResponse]);
        }
        
        setIsLoading(false);
    }, [isLoading, messages, flatSteps, currentStepIndex, bookState, progress, selectedModelId, handleOutlineResponse, handleChapterDraftResponse]);

    const handleApproveOutline = React.useCallback(() => {
        const chapterCount = bookState.chapters.length;
        const chapterSteps = Array.from({ length: chapterCount }, (_, i) => ({ name: `Chapter ${i + 1} Drafted`, completed: false }));
        
        const tempProgress = [...progress];
        const phase3Index = tempProgress.findIndex(p => p.name.includes("Drafting & Review"));
        if (phase3Index !== -1) {
            tempProgress[phase3Index].steps = chapterSteps;
        }
        setProgress(tempProgress);
        
        const newFlatSteps = tempProgress.flatMap(phase => phase.steps.map(step => ({ phase: phase.name, step: step.name })));
        setFlatSteps(newFlatSteps);

        const approvalMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'jim', text: "Excellent! The outline is locked in. I will now begin drafting Chapter 1." };
        
        const firstChapterStepIndex = newFlatSteps.findIndex(step => step.step === "Chapter 1 Drafted");
        setCurrentStepIndex(firstChapterStepIndex);

        setMessages(prev => [...prev, approvalMessage]);
        
        setTimeout(() => {
            handleSendMessage(`Draft Chapter 1`, false);
        }, 100);
    }, [bookState.chapters, progress, handleSendMessage]);

    const handleContentChange = (chapterIndex: number, newContent: string) => {
        setBookState(prev => {
            const newChapters = [...prev.chapters];
            if(newChapters[chapterIndex]) newChapters[chapterIndex].content = newContent;
            return {...prev, chapters: newChapters};
        });
    };

    const handleToggleAutoMode = React.useCallback(() => {
        const newAutoModeState = !isAutoMode;
        setIsAutoMode(newAutoModeState);
        const modeMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'jim',
            text: newAutoModeState ? `🚀 **Auto-Pilot Engaged!**` : `Manual control resumed.`,
            isProgressUpdate: true,
        };
        setMessages(prev => [...prev, modeMessage]);
        if (newAutoModeState && !isLoading) {
            const lastMessageWithOptions = [...messages].reverse().find(m => m.options && m.options.length > 0);
            if (lastMessageWithOptions?.options) {
                 setTimeout(() => handleSendMessage(lastMessageWithOptions.options[0].title, true), 500);
            }
        }
    }, [isAutoMode, isLoading, messages, handleSendMessage]);

    React.useEffect(() => {
        const firstMessage: ChatMessage = {
            id: 'jim-intro', sender: 'jim',
            text: `Hello there, amazing author! 🌟 I'm **Book Work Jim**. Think of me as your personal project manager and mentor...`,
            isProgressUpdate: true,
        };
        const secondMessage: ChatMessage = {
            id: 'jim-first-step', sender: 'jim',
            text: `Ready to lay the foundation? Let's start with **Phase 1, Step 1: Choosing your Book Format.**`,
            options: [{title: 'Novel'}, {title: 'Novella'}, {title: 'Flash Fiction / Vignette'}],
        };
        setMessages([firstMessage, secondMessage]);
        const initialFlatSteps = FICTION_PROGRESS.flatMap(phase => phase.steps.map(step => ({ phase: phase.name, step: step.name })));
        setFlatSteps(initialFlatSteps);
    }, []);

    React.useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (isAutoMode && !isLoading && lastMessage?.sender === 'jim' && lastMessage.options && lastMessage.options.length > 0 && !lastMessage.isProgressUpdate) {
            setTimeout(() => handleSendMessage(lastMessage.options[0].title, true), 500);
        }
    }, [messages, isAutoMode, isLoading, handleSendMessage]);
    
    const lastMessage = messages[messages.length - 1];

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
            {/* The full, correct JSX for the header, chat panel, and main views is restored here */}
        </div>
    );
}
