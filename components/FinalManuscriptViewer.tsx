
import React from 'react';
import { BookState } from '../types';

interface FinalManuscriptViewerProps {
    bookState: BookState;
    onContentChange: (chapterIndex: number, newContent: string) => void;
}

const FinalManuscriptViewer: React.FC<FinalManuscriptViewerProps> = ({ bookState, onContentChange }) => {
    const chapterRefs = React.useRef<React.RefObject<HTMLDivElement>[]>([]);
    if (chapterRefs.current.length !== bookState.chapters.length) {
        chapterRefs.current = Array(bookState.chapters.length).fill(null).map((_, i) => chapterRefs.current[i] || React.createRef());
    }

    const scrollToChapter = (index: number) => {
        chapterRefs.current[index].current?.scrollIntoView({ behavior: 'smooth' });
    };

    if (!bookState.chapters || bookState.chapters.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-teal-400 mb-4">Manuscript Not Yet Available</h2>
                <p className="text-gray-300">The full manuscript will be displayed here once the final review is complete.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex">
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-900 rounded-lg shadow-lg custom-scrollbar">
                <h1 className="text-4xl font-bold text-center text-teal-400 mb-4">{bookState.title}</h1>
                <h2 className="text-2xl text-center text-gray-300 mb-8">{bookState.genre}</h2>
                
                {bookState.chapters.map((chapter, index) => (
                    <div key={index} ref={chapterRefs.current[index]} className="mb-12">
                        <h3 className="text-3xl font-bold text-teal-500 border-b-2 border-teal-500 pb-2 mb-6">
                            Chapter {chapter.chapterNumber}: {chapter.title}
                        </h3>
                        <textarea
                            value={chapter.content}
                            onChange={(e) => onContentChange(index, e.target.value)}
                            className="w-full h-96 p-4 bg-gray-800 border border-gray-600 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-200"
                        />
                    </div>
                ))}
            </div>
            <div className="w-64 overflow-y-auto p-4 bg-gray-800">
                <h3 className="text-lg font-bold mb-4 text-teal-400">Chapters</h3>
                <div className="space-y-2">
                    {bookState.chapters.map((chapter, index) => (
                        <div 
                            key={index} 
                            onClick={() => scrollToChapter(index)}
                            className="p-2 bg-gray-700 rounded-md cursor-pointer hover:bg-gray-600"
                        >
                            <p className="text-sm font-semibold text-white truncate">{chapter.title}</p>
                            <p className="text-xs text-gray-400 truncate">{chapter.content.substring(0, 50)}...</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FinalManuscriptViewer;
