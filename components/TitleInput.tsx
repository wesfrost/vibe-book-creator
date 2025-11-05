
import React, { useState, useEffect, useRef } from 'react';

interface TitleInputProps {
    options: { title: string; description?: string; rationale?: string }[];
    onSendMessage: (text: string) => void;
    isLoading: boolean;
}

const TitleInput: React.FC<TitleInputProps> = ({ options, onSendMessage, isLoading }) => {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleSelect = (title: string) => {
        setInputValue(title);
        onSendMessage(title);
        setIsOpen(false);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && !isLoading) {
            onSendMessage(inputValue);
            setInputValue('');
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [containerRef]);

    return (
        <div className="relative w-full" ref={containerRef}>
             {isOpen && options.length > 0 && (
                <div className="absolute bottom-full mb-2 w-full rounded-md bg-gray-800 shadow-lg z-20 border border-gray-700">
                    <ul className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        {options.map((option, index) => (
                            <li
                                key={index}
                                onClick={() => handleSelect(option.title)}
                                className="text-gray-300 cursor-pointer select-none relative py-2 pl-4 pr-4 hover:bg-teal-600 hover:text-white flex items-start gap-3"
                            >
                                <span className="text-teal-400 text-lg mt-0.5">✨</span>
                                <div>
                                    <p className="font-semibold text-white">{option.title}</p>
                                    <p className="text-xs text-gray-400">{option.description}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                 <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Select a title above or type your own..."
                    className="flex-grow bg-gray-700 text-gray-200 rounded-lg border border-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow duration-200 px-4 py-2"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="flex-shrink-0 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                    aria-label="Send message"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default TitleInput;
