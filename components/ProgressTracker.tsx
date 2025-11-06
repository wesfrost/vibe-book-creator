
import React from 'react';
import { ProgressPhase } from '../types';

interface ProgressTrackerProps {
    progress: ProgressPhase[];
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ progress }) => {
    return (
        <div className="p-6 h-full flex flex-col">
            <h2 className="text-2xl font-bold text-teal-400 mb-6 flex-shrink-0">🚀 Book Progress</h2>
            <div className="overflow-y-auto">
                <div className="space-y-6">
                    {progress.map((phase, phaseIndex) => (
                        <div key={phaseIndex}>
                            <h3 className="font-semibold text-lg mb-2 text-gray-300">{phase.name}</h3>
                            <ul className="space-y-2">
                                {phase.steps.map((step, stepIndex) => (
                                    <li key={stepIndex} className={`flex items-center transition-all duration-300 ${step.completed ? 'text-green-400' : 'text-gray-400'}`}>
                                        <span className="mr-3 text-lg">{step.completed ? '✅' : '⬜'}</span>
                                        <span className={step.completed ? 'line-through' : ''}>{step.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProgressTracker;
