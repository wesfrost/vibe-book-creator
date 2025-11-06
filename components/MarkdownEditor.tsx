
import React, { useState, useRef, useEffect } from 'react';
import { BookState } from '../types';
import { renderMarkdown } from '../utils/markdownRenderer';

interface MarkdownEditorProps {
    bookState: BookState;
    activeChapterIndex: number;
    onContentChange: (newContent: string) => void;
    exportBook: (format: 'kdp' | 'docx') => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ bookState, activeChapterIndex, onContentChange, exportBook }) => {
    const activeChapter = bookState.chapters[activeChapterIndex];
    const [editableContent, setEditableContent] = useState(activeChapter?.content || '');

    useEffect(() => {
        // Sync local state when the active chapter's content changes from the parent
        setEditableContent(activeChapter?.content || '');
    }, [activeChapter, activeChapterIndex]);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditableContent(e.target.value);
    };

    const handleBlur = () => {
        // Propagate changes to the parent state only when the user is done editing
        onContentChange(editableContent);
    };

    return (
        <div className="p-6 overflow-y-auto flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-400">📖 {activeChapter?.title || 'Editor'}</h2>
                {/* Export menu can remain the same */}
            </div>
            
            <div className="flex-1 flex flex-col min-h-0">
                <textarea
                    value={editableContent}
                    onChange={handleContentChange}
                    onBlur={handleBlur}
                    className="w-full h-full p-4 bg-gray-900 border border-gray-700 rounded-md text-gray-200 resize-none focus:ring-2 focus:ring-teal-500"
                    placeholder="The AI is drafting your chapter..."
                />
            </div>
        </div>
    );
};

export default MarkdownEditor;
