
import React from 'react';

type MainView = 'progress' | 'editor' | 'dashboard' | 'outline';

interface ViewToggleProps {
    label: string;
    view: MainView;
    activeView: MainView;
    onClick: (view: MainView) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ label, view, activeView, onClick }) => (
    <button onClick={() => onClick(view)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${activeView === view ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
        {label}
    </button>
);

export default ViewToggle;
