
import React, { useState, useEffect } from 'react';
import { BookState, Chapter, Suggestion } from '../types';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { marked } from 'marked';

const MarkdownEditor: React.FC<{
    bookState: BookState;
    chapterIndex: number;
    onContentChange: (chapterIndex: number, newContent: string) => void;
    exportBook: () => void;
    suggestions: Suggestion[];
    onAcceptSuggestion: (suggestion: Suggestion) => void;
    onRejectSuggestion: (suggestion: Suggestion) => void;
}> = ({ bookState, chapterIndex, onContentChange, suggestions, onAcceptSuggestion, onRejectSuggestion }) => {
    const [activeChapterIndex, setActiveChapterIndex] = useState(chapterIndex);

    useEffect(() => {
        setActiveChapterIndex(chapterIndex);
    }, [chapterIndex]);

    const handleExport = async () => {
        const zip = new JSZip();
        for (let i = 0; i < bookState.chapters.length; i++) {
            const chapter = bookState.chapters[i];
            const htmlContent = marked(chapter.content);
            const styledHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${chapter.title}</title>
                    <style>
                        body { font-family: sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
                        h1 { color: #111; }
                    </style>
                </head>
                <body>
                    <h1>${chapter.title}</h1>
                    ${htmlContent}
                </body>
                </html>
            `;
            zip.file(`Chapter-${i + 1}-${chapter.title.replace(/ /g, '_')}.html`, styledHtml);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, 'MyBook.zip');
    };

    const hasChapters = bookState && Array.isArray(bookState.chapters) && bookState.chapters.length > 0;
    const activeChapter = hasChapters ? bookState.chapters[activeChapterIndex] : null;

    return (
        <div className="flex flex-col h-full bg-gray-850">
            <header className="flex-shrink-0 p-3 border-b border-gray-700 bg-gray-800 flex items-center justify-between shadow-md">
                {hasChapters && (
                    <select
                        value={activeChapterIndex}
                        onChange={(e) => setActiveChapterIndex(Number(e.target.value))}
                        className="bg-gray-700 text-white rounded-md p-2"
                    >
                        {bookState.chapters.map((chapter, index) => (
                            <option key={index} value={index}>
                                {index + 1}. {chapter.title}
                            </option>
                        ))}
                    </select>
                )}
                <button
                    onClick={handleExport}
                    className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-500 transition-colors duration-200"
                >
                    Export as HTML
                </button>
            </header>
            <main className="flex-1 p-4 md:p-6 min-h-0 flex">
                <div className="flex-1">
                    {activeChapter ? (
                        <textarea
                            key={activeChapterIndex} // Force re-render on chapter change
                            value={activeChapter.content}
                            onChange={(e) => onContentChange(activeChapterIndex, e.target.value)}
                            className="w-full h-full p-4 bg-gray-900 border border-gray-600 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-200"
                            placeholder={`Drafting content for ${activeChapter.title}...`}
                        />
                    ) : (
                        <div className="text-center text-gray-500 italic mt-10">
                            <p>Your book's chapters will appear here as they are drafted.</p>
                            <p>Once you approve an outline, the AI will begin writing Chapter 1.</p>
                        </div>
                    )}
                </div>
                <div className="w-1/3 p-4 overflow-y-auto">
                    <h3 className="text-lg font-bold mb-4">Suggestions</h3>
                    {suggestions.map((suggestion, index) => (
                        <div key={index} className="bg-gray-700 p-4 rounded-md mb-4">
                            <p className="text-sm text-gray-400">{suggestion.rationale}</p>
                            <div className="mt-2">
                                <p className="text-xs text-red-400 line-through">{suggestion.originalText}</p>
                                <p className="text-xs text-green-400">{suggestion.proposedChange}</p>
                            </div>
                            <div className="mt-2 flex justify-end">
                                <button onClick={() => onAcceptSuggestion(suggestion)} className="text-xs bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-2 rounded mr-2">Accept</button>
                                <button onClick={() => onRejectSuggestion(suggestion)} className="text-xs bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-2 rounded">Reject</button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default MarkdownEditor;
