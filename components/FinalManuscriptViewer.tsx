
import React from 'react';
import { BookState } from '../types';
import { marked } from 'marked';

interface FinalManuscriptViewerProps {
    bookState: BookState;
}

const FinalManuscriptViewer: React.FC<FinalManuscriptViewerProps> = ({ bookState }) => {
    if (!bookState.chapters || bookState.chapters.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-teal-400 mb-4">Manuscript Not Yet Available</h2>
                <p className="text-gray-300">The full manuscript will be displayed here once the final review is complete.</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6 md:p-8 bg-gray-900 rounded-lg shadow-lg custom-scrollbar">
            <h1 className="text-4xl font-bold text-center text-teal-400 mb-4">{bookState.title}</h1>
            <h2 className="text-2xl text-center text-gray-300 mb-8">{bookState.genre}</h2>
            
            {bookState.chapters.map((chapter, index) => (
                <div key={index} className="mb-12">
                    <h3 className="text-3xl font-bold text-teal-500 border-b-2 border-teal-500 pb-2 mb-6">
                        Chapter {chapter.chapterNumber}: {chapter.title}
                    </h3>
                    <div 
                        className="prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: marked(chapter.content) }} 
                    />
                </div>
            ))}
        </div>
    );
};

export default FinalManuscriptViewer;
