
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ProgressPhase, BookState } from './types';
import { FICTION_PROGRESS, HOW_TO_PROGRESS, MEMOIR_PROGRESS, FLASH_FICTION_PROGRESS, BOOK_FORMAT_OPTIONS } from './config';
import { processStep, analyzeChapter } from './services/orchestrationService';
import { generateKDPPackage, exportAsMarkdown } from './services/exportService';
import ProgressTracker from './components/ProgressTracker';
import ChatWindow from './components/ChatWindow';
import UserInput from './components/UserInput';
import MarkdownEditor from './components/MarkdownEditor';
import StateInspector from './components/StateInspector';
import MarketingInfo from './components/MarketingInfo';
import CoverDesigner from './components/CoverDesigner';
import GenreSelect from './components/GenreSelect';

type ChapterDraftingStage = 'idea' | 'draft' | 'review' | 'inactive';
type MainView = 'progress' | 'editor' | 'dev' | 'marketing' | 'cover';
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
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [progress, setProgress] = useState<ProgressPhase[]>(FICTION_PROGRESS);
    const [flatSteps, setFlatSteps] = useState<{ phase: string; step: string }[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [bookState, setBookState] = useState<BookState>({ chapters: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [isAutoMode, setIsAutoMode] = useState(false);
    const [isDevMode, setIsDevMode] = useState(false);
    const [mainView, setMainView] = useState<MainView>('editor');
    const [chapterDrafting, setChapterDrafting] = useState<{
        isActive: boolean;
        currentChapter: number;
        stage: ChapterDraftingStage;
    }>({ isActive: false, currentChapter: 1, stage: 'inactive' });

    const [isBookComplete, setIsBookComplete] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const headerMenuRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
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

    useEffect(() => {
        const firstMessage: ChatMessage = {
            id: 'jim-intro', sender: 'jim',
            text: `Hello there, amazing author! 🌟 I'm **Book Work Jim**. Think of me as your personal project manager and mentor. My team of AI experts and I are here to demystify the process of writing a best-seller, from the first spark to the final marketing blurb.`,
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

    const handleSendMessage = async (text: string, isAuto: boolean = false) => {
        if (isLoading || isBookComplete) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text,
            isAuto
        };
        setMessages(prev => [...prev, userMessage]);
        
        setIsLoading(true);
        
        const currentHistory = [...messages, userMessage];
        
        if (currentStepIndex === 0 && flatSteps[currentStepIndex].step === "Book Format Selected") {
            let track = FICTION_PROGRESS;
            let newBookState = { ...bookState, "Book Format Selected": text };
            
            if (text.includes("How-To") || text.includes("Self-Help")) track = HOW_TO_PROGRESS;
            else if (text.includes("Memoir")) track = MEMOIR_PROGRESS;
            else if (text.includes("Flash Fiction")) {
                track = FLASH_FICTION_PROGRESS;
                newBookState = { ...newBookState, chapterCount: 1 };
            }

            const newProgress = JSON.parse(JSON.stringify(track));
            newProgress[0].steps[0].completed = true;

            const newFlatSteps = newProgress.flatMap(phase =>
                phase.steps.map(step => ({ phase: phase.name, step: step.name }))
            );

            const nextStepIndex = 1;
            const nextTask = newFlatSteps[nextStepIndex];

            const response = await processStep(currentHistory, nextTask.step, newBookState, isDevMode);
            const jimResponse: ChatMessage = { 
                id: (Date.now() + 1).toString(), 
                sender: 'jim', 
                text: response.message, 
                options: response.options || [],
                items: response.items || []
            };

            setBookState(newBookState);
            setProgress(newProgress);
            setFlatSteps(newFlatSteps);
            setCurrentStepIndex(nextStepIndex);
            setMessages(prev => [...prev, jimResponse]);
            setIsLoading(false);
            return;
        }

        if (flatSteps[currentStepIndex].step === "Working Title Defined") {
            const updatedBookState = { ...bookState, workingTitle: text, [flatSteps[currentStepIndex].step]: text };
            setBookState(updatedBookState);

            const updatedProgress = getUpdatedProgress(progress, "Working Title Defined");
            setProgress(updatedProgress);

            const nextStepIndex = currentStepIndex + 1;
            setCurrentStepIndex(nextStepIndex);
            
            const nextTask = flatSteps[nextStepIndex];
            const response = await processStep(currentHistory, nextTask.step, updatedBookState, isDevMode);
            const jimResponse: ChatMessage = { 
                id: (Date.now() + 1).toString(), 
                sender: 'jim', 
                text: response.message, 
                options: response.options || [],
                items: response.items || []
            };
            setMessages(prev => [...prev, jimResponse]);
            setIsLoading(false);
            return;
        }
        
        if (flatSteps[currentStepIndex].step === "Final Title Locked In") {
            const updatedBookState = { ...bookState, title: text, [flatSteps[currentStepIndex].step]: text };
            setBookState(updatedBookState);
        }

        if (flatSteps[currentStepIndex].phase === "Cover Design") {
            if (flatSteps[currentStepIndex].step === "AI-Powered Image Generation") {
                setMainView('cover');
            }
        }

        let newMessages: ChatMessage[] = [];
        const isHowTo = bookState['Book Format Selected']?.includes('How-To');
        const stepNamePrefix = isHowTo ? 'Module' : 'Chapter';

        if (chapterDrafting.isActive) {
            let nextStage = chapterDrafting.stage;
            let currentChapterNum = chapterDrafting.currentChapter;
            let response: any;
            let bookStateForNextCall = { ...bookState };
            
            if (chapterDrafting.stage === 'idea') {
                response = await processStep(currentHistory, `Generate idea for ${stepNamePrefix} ${currentChapterNum}`, bookStateForNextCall, isDevMode);
                nextStage = 'draft';
            } else if (chapterDrafting.stage === 'draft') {
                 const lastJimMessage = [...messages, userMessage].reverse().find(m => m.sender === 'jim' && m.chapterIdea);
                 if (lastJimMessage?.chapterIdea) {
                     const placeholderChapter = {
                         title: lastJimMessage.chapterIdea.title,
                         idea: lastJimMessage.chapterIdea.idea,
                         content: `${stepNamePrefix} content is being drafted...`
                     };
                      bookStateForNextCall = {
                         ...bookState,
                         chapters: [...(bookState.chapters || []), placeholderChapter]
                     };
                     setBookState(bookStateForNextCall);
                 }
                response = await processStep(currentHistory, `Draft ${stepNamePrefix} ${currentChapterNum}`, bookStateForNextCall, isDevMode);

                if (response.chapterContent) {
                    const analysisText = await analyzeChapter(response.chapterContent, bookStateForNextCall, isDevMode);
                    const analysisMessage: ChatMessage = {
                        id: (Date.now() + 2).toString(), sender: 'jim',
                        text: analysisText, isAnalysis: true,
                    };
                    newMessages.push(analysisMessage);
                }
                nextStage = 'review';
            } else if (chapterDrafting.stage === 'review') {
                const updatedProgress = getUpdatedProgress(progress, `${stepNamePrefix} ${currentChapterNum} Drafted`);
                setProgress(updatedProgress);
                currentChapterNum++;

                if (currentChapterNum > (bookState.chapterCount || 0)) {
                    setChapterDrafting({ isActive: false, currentChapter: 1, stage: 'inactive' });
                    
                    const progressAfterReview = getUpdatedProgress(updatedProgress, 'Final Manuscript Review');
                    const fullBookCompiledIndex = flatSteps.findIndex(s => s.step === 'Full Book Compiled');
                    
                    if (fullBookCompiledIndex !== -1) {
                        const nextTask = flatSteps[fullBookCompiledIndex];
                        response = await processStep(currentHistory, nextTask.step, bookStateForNextCall, isDevMode);
                        
                        const jimResponse: ChatMessage = { 
                            id: (Date.now() + 1).toString(), 
                            sender: 'jim', 
                            text: response.message, 
                            options: response.options || [] 
                        };
                        
                        setProgress(progressAfterReview);
                        setCurrentStepIndex(fullBookCompiledIndex);
                        setMessages(prev => [...prev, jimResponse]);
                    } else {
                        const errorMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'jim', text: "Something went wrong transitioning to the final phase. Please try again." };
                        setMessages(prev => [...prev, errorMessage]);
                    }

                    setIsLoading(false);
                    return;

                } else {
                    setChapterDrafting({ ...chapterDrafting, currentChapter: currentChapterNum, stage: 'idea' });
                    response = await processStep(currentHistory, `Generate idea for ${stepNamePrefix} ${currentChapterNum}`, bookState, isDevMode);
                    nextStage = 'draft';
                }
            } else {
                 response = {message: "An unexpected error occurred during chapter drafting."};
            }

            const jimResponse: ChatMessage = {
                id: (Date.now() + 1).toString(), sender: 'jim',
                text: response.postChapterMessage || response.message,
            };

            if (response.chapterIdea) {
                jimResponse.chapterIdea = { title: response.chapterTitle, idea: response.chapterIdea };
                jimResponse.options = [{ title: '✅ Yes, write it!', rationale: "Let's get this chapter drafted." }, { title: '🔄 Try a new idea', rationale: "Let's brainstorm another direction." }];
            } else if (response.chapterContent) {
                 setBookState(prev => {
                    const updatedChapters = [...(prev.chapters || [])];
                    if (updatedChapters.length > 0) {
                        const lastChapter = updatedChapters[updatedChapters.length - 1];
                        lastChapter.content = response.chapterContent;
                        lastChapter.title = response.chapterTitle || lastChapter.title;
                    }
                    return { ...prev, chapters: updatedChapters };
                });
                if (chapterDrafting.currentChapter === 1) setMainView('editor');
                const nextChapter = chapterDrafting.currentChapter + 1;
                const nextOption = nextChapter > (bookState.chapterCount || 0) ? `🎉 Looks great! On to the final review.` : `➡️ Next ${stepNamePrefix}`;
                jimResponse.options = [{ title: nextOption, rationale: "Let's keep the momentum going." }];
            }
            
            setChapterDrafting({ isActive: true, currentChapter: currentChapterNum, stage: nextStage });
            setMessages(prev => [...prev, ...newMessages, jimResponse]);
            setIsLoading(false);
            return;
        }

        const currentTask = flatSteps[currentStepIndex];
        let finalProgress = getUpdatedProgress(progress, currentTask.step);
        let newBookState = { ...bookState, [currentTask.step]: text };
        let finalFlatSteps = flatSteps;
        let nextStepIndex = currentStepIndex + 1;

        if (currentTask.step.includes("Number of Chapters Defined") || currentTask.step.includes("Number of Modules Defined")) {
            const count = parseInt(text.match(/\d+/)?.[0] || '3');
            newBookState = { ...newBookState, chapterCount: count };
            const tempProgress = JSON.parse(JSON.stringify(finalProgress));
            const phase3Index = tempProgress.findIndex((p: ProgressPhase) => p.name.includes("Drafting & Review"));

            if (phase3Index !== -1) {
                const chapterSteps = Array.from({ length: count }, (_, i) => ({
                    name: `${stepNamePrefix} ${i + 1} Drafted`, completed: false
                }));
                const originalPhase3 = progress[phase3Index];
                tempProgress[phase3Index].steps = [...chapterSteps, ...originalPhase3.steps.slice(0)];
                finalProgress = tempProgress;
            }

            finalFlatSteps = finalProgress.flatMap((phase: ProgressPhase) =>
                phase.steps.map(step => ({ phase: phase.name, step: step.name }))
            );

            setBookState(newBookState);
            setProgress(finalProgress);
            setFlatSteps(finalFlatSteps);
            setCurrentStepIndex(nextStepIndex);
            
            const nextTask = finalFlatSteps[nextStepIndex];
            const response = await processStep(currentHistory, nextTask.step, newBookState, isDevMode);
            const jimResponse: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'jim', text: response.message, options: response.options || [] };

            setMessages(prev => [...prev, jimResponse]);
            setIsLoading(false);
            return;
        }
        
        if (currentTask.step === "Pacing Strategy Agreed" || currentTask.step === "Engagement Strategy Agreed") {
            setChapterDrafting({ isActive: true, currentChapter: 1, stage: 'idea' });
            const chapter1Index = finalFlatSteps.findIndex(s => s.step === `${stepNamePrefix} 1 Drafted`);
            if (chapter1Index !== -1) {
                setProgress(finalProgress); setFlatSteps(finalFlatSteps); setBookState(newBookState); setCurrentStepIndex(chapter1Index);
                const response = await processStep(currentHistory, `Generate idea for ${stepNamePrefix} 1`, newBookState, isDevMode);
                const jimResponse: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'jim', text: response.message };

                if (response.chapterIdea) {
                    jimResponse.chapterIdea = { title: response.chapterTitle, idea: response.chapterIdea };
                    jimResponse.options = [{ title: '✅ Yes, write it!', rationale: "Let's get this drafted." }, { title: '🔄 Try a new idea', rationale: "Let's brainstorm another direction." }];
                }
                setChapterDrafting(prev => ({ ...prev, stage: 'draft' }));
                setMessages(prev => [...prev, jimResponse]);
                setIsLoading(false);
                return;
            }
        }

        if (nextStepIndex >= finalFlatSteps.length) {
            const finalMessage: ChatMessage = { id: 'jim-final', sender: 'jim', text: "We've done it! 🎉 What an incredible journey. Your book is ready for the world. It has been an absolute honor working with you!" };
            setMessages(prev => [...prev, finalMessage]);
            setIsBookComplete(true);
            setIsLoading(false);
            return;
        }

        const nextTask = finalFlatSteps[nextStepIndex];
        const response = await processStep(currentHistory, nextTask.step, newBookState, isDevMode);
        const jimResponse: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'jim', text: response.message, options: response.options || [], items: response.items || [] };

        if (response.items) {
            jimResponse.text += "\n\n" + response.items.map((item: string) => `- ${item}`).join("\n");
            jimResponse.options = [{title: "Perfect, let's proceed!", rationale: "These look great. Let's lock them in."}];
            
            if (nextTask.step === "KDP Keywords Researched") {
                newBookState = { ...newBookState, kdpKeywords: response.items };
                setMainView('marketing');
            } else if (nextTask.step === "Book Categories Selected") {
                newBookState = { ...newBookState, bookCategories: response.items };
            }
        }
        
        if (nextTask.step.includes("Outline Approved") && response.outlineContent) {
            newBookState = { ...newBookState, globalOutline: response.outlineContent };
        }

        if (nextTask.step === "Compelling Blurb Drafted") {
             newBookState = { ...newBookState, blurb: response.message };
        }

        setBookState(newBookState);
        setProgress(finalProgress);
        setFlatSteps(finalFlatSteps);
        setMessages(prev => [...prev, jimResponse]);
        setCurrentStepIndex(nextStepIndex);
        setIsLoading(false);
    };

    useEffect(() => {
        if (!isAutoMode || isLoading || isBookComplete) return;
        const runSimulationStep = () => {
             const lastActionableMessage = [...messages].reverse().find(m => m.sender === 'jim' && !m.isAnalysis && !m.isProgressUpdate);
            if (!lastActionableMessage) return;

            let actionText = lastActionableMessage.chapterIdea ? '✅ Yes, write it!' : lastActionableMessage.options?.[0]?.title || "Sounds good, let's proceed.";
            if (actionText) { handleSendMessage(actionText, true); }
        };
        const timer = setTimeout(runSimulationStep, 500);
        return () => clearTimeout(timer);
    }, [messages, isAutoMode, isLoading, currentStepIndex, chapterDrafting.isActive, isBookComplete]);

    const isMarketingPhase = flatSteps[currentStepIndex]?.phase.includes("Finalization & Marketing");
    const isCoverPhase = flatSteps[currentStepIndex]?.phase.includes("Cover Design");
    const showGenreSelect = messages[messages.length - 1]?.items?.length > 0 && flatSteps[currentStepIndex].step === "Genre Defined";

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
                <div
                    className={`flex flex-col flex-shrink-0 h-full bg-gray-800 border-r border-gray-700 shadow-lg transition-all duration-300 ${isChatOpen ? 'w-[500px]' : 'w-16'}`}
                >
                    {isChatOpen ? (
                        <div className="relative flex flex-col flex-1 min-w-0 min-h-0">
                            <div className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
                                <button
                                    onClick={() => setIsChatOpen(false)}
                                    className="p-1 rounded-full text-gray-400 hover:bg-gray-600 transition-colors"
                                    title="Collapse chat"
                                    aria-label="Collapse chat"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                            </div>
                            <ChatWindow messages={messages} isLoading={isLoading} onSendMessage={handleSendMessage} />
                            {showGenreSelect ? (
                                <div className="p-4 border-t border-gray-700">
                                    <GenreSelect genres={messages[messages.length - 1].items} onSelectGenre={handleSendMessage} />
                                </div>
                            ) : (
                                <UserInput
                                    onSendMessage={handleSendMessage}
                                    isLoading={isLoading}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center pt-4">
                            <button
                                onClick={() => setIsChatOpen(true)}
                                className="p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                                title="Expand chat"
                                aria-label="Expand chat"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.redacted_949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </button>
                        </div>
                    )}
                </div>

                <main className="flex-1 flex flex-col min-w-0 h-full bg-gray-850">
                    <div className="flex-shrink-0 p-3 border-b border-gray-700 bg-gray-800 flex items-center justify-between shadow-md">
                        <div className="flex items-center space-x-2 bg-gray-900 p-1 rounded-lg">
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
                        {mainView === 'marketing' && <MarketingInfo bookState={bookState} />}
                        {mainView === 'cover' && <CoverDesigner bookState={bookState} onSelectCover={(imageUrl) => setBookState(prev => ({ ...prev, coverImageUrl: imageUrl }))} />}
                        {mainView === 'dev' && <StateInspector bookState={bookState} />}
                    </div>
                </main>
            </div>
        </div>
    );
}
