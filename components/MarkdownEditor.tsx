
import React from 'react';
import { BookState } from '../types';

interface MarkdownEditorProps {
    bookState: BookState;
    onContentChange: (chapterIndex: number, newContent: string) => void;
    exportBook: (format: 'kdp' | 'docx') => void;
}

const ChapterEditor: React.FC<{
    chapter: BookState['chapters'][0];
    index: number;
    onContentChange: (chapterIndex: number, newContent: string) => void;
}> = ({ chapter, index, onContentChange }) => {
    const [content, setContent] = React.useState(chapter.content);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        setContent(chapter.content);
    }, [chapter.content]);

    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [content]);

    const handleBlur = () => {
        onContentChange(index, content);
    };

    return (
        <div className="mb-8 p-4 border border-gray-700 rounded-lg bg-gray-800/50">
            <h3 className="text-xl font-bold text-teal-400 mb-4">{chapter.title || `Chapter ${index + 1}`}</h3>
            <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={handleBlur}
                className="w-full p-2 bg-gray-900 border-none rounded-md text-gray-200 resize-none overflow-hidden focus:ring-2 focus:ring-teal-500"
                placeholder="The AI is drafting..."
            />
        </div>
    );
};


const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ bookState, onContentChange, exportBook }) => {
    const hasChapters = bookState.chapters && bookState.chapters.length > 0;

    return (
        <div className="p-6 overflow-y-auto flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">{bookState.title || 'Your Manuscript'}</h2>
                {/* Export menu can stay */}
            </div>

            <div className="w-full max-w-4xl mx-auto">
                {hasChapters ? (
                    bookState.chapters.map((chapter, index) => (
                        <ChapterEditor
                            key={index}
                            index={index}
                            chapter={chapter}
                            onContentChange={onContentChange}
                        />
                    ))
                ) : (
                    <div className="text-center text-gray-500 italic mt-10">
                        <p>Your book's chapters will appear here as they are drafted.</p>
                        <p>Once you approve an outline, the AI will begin writing Chapter 1.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarkdownEditor;
