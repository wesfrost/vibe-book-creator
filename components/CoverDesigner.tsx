
import React from 'react';
import { BookState } from '../types';

interface CoverDesignerProps {
    bookState: BookState;
}

const CoverDesigner: React.FC<CoverDesignerProps> = ({ bookState }) => {
    const { coverImages, coverImage } = bookState;

    return (
        <div className="p-6 overflow-y-auto flex-1 flex flex-col min-h-0">
            <h2 className="text-2xl font-bold text-teal-400 mb-6">🎨 AI Cover Design Studio</h2>
            
            {!coverImages && (
                <div className="text-center">
                    <p className="text-gray-300">Your AI is dreaming up cover concepts... 🎨</p>
                    <div className="mt-4 w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-teal-500 h-2.5 rounded-full animate-pulse"></div>
                    </div>
                </div>
            )}

            {coverImages && coverImages.length > 0 && (
                <div>
                    <p className="text-gray-300 mb-4">Here are a few concepts based on your book's vibe and symbolism. Select your favorite from the chat.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {coverImages.map((url, index) => (
                            <div 
                                key={index} 
                                className={`rounded-lg overflow-hidden border-4 transition-all duration-200 ${coverImage === url ? 'border-teal-400 shadow-2xl' : 'border-gray-700'}`}
                            >
                                <img src={url} alt={`Cover concept ${index + 1}`} className="w-full h-auto object-cover" />
                                <div className="text-center bg-gray-800 p-2 text-white">Option {index + 1}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoverDesigner;
