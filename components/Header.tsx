
import React from 'react';
import { AI_MODELS } from '../config/aiModels';

interface HeaderProps {
    selectedModelId: string;
    setSelectedModelId: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ selectedModelId, setSelectedModelId }) => {
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = React.useState(false);
    const headerMenuRef = React.useRef<HTMLDivElement>(null);

    return (
        <header className="flex-shrink-0 flex items-center justify-between p-2 border-b border-gray-700 bg-gray-800 shadow-sm">
            <div className="flex items-center"><h1 className="text-lg font-semibold text-white ml-2">Vibe Book Creator</h1></div>
            <div className="flex items-center">
                <div className="relative ml-2" ref={headerMenuRef}>
                    <button onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 transition-colors" aria-label="More options">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                    {isHeaderMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-700 rounded-md shadow-lg z-10 border border-gray-600">
                            <div className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="ai-model-select" className="font-medium text-gray-200 flex items-center gap-2"><span className="text-base">🧠</span> AI Model</label>
                                    <select id="ai-model-select" value={selectedModelId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedModelId(e.target.value)} className="w-full p-2 bg-gray-600 rounded-md text-white border border-gray-500 focus:ring-2 focus:ring-teal-400">
                                        {AI_MODELS.filter(model => model.active).map(model => (<option key={model.id} value={model.id}>{model.displayName}</option>))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
