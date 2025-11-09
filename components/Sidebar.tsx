
import React from 'react';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import { useBookStore } from '../store/useBookStore';

interface SidebarProps {
    onUserAction: (text: string, isSelection?: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onUserAction }) => {
    const { messages, isLoading } = useBookStore();
    const [isChatOpen, setIsChatOpen] = React.useState(true);

    return (
        <div className={`flex flex-col flex-shrink-0 h-full bg-gray-800 border-r border-gray-700 shadow-lg transition-all duration-300 ${isChatOpen ? 'w-[500px]' : 'w-16'}`}>
            {isChatOpen ? (
                <div className="relative flex flex-col flex-1 min-w-0 min-h-0">
                    <div className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
                        <button onClick={() => setIsChatOpen(false)} className="p-1 rounded-full text-gray-400 hover:bg-gray-600 transition-colors" title="Collapse chat">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                    </div>
                    <ChatWindow messages={messages} isLoading={isLoading} onSendSelection={onUserAction} />
                    <div className="p-4 border-t border-gray-700">
                        <ChatInput onSendMessage={onUserAction} isLoading={isLoading} />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center pt-4">
                    <button onClick={() => setIsChatOpen(true)} className="p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" title="Expand chat">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03-8-9 8a9.863 9.863 0 01-4.252-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default Sidebar;
