
import { BrainstormingIdea } from "../types";

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
    'Global Outline Approved': {
        message: "[MOCK] The blueprint is set! A solid outline is your story's skeleton. Now, let's breathe life into it with characters.",
        outlineContent: "### Act I: The Ordinary World\n- **Chapter 1:** Introduce the protagonist, Elara, a librarian who loves routine.\n- **Chapter 2:** The inciting incident: a mysterious, ancient book appears in the library's night deposit box.",
        options: [{ title: "Looks perfect, let's proceed!", rationale: "This outline provides a strong foundation for our story."}]
    },
    'Generate idea for Chapter 1': {
        message: "[MOCK] It's time to write! Let's draft the idea for our opening chapter.",
        chapterTitle: "Chapter 1: The Book in the Box",
        chapterIdea: "Introduce Elara and her quiet life. She closes the library and finds a strange, ancient book in the deposit box. She feels an unnatural pull to take it home, breaking her own rules."
    },
    'Draft Chapter 1': {
        postChapterMessage: "[MOCK] Chapter 1 is drafted! What a fantastic opening. The hook is set.",
        chapterTitle: "Chapter 1: The Book in the Box",
        chapterContent: "The scent of old paper and lemon polish was Elara’s favorite perfume. It was the smell of order, of stories neatly tucked away on shelves, waiting patiently. But the book in the night deposit box smelled of none of those things. It smelled of ozone and damp earth, a storm trapped beneath a leather cover bound in a metal she didn't recognize."
    },
     'Full Book Compiled': {
        message: "[MOCK] Incredible! You've done it! The full manuscript is compiled. This is a monumental achievement.",
        options: [{ title: "Let's get this polished!", rationale: "Time to move on to the final steps before publishing." }]
    },
    'DEFAULT': {
        message: "[MOCK] This is a default mock response for the step. Let's proceed!",
        options: [
            { title: 'Option A', description: 'This is the first mock option.', rationale: 'This is the rationale for A.' },
            { title: 'Option B', description: 'This is the second mock option.', rationale: 'This is the rationale for B.' },
        ]
    }
};

export const getMockResponseForStep = (step: string): any => {
    // Handle dynamic chapter steps
    if (step.startsWith('Generate idea for')) return MOCK_RESPONSES['Generate idea for Chapter 1'];
    if (step.startsWith('Draft')) return MOCK_RESPONSES['Draft Chapter 1'];

    return MOCK_RESPONSES[step] || MOCK_RESPONSES['DEFAULT'];
};

export const getMockBrainstormIdeas = (): BrainstormingIdea[] => {
    return [
    ];
};

export const getMockAnalysis = (): string => {
    return `[MOCK ANALYSIS]
**Tone & Style:** The tone perfectly matches the 'Cozy Mystery' vibe we established. *Why this matters:* It immediately reassures the reader they're in for the comfortable, low-stakes experience they were promised.
**Pacing:** The pacing is excellent. It starts slow, building the world, then accelerates with the inciting incident. *How this helps:* This classic structure hooks the reader without overwhelming them.
**Hooks:** The final sentence is a fantastic hook, creating an immediate question the reader needs answered. *Why it works:* It guarantees they'll want to turn the page (or click 'next episode').`;
};
