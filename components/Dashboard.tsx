
import React from 'react';
import { BookState } from '../types';

interface DashboardProps {
    bookState: BookState;
}

const Dashboard: React.FC<DashboardProps> = ({ bookState }) => {
    const { title, genre, vibe, audience, chapters } = bookState;
    const wordCount = chapters.reduce((acc, chapter) => acc + (chapter.content.split(' ').length || 0), 0);

    return (
        <div className="h-full overflow-y-auto p-6 md:p-8 bg-gray-900 rounded-lg shadow-lg custom-scrollbar">
            <h1 className="text-3xl font-bold text-teal-400 mb-6">Project Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Book Details */}
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-teal-500 mb-4">At a Glance</h2>
                    <p><span className="font-bold">Title:</span> {title || 'Not Set'}</p>
                    <p><span className="font-bold">Genre:</span> {genre || 'Not Set'}</p>
                    <p><span className="font-bold">Vibe:</span> {vibe || 'Not Set'}</p>
                    <p><span className="font-bold">Audience:</span> {audience || 'Not Set'}</p>
                </div>

                {/* Progress */}
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-teal-500 mb-4">Progress</h2>
                    <p><span className="font-bold">Chapters:</span> {chapters.length}</p>
                    <p><span className="font-bold">Word Count:</span> {wordCount.toLocaleString()}</p>
                </div>

                {/* Raw State */}
                <div className="bg-gray-800 p-6 rounded-lg md:col-span-2 lg:col-span-1">
                    <h2 className="text-xl font-semibold text-teal-500 mb-4">Raw State</h2>
                    <pre className="text-xs bg-gray-900 p-4 rounded-md overflow-auto custom-scrollbar">
                        {JSON.stringify(bookState, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
