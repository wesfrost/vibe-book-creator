
import React from 'react';

type SidebarView = 'progress' | 'editor' | 'dev';

interface SidebarNavProps {
    activeView: SidebarView;
    onViewChange: (view: SidebarView) => void;
    isAutoMode: boolean;
    onToggleAutoMode: () => void;
    isDevMode: boolean;
    onToggleDevMode: () => void;
}

const NavItem: React.FC<{
    view: SidebarView;
    activeView: SidebarView;
    onClick: (view: SidebarView) => void;
    icon: React.ReactNode;
    label: string;
}> = ({ view, activeView, onClick, icon, label }) => {
    const isActive = activeView === view;
    return (
        <li>
            <button
                onClick={() => onClick(view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
            >
                {icon}
                <span>{label}</span>
            </button>
        </li>
    );
};


const SidebarNav: React.FC<SidebarNavProps> = ({ activeView, onViewChange, isAutoMode, onToggleAutoMode, isDevMode, onToggleDevMode }) => {
    return (
        <div className="p-4 flex flex-col h-full">
            <nav className="flex-grow">
                <ul className="space-y-1">
                    <NavItem
                        view="progress"
                        activeView={activeView}
                        onClick={onViewChange}
                        label="Book Progress"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                    />
                    <NavItem
                        view="editor"
                        activeView={activeView}
                        onClick={onViewChange}
                        label="Book Editor"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                    />
                    <NavItem
                        view="dev"
                        activeView={activeView}
                        onClick={onViewChange}
                        label="Dev State"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                    />
                </ul>
            </nav>

            <hr className="my-4 border-gray-700" />

            <div className="space-y-2 text-sm">
                 <div className="flex items-center justify-between p-2 rounded-md">
                    <label htmlFor="auto-pilot-toggle" className="font-medium text-gray-300 flex items-center gap-2 cursor-pointer">
                        <span className="text-base">🚀</span> Auto-Pilot
                    </label>
                    <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            id="auto-pilot-toggle" 
                            className="sr-only peer"
                            checked={isAutoMode}
                            onChange={onToggleAutoMode}
                        />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-teal-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                    </div>
                 </div>
                 <div className="flex items-center justify-between p-2 rounded-md">
                    <label htmlFor="dev-mode-toggle" className="font-medium text-gray-300 flex items-center gap-2 cursor-pointer">
                        <span className="text-base">🛠️</span> Dev Mode
                    </label>
                     <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            id="dev-mode-toggle" 
                            className="sr-only peer"
                            checked={isDevMode}
                            onChange={onToggleDevMode}
                        />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default SidebarNav;
