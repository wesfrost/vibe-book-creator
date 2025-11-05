
import React from 'react';
import { ChatMessage, ProgressPhase, BookState } from './types';
import { FICTION_PROGRESS, HOW_TO_PROGRESS, MEMOIR_PROGRESS, FLASH_FICTION_PROGRESS, BOOK_FORMAT_OPTIONS } from './config';
import { AI_MODELS, DEFAULT_AI_MODEL_ID } from './config/aiModels';
import { processStep, analyzeChapter } from './services/orchestrationService';
import { generateKDPPackage, exportAsMarkdown } from './services/exportService';
import ProgressTracker from './components/ProgressTracker';
import ChatWindow from './components/ChatWindow';
import MarkdownEditor from './components/MarkdownEditor';
import StateInspector from './components/StateInspector';
import BookStateViewer from './components/BookStateViewer';
import MarketingInfo from './components/MarketingInfo';
import CoverDesigner from './components/CoverDesigner';
import ComboBox from './components/ComboBox';
import { CHAPTER_COUNT_OPTIONS } from './config/chapterCounts';

type ChapterDraftingStage = 'idea' | 'draft' | 'review' | 'inactive';
type MainView = 'progress' | 'editor' | 'dashboard' | 'dev' | 'marketing' | 'cover';
type ExportType = 'kdp' | 'md' | 'docx';

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
    const [isAutoMode, setIsAutoMode] = React.useState(false);
    const [isDevMode, setIsDevMode] = React.useState(false);
    const [mainView, setMainView] = React.useState<MainView>('dashboard');
    const [selectedModelId, setSelectedModelId] = React.useState<string>(DEFAULT_AI_MODEL_ID);
    const [chapterDrafting, setChapterDrafting] = React.useState<{
        isActive: boolean;
        currentChapter: number;
        stage: ChapterDraftingStage;
    }>({ isActive: false, currentChapter: 1, stage: 'inactive' });
    const [chapterCountOptions, setChapterCountOptions] = React.useState<{ low: number, medium: number, high: number } | null>(null);
    const [isBookComplete, setIsBookComplete] = React.useState(false);
    const [isChatOpen, setIsChatOpen] = React.useState(true);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = React.useState(false);
    const headerMenuRef = React.useRef<HTMLDivElement>(null);

    const exportBook = async (type: ExportType) => {
        if (!bookState.title) {
            console.error("Book title is not set. Cannot export.");
            return;
        }
        if (type === 'kdp') {
            await generateKDPPackage(bookState);
        } else if (type === 'md') {
            exportAsMarkdown(bookState);
        } else if (type === 'docx') {
            const { exportAsDocx } = await import('./services/exportService');
            exportAsDocx(bookState);
        }
    };

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
                setIsHeaderMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [headerMenuRef]);

    React.useEffect(() => {
        const firstMessage: ChatMessage = {
            id: 'jim-intro', sender: 'jim',
            text: `Hello there, amazing author! 🌟 I'm **Book Work Jim**. Think of me as your personal project manager and mentor. My team of AI experts and I are here to demistify the process of writing a best-seller, from the first spark to the final marketing blurb.`,
            isProgressUpdate: true,
        };

        const secondMessage: ChatMessage = {
            id: 'jim-first-step', sender: 'jim',
            text: `My specialists will not only help you write, but they'll explain the 'why' behind every step, sharing industry secrets to help you succeed. Ready to lay the foundation? Let's start with **Phase 1, Step 1: Choosing your Book Format.** What kind of masterpiece are we creating today? ✍️`,
            options: BOOK_FORMAT_OPTIONS.map(opt => ({ title: opt.title, description: opt.description })),
        };
        setMessages([firstMessage, secondMessage]);

        const initialFlatSteps = FICTION_PROGRESS.flatMap(phase =>
            phase.steps.map(step => ({ phase: phase.name, step: step.name }))
        );
        setFlatSteps(initialFlatSteps);
    }, []);
    
    React.useEffect(() => {
        if (bookState['Book Format Selected'] && bookState['Genre Defined']) {
            const format = bookState['Book Format Selected'] as keyof typeof CHAPTER_COUNT_OPTIONS;
            const genre = bookState['Genre Defined'] as keyof typeof CHAPTER_COUNT_OPTIONS[typeof format];
            
            const options = CHAPTER_COUNT_OPTIONS[format]?.[genre] || CHAPTER_COUNT_OPTIONS[format]?.['default'];

            if (options) {
                setChapterCountOptions(options);
                
                const currentStepName = flatSteps[currentStepIndex]?.step;
                if (currentStepName === "Number of Chapters Defined" || currentStepName === "Number of Modules Defined") {
                    setMessages(prev => {
                        const lastMessage = prev[prev.length - 1];
                        if (lastMessage.sender === 'jim' && !lastMessage.options?.length) {
                             const updatedMessage = {
                                ...lastMessage,
                                options: [
                                    { title: `${options.low} chapters`, description: "A quicker read, great for fast-paced genres." },
                                    { title: `${options.medium} chapters`, description: "A solid, standard length that hits the sweet spot for most readers." },
                                    { title: `${options.high} chapters`, description: "An epic, sprawling story with plenty of room for depth." },
                                ]
                             };
                             return [...prev.slice(0, -1), updatedMessage];
                        }
                        return prev;
                    });
                }
            }
        }
    }, [bookState['Book Format Selected'], bookState['Genre Defined'], currentStepIndex, flatSteps]);


    const handleToggleAutoMode = () => {
        const newAutoModeState = !isAutoMode;
        setIsAutoMode(newAutoModeState);
        const modeMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'jim',
            text: newAutoModeState ? `🚀 **Auto-Pilot Engaged!** The simulation will now proceed automatically.` : `Manual control resumed.`,
            isProgressUpdate: true,
        };
        setMessages(prev => [...prev, modeMessage]);
    };

    const handleSendMessage = async (text: string, isAuto: boolean = false, isSelection: boolean = false) => {
        if (isLoading || isBookComplete) return;
    
        const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text, isAuto };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
    
        const currentHistory = [...messages, userMessage];
        const currentStepName = flatSteps[currentStepIndex].step;
    
        // If it's a discussion, stay on the current step and get new options
        if (!isSelection) {
            const response = await processStep(currentHistory, currentStepName, bookState, selectedModelId, isDevMode);
            const jimResponse: ChatMessage = {
                id: (Date.now() + 1).toString(), sender: 'jim',
                text: response.message, options: response.options || [], items: response.items || []
            };
            setMessages(prev => [...prev, jimResponse]);
            setIsLoading(false);
            return;
        }
    
        // --- If it IS a selection, advance the process ---
        let newBookState = { ...bookState, [currentStepName]: text };
        const updatedProgress = getUpdatedProgress(progress, currentStepName);
        let nextStepIndex = currentStepIndex + 1;
        
        // Handle dynamic chapter step creation
        if (currentStepName.includes("Number of Chapters Defined") || currentStepName.includes("Number of Modules Defined")) {
            const count = parseInt(text.match(/\d+/)?.[0] || '10');
            newBookState = { ...newBookState, chapterCount: count };
            const tempProgress = JSON.parse(JSON.stringify(updatedProgress));
            const phase3Index = tempProgress.findIndex((p: ProgressPhase) => p.name.includes("Drafting & Review"));
            if (phase3Index !== -1) {
                const stepNamePrefix = newBookState['Book Format Selected']?.includes('How-To') ? 'Module' : 'Chapter';
                const chapterSteps = Array.from({ length: count }, (_, i) => ({ name: `${stepNamePrefix} ${i + 1} Drafted`, completed: false }));
                tempProgress[phase3Index].steps = [...chapterSteps, ...progress[phase3Index].steps];
                setProgress(tempProgress);
                setFlatSteps(tempProgress.flatMap((phase: ProgressPhase) => phase.steps.map(step => ({ phase: phase.name, step: step.name }))));
            }
        }
    
        // Check for book completion
        if (nextStepIndex >= flatSteps.length) {
            setIsBookComplete(true);
            setMessages(prev => [...prev, { id: 'jim-final', sender: 'jim', text: "We've done it! 🎉 Your book is ready for the world." }]);
            setIsLoading(false);
            return;
        }
    
        const nextTask = flatSteps[nextStepIndex];
        const response = await processStep(currentHistory, nextTask.step, newBookState, selectedModelId, isDevMode);
        const jimResponse: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'jim', text: response.message, options: response.options || [], items: response.items || [] };
    
        // Update book state with any special data from the response
        if (response.items) {
             if (nextTask.step === "KDP Keywords Researched") newBookState = { ...newBookState, kdpKeywords: response.items };
             else if (nextTask.step === "Book Categories Selected") newBookState = { ...newBookState, bookCategories: response.items };
        }
        if (nextTask.step.includes("Outline Approved") && response.outlineContent) newBookState = { ...newBookState, globalOutline: response.outlineContent };
        if (nextTask.step === "Compelling Blurb Drafted") newBookState = { ...newBookState, blurb: response.message };
    
        setBookState(newBookState);
        setProgress(updatedProgress);
        setCurrentStepIndex(nextStepIndex);
        setMessages(prev => [...prev, jimResponse]);
        setIsLoading(false);
    };

    const lastMessage = messages[messages.length - 1];
    const isCharacterStep = flatSteps[currentStepIndex]?.step.includes("Key Characters");
    const isMarketingPhase = flatSteps[currentStepIndex]?.phase.includes("Finalization & Marketing");
    const isCoverPhase = flatSteps[currentStepIndex]?.phase.includes("Cover Design");
    
    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
            <header className="flex-shrink-0 flex items-center justify-between p-2 border-b border-gray-700 bg-gray-800 shadow-sm">
                <div className="flex items-center">
                    <h1 className="text-lg font-semibold text-white ml-2">Vibe Book Creator</h1>
                </div>
                <div className="flex items-center">
                    <div className="relative ml-2" ref={headerMenuRef}>
                        <button 
                            onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 transition-colors" 
                            aria-label="More options"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                        {isHeaderMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-gray-700 rounded-md shadow-lg z-10 border border-gray-600">
                                <div className="p-4 space-y-4">
                                     <div className="space-y-2">
                                        <label htmlFor="ai-model-select" className="font-medium text-gray-200 flex items-center gap-2">
                                            <span className="text-base">🧠</span> AI Model
                                        </label>
                                        <select 
                                            id="ai-model-select"
                                            value={selectedModelId}
                                            onChange={(e) => setSelectedModelId(e.target.value)}
                                            className="w-full p-2 bg-gray-600 rounded-md text-white border border-gray-500 focus:ring-2 focus:ring-teal-400"
                                        >
                                            {AI_MODELS.filter(model => model.active).map(model => (
                                                <option key={model.id} value={model.id}>{model.displayName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="auto-pilot-toggle-menu" className="font-medium text-gray-200 flex items-center gap-2 cursor-pointer">
                                            <span className="text-base">🚀</span> Auto-Pilot
                                        </label>
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                id="auto-pilot-toggle-menu" 
                                                className="sr-only peer"
                                                checked={isAutoMode}
                                                onChange={handleToggleAutoMode}
                                            />
                                            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-teal-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="dev-mode-toggle-menu" className="font-medium text-gray-200 flex items-center gap-2 cursor-pointer">
                                            <span className="text-base">🛠️</span> Dev Mode
                                        </label>
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                id="dev-mode-toggle-menu" 
                                                className="sr-only peer"
                                                checked={isDevMode}
                                                onChange={() => setIsDevMode(!isDevMode)}
                                            />
                                            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <div className="flex flex-row flex-1 overflow-hidden">
                <div className={`flex flex-col flex-shrink-0 h-full bg-gray-800 border-r border-gray-700 shadow-lg transition-all duration-300 ${isChatOpen ? 'w-[500px]' : 'w-16'}`}>
                    {isChatOpen ? (
                        <div className="relative flex flex-col flex-1 min-w-0 min-h-0">
                            <div className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
                                <button onClick={() => setIsChatOpen(false)} className="p-1 rounded-full text-gray-400 hover:bg-gray-600 transition-colors" title="Collapse chat" aria-label="Collapse chat">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                            </div>
                            <ChatWindow messages={messages} isLoading={isLoading} onSendMessage={handleSendMessage} />
                             <div className="p-4 border-t border-gray-700 flex items-center gap-2">
                                <ComboBox options={lastMessage?.options || []} onSendMessage={(text) => handleSendMessage(text, false, true)} isLoading={isLoading} />
                                {isCharacterStep && (
                                    <button 
                                        onClick={() => handleSendMessage(`Research names for ${bookState['Key Characters Defined'] || 'the main character'}`, false, false)}
                                        disabled={isLoading}
                                        className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 transition-colors"
                                        title="Research character names"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0115 11.01V11a4 4 0 00-8 0v.01a5 5 0 013.43-4.67A6.97 6.97 0 008 16c0 .34.024.673.07 1H4a2 2 0 01-2-2v-1a1 1 0 011-1h14a1 1 0 011 1v1a2 2 0 01-2 2h-4.07z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center pt-4">
                            <button onClick={() => setIsChatOpen(true)} className="p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" title="Expand chat" aria-label="Expand chat">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.252-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </button>
                        </div>
                    )}
                </div>
                <main className="flex-1 flex flex-col min-w-0 h-full bg-gray-850">
                    <div className="flex-shrink-0 p-3 border-b border-gray-700 bg-gray-800 flex items-center justify-between shadow-md">
                        <div className="flex items-center space-x-2 bg-gray-900 p-1 rounded-lg">
                            <ViewToggle label="Dashboard" view="dashboard" activeView={mainView} onClick={setMainView} />
                            <ViewToggle label="Editor" view="editor" activeView={mainView} onClick={setMainView} />
                            <ViewToggle label="Progress" view="progress" activeView={mainView} onClick={setMainView} />
                            {isMarketingPhase && <ViewToggle label="Marketing" view="marketing" activeView={mainView} onClick={setMainView} />}
                            {isCoverPhase && <ViewToggle label="Cover" view="cover" activeView={mainView} onClick={setMainView} />}
                            {isDevMode && <ViewToggle label="Dev" view="dev" activeView={mainView} onClick={setMainView} />}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {mainView === 'progress' && <ProgressTracker progress={progress} />}
                        {mainView === 'editor' && <MarkdownEditor bookState={bookState} exportBook={exportBook} isBookComplete={isBookComplete} />}
                        {mainView === 'dashboard' && <BookStateViewer bookState={bookState} />}
                        {mainView === 'marketing' && <MarketingInfo bookState={bookState} />}
                        {mainView === 'cover' && <CoverDesigner bookState={bookState} onSelectCover={(imageUrl) => setBookState(prev => ({ ...prev, coverImageUrl: imageUrl }))} />}
                        {mainView === 'dev' && <StateInspector bookState={bookState} />}
                    </div>
                </main>
            </div>
        </div>
    );
}
