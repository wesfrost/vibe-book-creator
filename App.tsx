
import React from 'react';
import { bookCreationWorkflow } from './config/bookCreationWorkflow';
import { AI_MODELS, DEFAULT_AI_MODEL_ID } from './config/aiModels';
import { processStep } from './services/orchestrationService';
import ProgressTracker from './components/ProgressTracker';
import ChatWindow from './components/ChatWindow';
import MarkdownEditor from './components/MarkdownEditor';
import BookStateViewer from './components/BookStateViewer';
import ChapterOutline from './components/ChapterOutline';
import ComboBox from './components/ComboBox';
import { useBookStore } from './store/useBookStore';
import { ChatMessage, Option } from './types';

type MainView = 'progress' | 'editor' | 'dashboard' | 'outline';

const ViewToggle: React.FC<{ label: string; view: MainView; activeView: MainView; onClick: (view: MainView) => void; }> = ({ label, view, activeView, onClick }) => (
    <button onClick={() => onClick(view)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${activeView === view ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
        {label}
    </button>
);

export default function App() {
    const {
        messages,
        bookState,
        isLoading,
        dynamicOptions,
        addMessage,
        setBookState,
        setIsLoading,
        setDynamicOptions,
        advanceStep,
        getCurrentStep,
    } = useBookStore();

    const [mainView, setMainView] = React.useState<MainView>('dashboard');
    const [selectedModelId, setSelectedModelId] = React.useState<string>(DEFAULT_AI_MODEL_ID);
    const [isChatOpen, setIsChatOpen] = React.useState(true);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = React.useState(false);
    const headerMenuRef = React.useRef<HTMLDivElement>(null);

    const handleGenericResponse = (responseData: any) => {
        const jimResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'jim',
            text: responseData.message || "Here are some options to get us started. Let me know what you think!",
            options: responseData.options || [],
            bestOption: responseData.bestOption,
        };
        if (responseData.options) {
            setDynamicOptions(responseData.options);
        }
        addMessage(jimResponse);
    };

    const handleOutlineResponse = React.useCallback((responseData: any) => {
        const newBookState = { ...bookState, globalOutline: responseData.globalOutline };
        setBookState(newBookState);
        handleGenericResponse({ message: "I've drafted an outline for your book. Take a look and let me know if you'd like any changes before we start drafting the first chapter." });
        setMainView('outline');
    }, [bookState, setBookState]);

    const handleChapterDraftResponse = React.useCallback((responseData: any) => {
        const chapterIndex = bookState.chapters.findIndex(c => c.title === responseData.chapterTitle);
        if (chapterIndex === -1) return; // Or handle error appropriately

        const newChapters = [...bookState.chapters];
        newChapters[chapterIndex] = { ...newChapters[chapterIndex], content: responseData.chapterContent, status: 'drafted' };
        const newBookState = { ...bookState, chapters: newChapters };
        setBookState(newBookState);
        handleGenericResponse({ message: `Here is the first draft of **${responseData.chapterTitle}**. You can review it in the editor and let me know if you have any feedback.` });
        setMainView('editor');
    }, [bookState, setBookState]);

    const handleSendMessage = React.useCallback(async (text: string, isSelection: boolean = false) => {
        if (isLoading) return;

        const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text };
        addMessage(userMessage);
        setDynamicOptions(null);
        setIsLoading(true);

        const currentStep = getCurrentStep();
        let tempBookState = { ...bookState };

        if (isSelection) {
            const stepConfig = bookCreationWorkflow.find(s => s.id === currentStep.id);
            if (stepConfig?.output.type === 'options' && 'key' in stepConfig.output) {
                const key = stepConfig.output.key as keyof BookState;
                tempBookState = { ...tempBookState, [key]: text };
                setBookState(tempBookState);
            }
            advanceStep();
        }

        const nextStepId = useBookStore.getState().getCurrentStep().id;
        const response = await processStep(useBookStore.getState().messages, nextStepId, tempBookState, selectedModelId);

        if (response.success) {
            const nextStepConfig = bookCreationWorkflow.find(s => s.id === nextStepId);
            switch (nextStepConfig?.output.type) {
                case 'outline': handleOutlineResponse(response.data); break;
                case 'chapter_draft': handleChapterDraftResponse(response.data); break;
                case 'options': handleGenericResponse(response.data); break;
                default: addMessage({ id: 'error', sender: 'jim', text: `I received an unexpected response from the AI. Let's try that again.` }); break;
            }
        } else {
            addMessage({ id: 'error', sender: 'jim', text: `Oh no, a little glitch in the matrix! Here's the technical mumbo-jumbo: ${response.error}` });
        }

        setIsLoading(false);
    }, [isLoading, bookState, selectedModelId, addMessage, setDynamicOptions, setIsLoading, setBookState, advanceStep, getCurrentStep, handleOutlineResponse, handleChapterDraftResponse]);

    React.useEffect(() => {
        if (messages.length > 0) return;

        const firstStep = bookCreationWorkflow[0];
        if (firstStep && firstStep.output.type === 'options') {
            addMessage({
                id: 'jim-intro',
                sender: 'jim',
                text: "Hello there, amazing author! 🌟 I'm **Book AI Jim**. To get started, what kind of book are we creating today?",
                options: firstStep.output.options
            });
        }
    }, []);

    const handleContentChange = React.useCallback((chapterIndex: number, newContent: string) => {
        const newChapters = [...bookState.chapters];
        newChapters[chapterIndex] = { ...newChapters[chapterIndex], content: newContent };
        setBookState({ ...bookState, chapters: newChapters });
    }, [bookState, setBookState]);
    
    const lastMessage = messages[messages.length - 1];

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
            <header className="flex-shrink-0 flex items-center justify-between p-2 border-b border-gray-700 bg-gray-800 shadow-sm">
                 <div className="flex items-center"><h1 className="text-lg font-semibold text-white ml-2">Vibe Book Creator</h1></div>
                 <div className="flex items-center">
                 <div className="relative ml-2" ref={headerMenuRef}>
                        <button onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 transition-colors" aria-label="More options">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                        {isHeaderMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-gray-700 rounded-md shadow-lg z-10 border border-gray-600">
                                <div className="p-4 space-y-4">
                                     <div className="space-y-2">
                                        <label htmlFor="ai-model-select" className="font-medium text-gray-200 flex items-center gap-2"><span className="text-base">🧠</span> AI Model</label>
                                        <select id="ai-model-select" value={selectedModelId} onChange={(e) => setSelectedModelId(e.target.value)} className="w-full p-2 bg-gray-600 rounded-md text-white border border-gray-500 focus:ring-2 focus:ring-teal-400">
                                            {AI_MODELS.filter(model => model.active).map(model => (<option key={model.id} value={model.id}>{model.displayName}</option>))}
                                        </select>
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

                <main className="flex-1 flex flex-col min-w-0 h-full bg-gray-850">
                    <div className="flex-shrink-0 p-3 border-b border-gray-700 bg-gray-800 flex items-center justify-between shadow-md">
                        <div className="flex items-center space-x-2 bg-gray-900 p-1 rounded-lg">
                           <ViewToggle label="Dashboard" view="dashboard" activeView={mainView} onClick={setMainView} />
                           <ViewToggle label="Outline" view="outline" activeView={mainView} onClick={setMainView} />
                           <ViewToggle label="Editor" view="editor" activeView={mainView} onClick={setMainView} />
                           <ViewToggle label="Progress" view="progress" activeView={mainView} onClick={setMainView} />
                        </div>
                    </div>
                    <div className="flex-1 p-4 md:p-6 min-h-0">
                        {mainView === 'dashboard' && <BookStateViewer bookState={bookState} />}
                         {mainView === 'outline' && <ChapterOutline bookState={bookState} />}
                        {mainView === 'editor' && <MarkdownEditor bookState={bookState} onContentChange={handleContentChange} exportBook={() => {}} />}
                        {mainView === 'progress' && <ProgressTracker progress={useBookStore.getState().progress} />}
                    </div>
                </main>
            </div>
        </div>
    );
}
