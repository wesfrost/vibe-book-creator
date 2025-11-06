
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

const ViewToggle: React.FC<{ label: string; view: MainView; activeView: MainView; onClick: (view: MainView) => void; }> = ({ label, view, activeView, onClick }) => {
    const isActive = activeView === view;
    return (
        <button
            onClick={() => onClick(view)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${isActive ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
        >
            {label}
        </button>
    );
};

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
        const currentStepName = flatSteps[currentStepIndex]?.step;

        if (text === "Approve Outline") {
             handleApproveOutline();
             setIsLoading(false);
             return;
        }

        if (text.toLowerCase().includes("refine") || text.toLowerCase().includes("regenerate")) {
            const response = await processStep(currentHistory, currentStepName, bookState, selectedModelId);
            if (response?.outline) handleOutlineResponse(response);
            else if (response?.chapterContent) handleChapterDraftResponse(response, currentStepIndex);
            setIsLoading(false);
            return;
        }

        const isProgression = isSelection || text === "Looks Great!" || text.includes("let's draft");
        let nextStepIndex = currentStepIndex;
        let tempBookState = { ...bookState };

        if (isProgression) {
            if (!text.startsWith("Looks great") && !text.includes("let's draft")) {
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
            if (response.outline) {
                handleOutlineResponse(response);
            } else if (response.chapterContent) {
                handleChapterDraftResponse(response, nextStepIndex);
            } else {
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
        
        const tempProgress = JSON.parse(JSON.stringify(progress));
        const phase3Index = tempProgress.findIndex((p: any) => p.name.includes("Drafting & Review"));
        if (phase3Index !== -1) {
            tempProgress[phase3Index].steps = chapterSteps;
        }
        setProgress(tempProgress);
        
        const newFlatSteps = tempProgress.flatMap((phase: any) => phase.steps.map((step: any) => ({ phase: phase.name, step: step.name })));
        setFlatSteps(newFlatSteps);

        const approvalMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'jim', text: "Excellent! The outline is locked in. I will now begin drafting Chapter 1." };
        
        const firstChapterStepIndex = newFlatSteps.findIndex((step: any) => step.step === "Chapter 1 Drafted");
        setCurrentStepIndex(firstChapterStepIndex);

        setMessages(prev => [...prev, approvalMessage]);
        
        setTimeout(() => {
            handleSendMessage(`Draft Chapter 1`, false);
        }, 100);
    }, [bookState.chapters.length, progress, handleSendMessage]);

    const handleContentChange = React.useCallback((chapterIndex: number, newContent: string) => {
        setBookState(prev => {
            const newChapters = [...prev.chapters];
            if(newChapters[chapterIndex]) newChapters[chapterIndex].content = newContent;
            return {...prev, chapters: newChapters};
        });
    }, []);
    
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
            options: BOOK_FORMAT_OPTIONS.slice(0, 3),
        };
        setMessages([firstMessage, secondMessage]);
        const initialFlatSteps = FICTION_PROGRESS.flatMap(phase => phase.steps.map(step => ({ phase: phase.name, step: step.name })));
        setFlatSteps(initialFlatSteps);
    }, []);

    React.useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (isAutoMode && !isLoading && lastMessage?.sender === 'jim' && lastMessage.options && lastMessage.options.length > 0 && !lastMessage.isProgressUpdate) {
            setTimeout(() => handleSendMessage(lastMessage.options[0].title, true), 1000);
        }
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
                    <div className="flex-shrink-0 p-3 border-b border-gray-700 bg-gray-800 flex items-center justify-between shadow-md">
                        <div className="flex items-center space-x-2 bg-gray-900 p-1 rounded-lg">
                            <ViewToggle label="Dashboard" view="dashboard" activeView={mainView} onClick={setMainView} />
                            <ViewToggle label="Outline" view="outline" activeView={mainView} onClick={setMainView} />
                            <ViewToggle label="Editor" view="editor" activeView={mainView} onClick={setMainView} />
                            <ViewToggle label="Progress" view="progress" activeView={mainView} onClick={setMainView} />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
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
