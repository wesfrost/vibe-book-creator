
import { ProgressPhase } from '../types';

export const FICTION_PROGRESS: ProgressPhase[] = [
    {
        name: 'Phase 1: Concept & Research',
        steps: [
            { name: 'Book Format Selected', completed: false },
            { name: 'Genre Defined', completed: false },
            { name: 'Working Title Defined', completed: false },
            { name: 'Core Idea Locked In', completed: false },
            { name: 'Vibe Defined', completed: false },
            { name: 'Target Audience Identified', completed: false },
        ]
    },
    {
        name: 'Phase 2: Structure & Character Development',
        steps: [
            { name: 'Main Storyline Solidified', completed: false },
            { name: 'Protagonist Defined', completed: false },
            { name: 'Antagonist Defined', completed: false },
            { name: 'Supporting Characters Defined', completed: false },
            { name: 'Number of Chapters Defined', completed: false },
        ]
    },
    {
        name: 'Phase 3: AI-Powered Drafting & Review',
        steps: [
            { name: 'Pacing Strategy Agreed', completed: false },
            { name: 'Chapter Outline', completed: false },
            // Chapter drafting steps will be dynamically inserted here by App.tsx
        ]
    },
    {
        name: 'Phase 4: Output & Polish',
        steps: [
            { name: 'Final Manuscript Review', completed: false },
            { name: 'Revision & Final Polish Complete', completed: false },
        ]
    },
     {
        name: 'Phase 5: Finalization & Marketing',
        steps: [
            { name: 'KDP Keywords Researched', completed: false },
            { name: 'Book Categories Selected', completed: false },
            { name: 'Compelling Blurb Drafted', completed: false },
            { name: 'Final Title Locked In', completed: false },
        ]
    },
    {
        name: 'Phase 6: Cover Design',
        steps: [
            { name: 'Cover Concept Agreed', completed: false },
        ]
    }
];

export const HOW_TO_PROGRESS: ProgressPhase[] = FICTION_PROGRESS;
export const MEMOIR_PROGRESS: ProgressPhase[] = FICTION_PROGRESS;
export const FLASH_FICTION_PROGRESS: ProgressPhase[] = FICTION_PROGRESS;
