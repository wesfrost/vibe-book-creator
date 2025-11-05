
import React from 'react';
import { BookState } from '../types';
import { renderMarkdown } from '../utils/markdownRenderer';

interface BookStateViewerProps {
    bookState: BookState;
}

const StateItem: React.FC<{ label: string; value: any }> = ({ label, value }) => {
    if (!value) return null;

    const renderValue = () => {
        if (Array.isArray(value)) {
            return (
                <ul className="list-disc list-inside pl-2 text-gray-300">
                    {value.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            );
        }
        if (typeof value === 'string') {
             // A simple check to see if it's a long block of text
            if (value.length > 200) {
                 return (
                    <div className="prose prose-sm prose-invert max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }} />
                );
            }
            return <p className="text-gray-300">{value}</p>;
        }
        return <p className="text-gray-300">{String(value)}</p>;
    };

    return (
        <div className="border-b border-gray-700 pb-3">
            <h3 className="font-semibold text-teal-400 mb-1">{label}</h3>
            {renderValue()}
        </div>
    );
};

const BookStateViewer: React.FC<BookStateViewerProps> = ({ bookState }) => {
    const stateEntries = [
        { label: 'Working Title', value: bookState.workingTitle },
        { label: 'Final Title', value: bookState.title },
        { label: 'Book Format', value: bookState['Book Format Selected'] },
        { label: 'Genre', value: bookState['Genre Defined'] },
        { label: 'Chapter Count', value: bookState.chapterCount },
        { label: 'Core Idea', value: bookState['Core Idea Locked In'] },
        { label: 'Vibe', value: bookState['Vibe Defined'] },
        { label: 'Target Audience', value: bookState['Target Audience Identified'] },
        { label: 'Main Storyline', value: bookState['Main Storyline Solidified'] },
        { label: 'Key Characters', value: bookState['Key Characters Defined'] },
        { label: 'Global Outline', value: bookState.globalOutline },
        { label: 'KDP Keywords', value: bookState.kdpKeywords },
        { label: 'Book Categories', value: bookState.bookCategories },
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">📘</span>
                Live Book Dashboard
            </h2>
            <div className="space-y-6">
                {stateEntries.map(({ label, value }) => (
                    <StateItem key={label} label={label} value={value} />
                ))}
            </div>
        </div>
    );
};

export default BookStateViewer;
