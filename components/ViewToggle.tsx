
import React from 'react';

type MainView = 'progress' | 'editor' | 'dashboard' | 'outline' | 'manuscript';

interface ViewToggleProps {
    label: string;
    view: MainView;
    activeView: MainView;
    onClick: (view: MainView) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ label, view, activeView, onClick }) => {
    const isActive = activeView === view;
    return (
        <button
            onClick={() => onClick(view)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none ${
                isActive
                    ? 'bg-teal-500 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
        >
            {label}
        </button>
    );
};

export default ViewToggle;
