
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
            // Special rendering for the chapter outline
            if (label === 'Chapter Outline' && value.length > 0 && typeof value[0] === 'object') {
                return (
                    <div className="space-y-2">
                        {value.map((item, index) => (
                            <div key={index} className="pl-4 border-l-2 border-gray-600">
                                <h4 className="font-semibold text-gray-200">{item.title}</h4>
                                <p className="text-gray-400 text-sm">{item.summary}</p>
                            </div>
                        ))}
                    </div>
                );
            }
            // Generic array rendering
            return (
                <ul className="list-disc list-inside pl-2 text-gray-300">
                    {value.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            );
        }
        if (typeof value === 'string') {
            // Use markdown for longer text
            if (value.length > 100) {
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
        { label: 'Title', value: bookState.title },
        { label: 'Format', value: bookState.format },
        { label: 'Genre', value: bookState.genre },
        { label: 'Core Idea', value: bookState.coreIdea },
        { label: 'Vibe', value: bookState.vibe },
        { label: 'Target Audience', value: bookState.audience },
        { label: 'Main Storyline', value: bookState.storyline },
        { label: 'Storyline Rationale', value: bookState.storylineRationale },
        { label: 'Key Characters', value: bookState.characters },
        { label: 'Characters Rationale', value: bookState.charactersRationale },
        { label: 'Chapter Outline', value: bookState.chapters },
        // Add marketing materials once the data structure is finalized
        // { label: 'Marketing Keywords', value: bookState.marketing?.keywords },
        // { label: 'Marketing Blurb', value: bookState.marketing?.blurb },
    ];

    return (
        <div className="p-6 flex flex-col h-full">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 flex-shrink-0">
                <span className="text-3xl">📘</span>
                Live Book Dashboard
            </h2>
            <div className="overflow-y-auto">
                <div className="space-y-6 max-w-4xl mx-auto">
                    {stateEntries.map(({ label, value }) => (
                        <StateItem key={label} label={label} value={value} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BookStateViewer;
