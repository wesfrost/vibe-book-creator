
import React, { useState, useRef, useEffect } from 'react';
import { BookState } from '../types';
import { renderMarkdown } from '../utils/markdownRenderer';
import { exportAsDocx, exportAsMarkdown, exportAsTxt } from '../services/exportService';

interface MarkdownEditorProps {
    bookState: BookState;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ bookState }) => {
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const handleExport = (format: 'docx' | 'md' | 'txt') => {
        const title = (bookState['Core Idea Locked In'] as string)?.replace(/\s+/g, '-') || 'manuscript';
        switch(format) {
            case 'docx':
                exportAsDocx(bookState, title);
                break;
            case 'md':
                exportAsMarkdown(bookState, title);
                break;
            case 'txt':
                exportAsTxt(bookState, title);
                break;
        }
        setIsExportMenuOpen(false);
    };

    const handleCopyChapter = (content: string) => {
        navigator.clipboard.writeText(content)
            .then(() => alert('Chapter content copied to clipboard!'))
            .catch(err => console.error('Failed to copy chapter content: ', err));
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [exportMenuRef]);

    const hasChapters = bookState.chapters && bookState.chapters.length > 0;
    const hasOutline = bookState.globalOutline && bookState.globalOutline.length > 0;

    return (
        <div className="p-6 overflow-y-auto flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-400">📖 Your Manuscript</h2>
                 <div className="relative" ref={exportMenuRef}>
                    <button 
                        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                        disabled={!hasChapters && !hasOutline}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm py-2 px-4 rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export Manuscript
                        <svg className={`w-4 h-4 ml-1 transform transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    {isExportMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10 border border-gray-600">
                            <ul className="py-1">
                                <li>
                                    <button onClick={() => handleExport('docx')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-indigo-500 flex items-center gap-2">
                                        <span className="font-mono text-xs bg-gray-600 px-1 rounded">.docx</span> Microsoft Word
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => handleExport('md')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-indigo-500 flex items-center gap-2">
                                        <span className="font-mono text-xs bg-gray-600 px-1 rounded">.md</span> Markdown
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => handleExport('txt')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-indigo-500 flex items-center gap-2">
                                        <span className="font-mono text-xs bg-gray-600 px-1 rounded">.txt</span> Plain Text
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
             <div className="space-y-4">
                {!hasChapters && !hasOutline ? (
                    <p className="text-gray-400 italic mt-4">Your outline and chapters will appear here as you progress...</p>
                ) : null}

                {hasOutline && (
                     <details 
                        className="bg-gray-800/50 rounded-lg border border-gray-700 transition-all duration-300"
                        open
                    >
                        <summary className="p-4 cursor-pointer hover:bg-gray-700/50 flex justify-between items-center list-none">
                            <span className="font-bold text-lg text-gray-200">Global Outline</span>
                            <span className="text-xs text-gray-400 transform transition-transform details-arrow">-</span>
                        </summary>
                         <style>{`
                            details > summary::-webkit-details-marker { display: none; }
                            details[open] .details-arrow { transform: rotate(45deg); }
                        `}</style>
                        <div className="p-6 border-t border-gray-700 bg-gray-900/50">
                            <div className="prose prose-invert prose-p:my-2 max-w-none text-gray-200">
                                {renderMarkdown(bookState.globalOutline!)}
                            </div>
                        </div>
                    </details>
                )}
                
                {hasChapters && bookState.chapters.map((chapter, index) => (
                    <details 
                        key={index} 
                        className="bg-gray-800/50 rounded-lg border border-gray-700 transition-all duration-300"
                        open={index === bookState.chapters.length - 1}
                    >
                        <summary className="p-4 cursor-pointer hover:bg-gray-700/50 flex justify-between items-center list-none">
                            <span className="font-bold text-lg text-gray-200">{chapter.title}</span>
                            <span className="text-xs text-gray-400 transform transition-transform details-arrow">-</span>
                        </summary>
                        <style>{`
                            details > summary::-webkit-details-marker { display: none; }
                            details[open] .details-arrow { transform: rotate(45deg); }
                        `}</style>
                        <div className="p-6 border-t border-gray-700 bg-gray-900/50">
                            <div className="prose prose-invert prose-p:my-2 prose-h1:my-4 prose-h2:my-2 max-w-none text-gray-200">
                                {renderMarkdown(chapter.content || "Chapter content is being drafted...")}
                            </div>
                             <button 
                                onClick={() => handleCopyChapter(chapter.content)}
                                className="mt-4 bg-gray-700 hover:bg-indigo-500 text-white text-xs py-1 px-3 rounded-md transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                                disabled={!chapter.content}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                Copy Chapter
                            </button>
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
};

export default MarkdownEditor;