import React from 'react';
import { BookState, Chapter } from '../types';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { marked } from 'marked';

// A single chapter editor component
const ChapterEditor: React.FC<{
    chapter: Chapter;
    index: number;
    onContentChange: (index: number, content: string) => void;
    isActive: boolean;
    onClick: () => void;
}> = ({ chapter, index, onContentChange, isActive, onClick }) => {
    return (
        <div id={`chapter-${index}`} className={`p-4 rounded-lg transition-all duration-300 ${isActive ? 'bg-gray-700' : ''}`}>
            <h3 
                className="text-2xl font-bold text-teal-400 mb-4 cursor-pointer"
                onClick={onClick}
            >
                {chapter.title}
            </h3>
            {isActive && (
                <textarea
                    value={chapter.content}
                    onChange={(e) => onContentChange(index, e.target.value)}
                    className="w-full h-96 p-4 bg-gray-900 border border-gray-600 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-200"
                    placeholder={`Drafting content for ${chapter.title}...`}
                />
            )}
        </div>
    );
};


// The main markdown editor view with sidebar
const MarkdownEditor: React.FC<{
    bookState: BookState;
    onContentChange: (chapterIndex: number, newContent: string) => void;
    exportBook: () => void; // Keeping this prop for future use
}> = ({ bookState, onContentChange }) => {

    const [activeChapterIndex, setActiveChapterIndex] = React.useState(0);

    // This effect ensures that when a new chapter is drafted, it becomes the active one.
    React.useEffect(() => {
        const lastDraftedIndex = findLastIndex(bookState.chapters, c => c.status === 'drafted');
        if (lastDraftedIndex !== -1) {
            setActiveChapterIndex(lastDraftedIndex);
        } else if (bookState.chapters.length > 0) {
            setActiveChapterIndex(0);
        }
    }, [bookState.chapters]);

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

    return (
        <div className="flex h-full bg-gray-850">
            {/* Sidebar */}
            <aside className="w-1/4 max-w-xs h-full bg-gray-800 p-4 overflow-y-auto border-r border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Chapters</h2>
                <nav>
                    <ul>
                        {hasChapters ? bookState.chapters.map((chapter, index) => (
                            <li key={index} className="mb-2">
                                <a
                                    href={`#chapter-${index}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setActiveChapterIndex(index);
                                        document.getElementById(`chapter-${index}`)?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className={`block p-2 rounded-md text-sm transition-colors ${
                                        activeChapterIndex === index
                                            ? 'bg-teal-500 text-white font-semibold'
                                            : 'text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {index + 1}. {chapter.title}
                                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                        chapter.status === 'drafted' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                                    }`}>
                                        {chapter.status}
                                    </span>
                                </a>
                            </li>
                        )) : (
                            <p className="text-gray-500 text-sm italic">No chapters yet.</p>
                        )}
                    </ul>
                </nav>
                 <div className="mt-6">
                    <button
                        onClick={handleExport}
                        className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-500 transition-colors duration-200"
                    >
                        Export as HTML
                    </button>
                </div>
            </aside>

            {/* Main Editor Content */}
            <main className="flex-1 h-full overflow-y-auto p-6">
                <div className="w-full max-w-4xl mx-auto">
                    {hasChapters ? (
                        bookState.chapters.map((chapter, index) => (
                            <ChapterEditor
                                key={index}
                                index={index}
                                chapter={chapter}
                                onContentChange={onContentChange}
                                isActive={index === activeChapterIndex}
                                onClick={() => setActiveChapterIndex(index)}
                            />
                        ))
                    ) : (
                        <div className="text-center text-gray-500 italic mt-10">
                            <p>Your book's chapters will appear here as they are drafted.</p>
                            <p>Once you approve an outline, the AI will begin writing Chapter 1.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

// Helper function to find the index of the last element in an array that satisfies a condition.
function findLastIndex<T>(array: T[], predicate: (value: T, index: number, obj: T[]) => boolean): number {
    for (let i = array.length - 1; i >= 0; i--) {
        if (predicate(array[i], i, array)) {
            return i;
        }
    }
    return -1;
}

export default MarkdownEditor;
