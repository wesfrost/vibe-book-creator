

import React, { useState } from 'react';
import { ChatMessage, BrainstormingIdea } from '../types';

interface UserInputProps {
    onSendMessage: (text: string) => void;
    isLoading: boolean;
    lastMessage?: ChatMessage;
    brainstormSuggestions: BrainstormingIdea[];
    isBrainstorming: boolean;
}

const UserInput: React.FC<UserInputProps> = ({ onSendMessage, isLoading, lastMessage, brainstormSuggestions, isBrainstorming }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && !isLoading) {
            onSendMessage(inputValue.trim());
            setInputValue('');
        }
    };
    
    const handleOptionClick = (title: string) => {
        onSendMessage(title);
    };

    const handleSuggestionClick = (suggestion: BrainstormingIdea) => {
        onSendMessage(suggestion.idea);
    };

    const hasOptions = lastMessage?.sender === 'jim' && lastMessage.options && lastMessage.options.length > 0;
    const hasChapterIdea = lastMessage?.sender === 'jim' && lastMessage.chapterIdea;

    return (
        <div className="p-6 bg-gray-800 border-t border-gray-700">
            <div className="max-w-4xl mx-auto">
                {hasChapterIdea && (
                    <div className="mb-4 p-4 bg-gray-700/50 border border-teal-500/30 rounded-lg">
                        <h4 className="font-bold text-teal-400 mb-1">{lastMessage.chapterIdea?.title}</h4>
                        <p className="text-sm italic text-gray-300">{lastMessage.chapterIdea?.idea}</p>
                    </div>
                )}
                {hasOptions && (
                     <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                             {lastMessage.options?.map((opt, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleOptionClick(opt.title)}
                                    disabled={isLoading}
                                    className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium py-1.5 px-4 rounded-full transition-colors duration-200 disabled:opacity-50"
                                    title={`${opt.description || ''}${opt.description && opt.rationale ? ' \n\nRationale: ' : ''}${opt.rationale || ''}`}
                                >
                                    {opt.title}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {(isBrainstorming || brainstormSuggestions.length > 0) && (
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">💡 Research-Backed Ideas</h4>
                        {isBrainstorming ? (
                             <div className="text-sm text-gray-500 italic">Jim is researching best-sellers...</div>
                        ) : (
                             <div className="flex flex-wrap gap-2">
                                {brainstormSuggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="bg-gray-700/50 hover:bg-gray-600 text-gray-200 text-sm py-1 px-3 rounded-full transition-colors"
                                        title={suggestion.rationale}
                                    >
                                        {suggestion.idea}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex items-center space-x-4">
                    <input
                        id="main-input"
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={isLoading ? "Jim is working..." : "Type your message or idea..."}
                        disabled={isLoading}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-full py-3 px-6 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white placeholder-gray-400 disabled:opacity-60"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UserInput;