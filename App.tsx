
import React from 'react';
import { useAppLogic } from './hooks/useAppLogic';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';

export default function App() {
    const {
        mainView,
        selectedModelId,
        suggestions,
        setMainView,
        setSelectedModelId,
        handleUserAction,
        handleAcceptSuggestion,
        handleRejectSuggestion,
    } = useAppLogic();

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
            <Header selectedModelId={selectedModelId} setSelectedModelId={setSelectedModelId} />
            <div className="flex flex-row flex-1 overflow-hidden">
                <Sidebar onUserAction={handleUserAction} />
                <MainContent 
                    mainView={mainView} 
                    setMainView={setMainView} 
                    suggestions={suggestions} 
                    onAcceptSuggestion={handleAcceptSuggestion}
                    onRejectSuggestion={handleRejectSuggestion}
                />
            </div>
        </div>
    );
}
