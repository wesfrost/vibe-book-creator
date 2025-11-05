import React, { useState } from 'react';

interface UserInputProps {
    onSendMessage: (text: string) => void;
    isLoading: boolean;
}

const UserInput: React.FC<UserInputProps> = ({ onSendMessage, isLoading }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && !isLoading) {
            onSendMessage(inputValue.trim());
            setInputValue('');
        }
    };

    return (
        <div className="p-6 bg-gray-800 border-t border-gray-700">
            <div className="max-w-4xl mx-auto">
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