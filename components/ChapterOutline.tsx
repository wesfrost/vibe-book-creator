
import React from 'react';
import { BookState } from '../types';

interface ChapterOutlineProps {
    bookState: BookState;
}

const ChapterOutline: React.FC<ChapterOutlineProps> = ({ bookState }) => {
    const hasOutline = bookState.globalOutline && bookState.globalOutline.length > 0;

    return (
        <div className="p-6 flex-1 flex flex-col min-h-0 h-full">
            <div className="mb-6 flex-shrink-0">
                <h2 className="text-3xl font-bold text-white">Chapter Outline</h2>
                <p className="text-gray-400 mt-1">This is the proposed structure for your book. Review the chapter titles and descriptions below.</p>
            </div>

            <div className="w-full max-w-4xl mx-auto space-y-4 overflow-y-auto">
                {hasOutline ? (
                    bookState.globalOutline.map((item, index) => (
                        <div key={index} className="p-4 border border-gray-700 rounded-lg bg-gray-800/50">
                            <h4 className="text-xl font-bold text-teal-400">{item.chapterTitle}</h4>
                            <p className="mt-2 text-gray-300">{item.chapterDescription}</p>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 italic mt-10">
                        <p>The AI is generating your chapter outline...</p>
                        <p>Once you complete Phase 2, the proposed outline will appear here for your review.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChapterOutline;
