
import React from 'react';
import { ChatMessage, ProgressPhase, BookState, Option } from './types';
import { bookCreationWorkflow } from './config/bookCreationWorkflow'; // Use the new workflow
import { AI_MODELS, DEFAULT_AI_MODEL_ID } from './config/aiModels';
import { processStep } from './services/orchestrationService';
import ProgressTracker from './components/ProgressTracker';
import ChatWindow from './components/ChatWindow';
import MarkdownEditor from './components/MarkdownEditor';
import BookStateViewer from './components/BookStateViewer';
import ChapterOutline from './components/ChapterOutline';
import ComboBox from './components/ComboBox';

// --- Utility Functions to derive state from the workflow ---

// Transforms the workflow into the format needed by the ProgressTracker component
const transformWorkflowToProgress = (workflow: typeof bookCreationWorkflow): ProgressPhase[] => {
    // This is a simplified transformation. A more robust implementation could group steps by a 'phase' property in the workflow.
    return [
        {
            name: "Phase 1: Foundation & Strategy",
            steps: workflow.slice(0, 8).map(step => ({ name: step.title, completed: false, id: step.id }))
        },
        {
            name: "Phase 2: Outlining & Structure",
            steps: workflow.slice(8, 9).map(step => ({ name: step.title, completed: false, id: step.id }))
        },
        {
            name: "Phase 3: Drafting & Review",
            steps: workflow.slice(9, 10).map(step => ({ name: step.title, completed: false, id: step.id })) // Initially just the drafting step
        },
        {
            name: "Phase 4: Marketing & Publishing",
            steps: workflow.slice(10).map(step => ({ name: step.title, completed: false, id: step.id }))
        },
    ];
};

// Gets the initial flat list of steps from the workflow
const getFlatSteps = (workflow: typeof bookCreationWorkflow) => workflow.map(step => ({ id: step.id, title: step.title }));

// Updates the completion status of a step
const getUpdatedProgress = (currentProgress: ProgressPhase[], stepId: string): ProgressPhase[] => {
    return currentProgress.map(phase => ({
        ...phase,
        steps: phase.steps.map(step => step.id === stepId ? { ...step, completed: true } : step)
    }));
};


type MainView = 'progress' | 'editor' | 'dashboard' | 'outline';

const ViewToggle: React.FC<{ label: string; view: MainView; activeView: MainView; onClick: (view: MainView) => void; }> = ({ label, view, activeView, onClick }) => (
    <button onClick={() => onClick(view)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${activeView === view ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
        {label}
    </button>
);

export default function App() {
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [progress, setProgress] = React.useState<ProgressPhase[]>(() => transformWorkflowToProgress(bookCreationWorkflow));
    const [flatSteps, setFlatSteps] = React.useState(() => getFlatSteps(bookCreationWorkflow));
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

    // --- Response Handlers ---
    const handleGenericResponse = (response: any) => {
        const jimResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'jim',
            text: response.message,
            options: response.options || [],
            bestOption: response.bestOption,
        };
        if (response.options) {
            setDynamicOptions(response.options);
        }
        setMessages(prev => [...prev, jimResponse]);
    };
    
    const handleOutlineResponse = React.useCallback((response: any) => {
        const newBookState = {
            ...bookState,
            globalOutline: response.outline,
            chapters: response.outline.map((o: any) => ({ title: o.chapterTitle, content: '', status: 'outlined' }))
        };
        setBookState(newBookState);
        handleGenericResponse(response); // Show message and options
        setMainView('outline');
    }, [bookState]);

    const handleChapterDraftResponse = React.useCallback((response: any) => {
        // Find which chapter number this draft corresponds to
        const currentStep = flatSteps[currentStepIndex];
        const chapterMatch = currentStep.title.match(/Chapter (\d+)/);
        if (!chapterMatch) return; // Should not happen
        const chapterIndex = parseInt(chapterMatch[1], 10) - 1;

        const newBookState = { ...bookState };
        newBookState.chapters[chapterIndex] = {
            ...newBookState.chapters[chapterIndex],
            title: response.chapterTitle,
            content: response.chapterContent,
            status: 'drafted'
        };
        setBookState(newBookState);
        handleGenericResponse(response);
        setMainView('editor');
    }, [bookState, currentStepIndex, flatSteps]);
    
    // --- Core Action: Sending a Message --- 
    const handleSendMessage = React.useCallback(async (text: string, isSelection: boolean = false) => {
        if (isLoading) return;

        const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text };
        setMessages(prev => [...prev, userMessage]);
        setDynamicOptions(null);
        setIsLoading(true);

        const currentHistory = [...messages, userMessage];
        const currentStep = flatSteps[currentStepIndex];
        const stepConfig = bookCreationWorkflow.find(s => s.id === currentStep.id);

        // --- Determine if we are progressing to the next step ---
        const isProgression = isSelection || text === "Looks Great!" || text.toLowerCase().startsWith('approve');
        let nextStepIndex = currentStepIndex;
        let tempBookState = { ...bookState };

        if (isProgression) {
             // Update book state with the selection if the step expects it
            if (stepConfig?.output.type === 'options') {
                const key = stepConfig.output.key;
                tempBookState = { ...tempBookState, [key]: text };
            }
            setProgress(prev => getUpdatedProgress(prev, currentStep.id));
            nextStepIndex = currentStepIndex + 1;
        } 

        if (nextStepIndex >= flatSteps.length) {
            setIsLoading(false);
            // Handle end of workflow
            setMessages(prev => [...prev, {id: 'end', sender: 'jim', text: "And that's a wrap! We've completed the entire book creation process. Congratulations! 🎉"}]);
            return;
        }
        
        const nextStep = flatSteps[nextStepIndex];
        
        // --- Call the Orchestrator ---
        const response = await processStep(currentHistory, nextStep.id, tempBookState, selectedModelId);
        
        // --- Update State ---
        setBookState(tempBookState); // Commit the state change
        setCurrentStepIndex(nextStepIndex);
        
        // --- Handle the AI's response based on the step's output type ---
        const nextStepConfig = bookCreationWorkflow.find(s => s.id === nextStep.id);
        if (response) {
            switch (nextStepConfig?.output.type) {
                case 'outline':
                    handleOutlineResponse(response);
                    break;
                case 'chapter_draft':
                    handleChapterDraftResponse(response);
                    break;
                case 'options':
                case 'message':
                default:
                    handleGenericResponse(response);
                    break;
            }
        } else {
            const errorResponse: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'jim', text: "Sorry, I seem to be having trouble connecting. Let's try that again." };
            setMessages(prev => [...prev, errorResponse]);
        }
        
        setIsLoading(false);

    }, [isLoading, messages, flatSteps, currentStepIndex, bookState, selectedModelId, handleOutlineResponse, handleChapterDraftResponse]);

    // Other handlers (handleContentChange, handleToggleAutoMode, etc.) remain largely the same...
    const handleContentChange = React.useCallback((chapterIndex: number, newContent: string) => {
        setBookState(prev => {
            const newChapters = [...prev.chapters];
            if(newChapters[chapterIndex]) newChapters[chapterIndex].content = newContent;
            return {...prev, chapters: newChapters};
        });
    }, []);

    const handleToggleAutoMode = React.useCallback(() => {
        /* ... no changes needed here ... */
    }, [isAutoMode, isLoading, messages, handleSendMessage]);
    
    // --- Initial Setup Effect ---
    React.useEffect(() => {
        const firstStep = bookCreationWorkflow[0];
        const firstMessage: ChatMessage = {
            id: 'jim-intro',
            sender: 'jim',
            text: `Hello there, amazing author! 🌟 I'm **Book AI Jim**. Let's get started on your masterpiece.`,
        };
        setMessages([firstMessage]);

        // Immediately trigger the first step
        async function startWorkflow() {
            setIsLoading(true);
            const response = await processStep([], firstStep.id, bookState, selectedModelId);
            if (response) {
                handleGenericResponse(response);
            }
            setIsLoading(false);
        }
        startWorkflow();

    }, []); // Runs only once on mount

     React.useEffect(() => {
        /* ... no changes needed for auto mode logic ... */
    }, [messages, isAutoMode, isLoading, handleSendMessage]);

    const lastMessage = messages[messages.length - 1];

    return (
       <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
            {/* Header */}
            <header className="flex-shrink-0 flex items-center justify-between p-2 border-b border-gray-700 bg-gray-800 shadow-sm">
                <div className="flex items-center">
                    <h1 className="text-lg font-semibold text-white ml-2">Vibe Book Creator</h1>
                </div>
                <div className="flex items-center">
                    <div className="relative ml-2" ref={headerMenuRef}>
                        <button onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 transition-colors" aria-label="More options">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                        {isHeaderMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-gray-700 rounded-md shadow-lg z-10 border border-gray-600">
                                <div className="p-4 space-y-4">
                                     <div className="space-y-2">
                                        <label htmlFor="ai-model-select" className="font-medium text-gray-200 flex items-center gap-2">
                                            <span className="text-base">🧠</span> AI Model
                                        </label>
                                        <select id="ai-model-select" value={selectedModelId} onChange={(e) => setSelectedModelId(e.target.value)} className="w-full p-2 bg-gray-600 rounded-md text-white border border-gray-500 focus:ring-2 focus:ring-teal-400">
                                            {AI_MODELS.filter(model => model.active).map(model => (<option key={model.id} value={model.id}>{model.displayName}</option>))}
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="auto-pilot-toggle-menu" className="font-medium text-gray-200 flex items-center gap-2 cursor-pointer">
                                            <span className="text-base">🚀</span> Auto-Pilot
                                        </label>
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" id="auto-pilot-toggle-menu" className="sr-only peer" checked={isAutoMode} onChange={handleToggleAutoMode} />
                                            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-teal-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-row flex-1 overflow-hidden">

                {/* AI Assistant Panel */}
                <div className={`flex flex-col flex-shrink-0 h-full bg-gray-800 border-r border-gray-700 shadow-lg transition-all duration-300 ${isChatOpen ? 'w-[500px]' : 'w-16'}`}>
                    {isChatOpen ? (
                        <div className="relative flex flex-col flex-1 min-w-0 min-h-0">
                            <div className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
                                <button onClick={() => setIsChatOpen(false)} className="p-1 rounded-full text-gray-400 hover:bg-gray-600 transition-colors" title="Collapse chat">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                            </div>
                            <ChatWindow messages={messages} isLoading={isLoading} onSendMessage={(text) => handleSendMessage(text, false)} />
                             <div className="p-4 border-t border-gray-700 flex items-center gap-2">
                                <ComboBox options={dynamicOptions || lastMessage?.options || []} onSendMessage={(text) => handleSendMessage(text, true)} isLoading={isLoading} />
                            </div>
                        </div>
                    ) : (
                         <div className="flex flex-col items-center pt-4">
                            <button onClick={() => setIsChatOpen(true)} className="p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" title="Expand chat">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.252-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Main View Area */}
                <main className="flex-1 flex flex-col min-w-0 h-full bg-gray-850">
                    <div className="flex-shrink-0 p-3 border-b border-YES-700 bg-gray-800 flex items-center justify-between shadow-md">
                        <div className="flex items-center space-x-2 bg-gray-900 p-1 rounded-lg">
                            <ViewToggle label="Dashboard" view="dashboard" activeView={mainView} onClick={setMainView} />
                            <ViewToggle label="Outline" view="outline" activeView={mainView} onClick={setMainView} />
                            <ViewToggle label="Editor" view="editor" activeView={mainView} onClick={setMainView} />
                            <ViewToggle label="Progress" view="progress" activeView={mainView} onClick={setMainView} />
                        </div>
                    </div>
                    <div className="flex-1 p-4 md:p-6 min-h-0">
                        {mainView === 'progress' && <ProgressTracker progress={progress} />}
                        {mainView === 'editor' && <MarkdownEditor bookState={bookState} onContentChange={handleContentChange} exportBook={() => {}} />}
                        {mainView === 'dashboard' && <BookStateViewer bookState={bookState} />}
                        {mainView === 'outline' && <ChapterOutline bookState={bookState} />}
                    </div>
                </main>

            </div>
        </div>
    );
}
