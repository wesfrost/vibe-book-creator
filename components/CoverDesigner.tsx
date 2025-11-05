
import React, { useState, useEffect } from 'react';
import { BookState } from '../types';
import { generateCoverConcepts } from '../services/coverService';

interface CoverDesignerProps {
    bookState: BookState;
    onSelectCover: (imageUrl: string) => void;
}

const CoverDesigner: React.FC<CoverDesignerProps> = ({ bookState, onSelectCover }) => {
    const [coverOptions, setCoverOptions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCover, setSelectedCover] = useState<string | null>(null);

    useEffect(() => {
        const generateCovers = async () => {
            setIsLoading(true);
            const concepts = await generateCoverConcepts(bookState);
            setCoverOptions(concepts);
            setIsLoading(false);
        };

        generateCovers();
    }, [bookState]);

    const handleSelect = (imageUrl: string) => {
        setSelectedCover(imageUrl);
        onSelectCover(imageUrl);
    };

    return (
        <div className="p-6 overflow-y-auto flex-1 flex flex-col min-h-0">
            <h2 className="text-2xl font-bold text-teal-400 mb-6">🎨 AI Cover Design Studio</h2>
            
            {isLoading && (
                <div className="text-center">
                    <p className="text-gray-300">Your AI is dreaming up cover concepts... 🎨</p>
                    <div className="mt-4 w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-teal-500 h-2.5 rounded-full animate-pulse"></div>
                    </div>
                </div>
            )}

            {!isLoading && coverOptions.length > 0 && (
                <div>
                    <p className="text-gray-300 mb-4">Here are a few concepts based on your book's vibe and symbolism. Which one speaks to you?</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {coverOptions.map((url, index) => (
                            <div 
                                key={index} 
                                className={`cursor-pointer rounded-lg overflow-hidden border-4 transition-all duration-200 ${selectedCover === url ? 'border-teal-400 shadow-2xl' : 'border-gray-700 hover:border-teal-500'}`}
                                onClick={() => handleSelect(url)}
                            >
                                <img src={url} alt={`Cover concept ${index + 1}`} className="w-full h-auto object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoverDesigner;
