
import React from 'react';
import ViewToggle from './ViewToggle';
import BookStateViewer from './BookStateViewer';
import ChapterOutline from './ChapterOutline';
import MarkdownEditor from './MarkdownEditor';
import ProgressTracker from './ProgressTracker';
import { useBookStore } from '../store/useBookStore';

type MainView = 'progress' | 'editor' | 'dashboard' | 'outline';

interface MainContentProps {
    mainView: MainView;
    setMainView: (view: MainView) => void;
}

const findLastIndex = <T,>(arr: T[], predicate: (value: T, index: number, obj: T[]) => unknown): number => {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (predicate(arr[i], i, arr)) {
            return i;
        }
    }
    return -1;
};

const MainContent: React.FC<MainContentProps> = ({ mainView, setMainView }) => {
    const { bookState, progress, updateChapterDetails } = useBookStore();
    
    const getEditorChapterIndex = (): number => {
        // If we are actively editing a chapter, use that index
        if (bookState.editingChapterIndex !== undefined) {
            return bookState.editingChapterIndex;
        }
        
        // Otherwise, find the last chapter that was drafted
        const lastDraftedIndex = findLastIndex(bookState.chapters, c => c.status === 'drafted' || c.status === 'reviewed');
        if (lastDraftedIndex !== -1) {
            return lastDraftedIndex;
        }

        // Default to the first chapter if none are drafted or being edited
        return 0;
    };

    const handleContentChange = (chapterIndex: number, newContent: string) => {
        updateChapterDetails(chapterIndex, { content: newContent });
    };

    const editorChapterIndex = getEditorChapterIndex();

    return (
        <main className="flex-1 flex flex-col min-w-0 h-full bg-gray-850">
            <div className="flex-shrink-0 p-3 border-b border-gray-700 bg-gray-800 flex items-center justify-between shadow-md">
                <div className="flex items-center space-x-2 bg-gray-900 p-1 rounded-lg">
                    <ViewToggle label="Dashboard" view="dashboard" activeView={mainView} onClick={setMainView} />
                    <ViewToggle label="Outline" view="outline" activeView={mainView} onClick={setMainView} />
                    <ViewToggle label="Editor" view="editor" activeView={mainView} onClick={setMainView} />
                    <ViewToggle label="Progress" view="progress" activeView={mainView} onClick={setMainView} />
                </div>
            </div>
            <div className="flex-1 p-4 md:p-6 min-h-0">
                {mainView === 'dashboard' && <BookStateViewer bookState={bookState} />}
                {mainView === 'outline' && <ChapterOutline bookState={bookState} />}
                {mainView === 'editor' && (
                    <MarkdownEditor 
                        chapterIndex={editorChapterIndex}
                        bookState={bookState} 
                        onContentChange={handleContentChange} 
                        exportBook={() => {}} 
                    />
                )}
                {mainView === 'progress' && <ProgressTracker progress={progress} bookState={bookState} />}
            </div>
        </main>
    );
};

export default MainContent;
