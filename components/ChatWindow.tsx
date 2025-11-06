
import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import MessageBubble from './MessageBubble';

interface ChatWindowProps {
    messages: ChatMessage[];
    isLoading: boolean;
    onSendMessage: (text: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onSendMessage }) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Manually scroll the chat window to the bottom
        // This is more reliable than scrollIntoView and prevents the whole page from scrolling
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    return (
        <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto bg-gray-900">
            <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((msg, index) => (
                    <MessageBubble key={`${msg.id}-${index}`} message={msg} onSendMessage={onSendMessage} />
                ))}
                {isLoading && (
                    <div className="flex items-center space-x-2">
                        <img src="https://picsum.photos/40/40?grayscale" alt="Jim" className="w-10 h-10 rounded-full" />
                        <div className="bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center space-x-1">
                                <span className="text-gray-400">Jim is typing</span>
                                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                )}
                {/* The empty div for scrolling to the end is no longer needed */}
            </div>
        </div>
    );
};

export default ChatWindow;
