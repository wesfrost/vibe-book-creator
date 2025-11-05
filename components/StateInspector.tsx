
import React from 'react';
import { BookState } from '../types';

interface StateInspectorProps {
    bookState: BookState;
}

const StateInspector: React.FC<StateInspectorProps> = ({ bookState }) => {
    return (
        <div className="p-6 overflow-y-auto flex-1 bg-gray-900 text-xs text-gray-300 min-h-0">
            <h2 className="text-lg font-bold text-indigo-400 mb-4">🛠️ Live Book State</h2>
            <pre className="bg-gray-800 p-4 rounded-lg border border-gray-700 whitespace-pre-wrap word-wrap-break">
                <code>
                    {JSON.stringify(bookState, null, 2)}
                </code>
            </pre>
        </div>
    );
};

export default StateInspector;
