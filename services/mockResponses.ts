
import { BookState, ChatMessage, ProgressPhase, BrainstormingIdea } from '../types';

export const getMockResponseForStep = (step: string): any => {
    const MOCK_RESPONSES: { [key: string]: any } = {
        'Genre Defined': {
            message: "[MOCK] Incredible choice! Genre is the bedrock of reader expectation. Now, let's sculpt the very soul of your story.",
            options: [
                { title: 'A Haunted Inheritance', description: 'A young woman inherits a remote manor, only to discover it’s haunted by a family secret.', rationale: 'Combines the popular "inheritance" trope with a supernatural mystery, appealing to both domestic thriller and horror fans.' },
                { title: 'The Last Archivist', description: 'In a future where all knowledge is digital and ephemeral, one person rediscovers the power of physical books.', rationale: 'Taps into anxieties about digital permanence and the romance of analog history, a strong hook for literary sci-fi readers.' },
            ]
        },
        'Core Idea Locked In': {
            message: "[MOCK] That's a powerful core idea! Now, let's talk about the 'vibe.' This is the emotional texture of your book.",
            options: [
                { title: 'Cozy & Whimsical', description: 'Low stakes, charming characters, and a sense of wonder.', rationale: 'The "cozy" market is booming as readers seek comfort and escape. It builds a loyal, repeat readership.' },
                { title: 'Gritty & Noir', description: 'High stakes, morally gray characters, and a sense of atmospheric dread.', rationale: 'Appeals to fans of classic detective stories and modern psychological thrillers, a consistently strong market.' },
            ]
        },
        'Outline Approved': {
            message: "[MOCK] Here is a best-seller optimized outline for your approval. This structure is designed to maximize reader engagement and deliver a satisfying narrative arc.",
            outline: [
                { chapterTitle: "Chapter 1: The Unsettling Inheritance", chapterDescription: "Our protagonist, Elara, receives a mysterious letter informing her of a great-aunt she never knew and an inheritance: a remote, crumbling manor on a windswept coast." },
                { chapterTitle: "Chapter 2: Whispers in the Walls", chapterDescription: "Elara arrives at the manor and is immediately struck by its oppressive atmosphere. She discovers a locked room and begins to hear strange noises at night, which the cryptic caretaker dismisses as the wind." },
                { chapterTitle: "Chapter 3: The Archivist's Secret", chapterDescription: "Exploring the library, Elara finds her great-aunt's hidden journal, which speaks of a 'guardian' in the house and a terrible family secret that must be protected." }
            ]
        },
        'Chapter 1 Drafted': {
            postChapterMessage: "[MOCK] Chapter 1 is drafted and ready for your review in the editor.",
            chapterTitle: "Chapter 1: The Unsettling Inheritance",
            chapterContent: "# Chapter 1: The Unsettling Inheritance\n\nThe letter arrived on a Tuesday, tucked between a gas bill and a postcard from a friend vacationing in a place Elara couldn't afford. The parchment was thick, creamy, and felt ancient in her hands. The ink, a deep, bleeding black, spelled out a name she hadn't heard in years: *Elara Vance*."
        }
    };

    return MOCK_RESPONSES[step] || { message: `[MOCK] This is a default mock response for the step: **${step}**.` };
}
