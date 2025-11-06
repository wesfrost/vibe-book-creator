
import React from 'react';
import { ChatMessage, ProgressPhase, BookState, Option } from './types';
import { FICTION_PROGRESS, HOW_TO_PROGRESS, MEMOIR_PROGRESS, FLASH_FICTION_PROGRESS, BOOK_FORMAT_OPTIONS } from './config';
import { AI_MODELS, DEFAULT_AI_MODEL_ID } from './config/aiModels';
import { processStep } from './services/orchestrationService';
import { generateKDPPackage, exportAsMarkdown } from './services/exportService';
import ProgressTracker from './components/ProgressTracker';
import ChatWindow from './components/ChatWindow';
import MarkdownEditor from './components/MarkdownEditor';
import StateInspector from './components/StateInspector';
import BookStateViewer from './components/BookStateViewer';
import MarketingInfo from './components/MarketingInfo';
import CoverDesigner from './components/CoverDesigner';
import ComboBox from './components/ComboBox';

type MainView = 'progress' | 'editor' | 'dashboard' | 'marketing' | 'cover';
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
    // --- State declarations ---
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [progress, setProgress] = React.useState<ProgressPhase[]>(FICTION_PROGRESS);
    const [flatSteps, setFlatSteps] = React.useState<{ phase: string; step: string }[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
    const [bookState, setBookState] = React.useState<BookState>({ chapters: [] });
    const [isLoading, setIsLoading] = React.useState(false);
    const [mainView, setMainView] = React.useState<MainView>('dashboard');
    const [selectedModelId, setSelectedModelId] = React.useState<string>(DEFAULT_AI_MODEL_ID);
    const [dynamicOptions, setDynamicOptions] = React.useState<Option[] | null>(null);
    const [activeChapterIndex, setActiveChapterIndex] = React.useState<number>(0);
    const [isChatOpen, setIsChatOpen] = React.useState(true);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = React.useState(false);
    const headerMenuRef = React.useRef<HTMLDivElement>(null);
    const [isAutoMode, setIsAutoMode] = React.useState(false);

    // --- Effects ---
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
        // Guardrail: Only run if messages have been initialized.
        if (messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];
        if (isAutoMode && !isLoading && lastMessage?.sender === 'jim' && lastMessage.options && lastMessage.options.length > 0) {
            handleSendMessage(lastMessage.options[0].title, true);
        }
    }, [messages, isAutoMode, isLoading]);


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


    const handleSendMessage = async (text: string, isSelection: boolean = false) => {
        if (isLoading) return;
    
        const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text };
        setMessages(prev => [...prev, userMessage]);
        setDynamicOptions(null);
        setIsLoading(true);
    
        const currentHistory = [...messages, userMessage];
        const currentStepName = flatSteps[currentStepIndex].step;
    
        if (text.toLowerCase().includes("refine") || text.toLowerCase().includes("regenerate")) {
             const response = await processStep(currentHistory, currentStepName, bookState, selectedModelId);
            if (response.outline) handleOutlineResponse(response);
            else if (response.chapterContent) handleChapterDraftResponse(response, activeChapterIndex);
            setIsLoading(false);
            return;
        }

        const isProgression = isSelection || text === "Looks Great!" || text.includes("let's draft Chapter 1");
        let newBookState = { ...bookState };
        let nextStepIndex = currentStepIndex;

        if (isProgression) {
            if(!text.startsWith("Looks great") && !text.includes("let's draft")) {
                newBookState = { ...bookState, [currentStepName]: text };
            }
            const updatedProgress = getUpdatedProgress(progress, currentStepName);
            setProgress(updatedProgress);
            nextStepIndex = currentStepIndex + 1;
        }
    
        const nextTask = flatSteps[nextStepIndex];
        const response = await processStep(currentHistory, nextTask.step, newBookState, selectedModelId);
        
        if (response.outline) {
            handleOutlineResponse(response);
        } else if (response.chapterContent) {
            handleChapterDraftResponse(response, 0);
        } else {
            const jimResponse: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'jim', text: response.message, options: response.options || [], items: response.items || [] };
            if (response.options) {
                setDynamicOptions(response.options);
            }
            setMessages(prev => [...prev, jimResponse]);
        }
        
        setBookState(newBookState);
        setCurrentStepIndex(nextStepIndex);
        setIsLoading(false);
    };

    const handleOutlineResponse = (response: any) => {
        setBookState(prev => ({
            ...prev,
            globalOutline: response.outline,
            chapters: response.outline.map((o: any) => ({ title: o.chapterTitle, content: '', status: 'outlined' }))
        }));
        
        const jimResponse: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'jim', text: response.message };
        setMessages(prev => [...prev, jimResponse]);

        setDynamicOptions([
            { title: "Looks great, let's draft Chapter 1!", description: "Approve this outline and start writing." },
            { title: "Regenerate Outline", description: "Ask the AI to generate a completely new outline." },
            { title: "Refine...", description: "Provide feedback to the AI for specific revisions." },
        ]);
    };

    const handleChapterDraftResponse = (response: any, chapterIndex: number) => {
        setBookState(prev => {
            const newChapters = [...(prev.chapters || [])];
            newChapters[chapterIndex] = {
                title: response.chapterTitle,
                content: response.chapterContent,
                status: 'drafted',
            };
            return { ...prev, chapters: newChapters };
        });

        setMainView('editor');
        setActiveChapterIndex(chapterIndex);

        const jimResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'jim',
            text: response.message,
        };
        setMessages(prev => [...prev, jimResponse]);
        
        setDynamicOptions([
            { title: "Looks Great!", description: "Approve this draft and move to the next step." },
            { title: "Regenerate", description: "Ask the AI to write a completely new version of this chapter." },
            { title: "Refine...", description: "Provide feedback to the AI for specific revisions." },
        ]);
    };
    
    const exportBook = async (type: ExportType) => {
        // ... (existing exportBook function)
    };


    const lastMessage = messages[messages.length - 1];
    
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
                                            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-teal-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
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
                            <ChatWindow messages={messages} isLoading={isLoading} onSendMessage={(text) => handleSendMessage(text, false)} />
                             <div className="p-4 border-t border-gray-700 flex items-center gap-2">
                                <ComboBox options={dynamicOptions || lastMessage?.options || []} onSendMessage={(text) => handleSendMessage(text, true)} isLoading={isLoading} />
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
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {mainView === 'progress' && <ProgressTracker progress={progress} />}
                        {mainView === 'editor' && (
                            <MarkdownEditor 
                                bookState={bookState} 
                                activeChapterIndex={activeChapterIndex}
                                onContentChange={(newContent) => {
                                    const newChapters = [...bookState.chapters];
                                    newChapters[activeChapterIndex].content = newContent;
                                    setBookState(prev => ({...prev, chapters: newChapters}));
                                }}
                                exportBook={exportBook} 
                            />
                        )}
                        {mainView === 'dashboard' && <BookStateViewer bookState={bookState} />}
                    </div>
                </main>
            </div>
        </div>
    );
}
