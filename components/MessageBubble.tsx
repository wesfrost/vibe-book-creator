

import React from 'react';
import { ChatMessage } from '../types';
import { renderMarkdown } from '../utils/markdownRenderer';

interface MessageBubbleProps {
    message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isJim = message.sender === 'jim';

    if (message.isAnalysis) {
        return (
             <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-700">
                    <span className="text-xl">📈</span>
                </div>
                <div className="flex flex-col items-start">
                     <div className="rounded-lg px-5 py-3 max-w-2xl bg-gray-800 border border-teal-500/30">
                        <h4 className="font-bold text-teal-400 mb-2">Jim's Bestseller Analysis</h4>
                        <div className="prose prose-invert prose-p:my-1 prose-h1:my-2 prose-h2:my-1 text-white text-sm">
                            {renderMarkdown(message.text)}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex items-start gap-4 ${isJim ? '' : 'flex-row-reverse'}`}>
            {isJim && <img src="https://picsum.photos/40/40?grayscale" alt="Jim" className="w-10 h-10 rounded-full flex-shrink-0" />}
            <div className={`flex flex-col ${isJim ? 'items-start' : 'items-end'}`}>
                 <div className={`relative rounded-lg px-5 py-3 max-w-2xl ${isJim ? 'bg-gray-700' : 'bg-teal-600'}`}>
                    <div className="prose prose-invert prose-p:my-1 prose-h1:my-2 prose-h2:my-1 text-white">
                        {renderMarkdown(message.text)}
                    </div>
                </div>
                 {message.isAuto && (
                    <div className="text-xs text-gray-500 mt-1 italic">
                        🚀 Auto-pilot
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;