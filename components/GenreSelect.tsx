
import React, { useState } from 'react';

interface GenreSelectProps {
    genres: string[];
    onSelectGenre: (genre: string) => void;
}

const GenreSelect: React.FC<GenreSelectProps> = ({ genres, onSelectGenre }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

    const handleSelect = (genre: string) => {
        setSelectedGenre(genre);
        onSelectGenre(genre);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            >
                <span className="block truncate">{selectedGenre || "Select a genre..."}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </span>
            </button>
            {isOpen && (
                <div className="absolute mt-1 w-full rounded-md bg-gray-800 shadow-lg z-10 border border-gray-700">
                    <ul className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        {genres.map((genre, index) => (
                            <li
                                key={index}
                                onClick={() => handleSelect(genre)}
                                className="text-gray-300 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-teal-600 hover:text-white"
                            >
                                <span className="font-normal block truncate">{genre}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default GenreSelect;
