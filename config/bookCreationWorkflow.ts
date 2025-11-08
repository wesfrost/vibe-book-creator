
import { Type } from '@google/genai';
import { BOOK_FORMAT_OPTIONS } from './bookFormats';

const optionSchema = {
    type: Type.OBJECT,
    properties: {
        options: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: 'The option' },
                    rationale: { type: Type.STRING, description: 'A brief explanation of why this option is a good choice.' }
                },
                required: ['title', 'rationale']
            }
        },
        bestOption: { type: Type.INTEGER, description: 'The 0-indexed number of the option you recommend the most.' }
    }
};

export const bookCreationWorkflow = [
    {
        id: 'select_format',
        phase: 'Phase 1: Concept & Research',
        title: 'Book Format Selected',
        userActions: ['select_option'],
        userInstruction: "First, let's decide on the format for your book. Each format offers a different reading experience. Review the options and choose the one that best suits your vision.",
        output: {
            type: 'options',
            key: 'format',
            options: BOOK_FORMAT_OPTIONS.map(o => ({ title: o.title, description: o.description, rationale: '' }))
        }
    },
    {
        id: 'define_genre',
        phase: 'Phase 1: Concept & Research',
        title: 'Genre Defined',
        persona: 'STRATEGIST',
        userActions: ['select_option'],
        userInstruction: "Great, now let's pick a genre. The genre will set the tone and reader expectations for your book. I've generated a few options based on your chosen format. Which one feels right?",
        prompt: "Based on the book format, research curent trends and see what genres are at the top of the ebook selling charts. Generate 5 distinct and compelling genre options based on the research, including a rationale for each.",
        temperature: 0.4,
        output: {
            type: 'options',
            key: 'genre',
            schema: optionSchema
        }
    },
    {
        id: 'define_title',
        phase: 'Phase 1: Concept & Research',
        title: 'Working Title Defined',
        persona: 'STRATEGIST',
        userActions: ['select_option'],
        userInstruction: "It's time to give your project a name! A good title is catchy and hints at the story within. Here are a few ideas to get us started. Select the one you like best, or we can brainstorm more.",
        prompt: "Based on the format, genre, and current trends in ebooks let's brainstorm a working title. Generate 3 distinct and compelling working title options, including a rationale for each.",
        temperature: 0.9,
        output: {
            type: 'options',
            key: 'title',
            schema: optionSchema
        }
    },
    {
        id: 'define_core_idea',
        phase: 'Phase 1: Concept & Research',
        title: 'Core Idea Locked In',
        persona: 'STRATEGIST',
        userActions: ['select_option'],
        userInstruction: "Let's nail down the central concept of your book. The core idea is the 'what if' that drives your story. I've drafted a few options. Which one resonates with you the most?",
        prompt: "Based on our chosen format and genre, generate 3 distinct core ideas that have strong market potential. Analyze current bestseller lists for similar books and explain why each idea is compelling and likely to attract readers.",
        temperature: 0.8,
        output: {
            type: 'options',
            key: 'coreIdea',
            schema: optionSchema
        }
    },
    {
        id: 'define_vibe',
        phase: 'Phase 1: Concept & Research',
        title: 'Vibe Defined',
        persona: 'STRATEGIST',
        userActions: ['select_option'],
        userInstruction: "Now, let's establish the overall mood and feeling of your book. The vibe will influence your writing style and the reader's emotional journey. Pick the vibe that best captures the atmosphere you want to create.",
        prompt: "Based on our concept and genre, what kind of vibe resonates most with top-selling authors in this space? Generate 3 distinct options for the book's vibe and provide a rationale for each, explaining how it aligns with reader expectations and market trends.",
        temperature: 0.9,
        output: {
            type: 'options',
            key: 'vibe',
            schema: optionSchema
        }
    },
    {
        id: 'define_audience',
        phase: 'Phase 1: Concept & Research',
        title: 'Target Audience Identified',
        persona: 'STRATEGIST',
        userActions: ['select_option'],
        userInstruction: "Knowing your reader is key. Let's think about who this book is for. I've created a few potential audience profiles. Which group are you hoping to connect with?",
        prompt: "To maximize our chances of creating a bestseller, let's define our target audience. Analyze the readership of current bestsellers in our genre and create 3 distinct and detailed target audience profiles. For each, describe their demographics, reading habits, and what they look for in a book. Provide a rationale for why targeting this group is a good strategy.",
        temperature: 0.4,
        output: {
            type: 'options',
            key: 'audience',
            schema: optionSchema
        }
    },
    {
        id: 'expand_storyline',
        phase: 'Phase 2: Structure & Character Development',
        title: 'Main Storyline Solidified',
        persona: 'STRATEGIST',
        userActions: ['select_option'],
        userInstruction: "Time to start building the narrative! A strong storyline is the backbone of any great book. Here are a few potential plot directions. Choose the one that you find most compelling.",
        prompt: "Based on the format, genre, coreIdea, vibe of the book we are writing and current top selling trends in ebooks, generate 5 distinct and compelling options for the main storyline. Provide a rationale for eachpotential storylines. Each should have a clear beginning, middle, and end.",
        temperature: 1.0,
        output: {
            type: 'options',
            key: 'storyline',
            schema: optionSchema
        }
    },
    {
        id: 'develop_characters',
        phase: 'Phase 2: Structure & Character Development',
        title: 'Key Characters Defined',
        persona: 'STRATEGIST',
        userActions: ['select_option'],
        userInstruction: "Great stories are about great characters. Let's start developing the people who will inhabit your world. I've sketched out some ideas for your main characters. Which set of characters are you most excited to explore?",
        prompt: "Readers connect with unforgettable characters. Based on our storyline, create three distinct sets of main characters. For each set, provide a 'title' that summarizes the character dynamic (e.g., 'The Reluctant Hero and the Power-Hungry Sorcerer'). In the 'rationale', provide a compelling, one-paragraph description covering both the protagonist and the antagonist, highlighting their core motivations and the central conflict between them. This description is crucial and should give a real sense of who these characters are.",
        temperature: 1.0,
        output: {
            type: 'options',
            key: 'characters',
            schema: optionSchema
        }
    },
    {
        id: 'create_outline',
        phase: 'Phase 3: AI-Powered Drafting & Review',
        title: 'Chapter Outline',
        persona: 'WRITER',
        userActions: ['request_changes', 'approve_and_continue'],
        userInstruction: "Here's the chapter-by-chapter outline for your book. This is our roadmap. You can either approve it as is, or request specific changes. Let me know what you think!",
        prompt: "Let's build the skeleton of our story, keeping the pacing of a bestseller in mind. Create a detailed, chapter-by-chapter outline. Each entry should summarize key events, plot twists, and character developments, ensuring a compelling narrative arc that will keep readers hooked from beginning to end. Reference common story structures like the three-act structure if applicable.",
        temperature: 0.7,
        output: {
            type: 'outline',
            schema: {
                type: Type.OBJECT,
                properties: {
                    globalOutline: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                chapter: { type: Type.INTEGER },
                                title: { type: Type.STRING },
                                summary: { type: Type.STRING }
                            },
                            required: ['chapter', 'title', 'summary']
                        }
                    }
                }
            }
        }
    },
    {
        id: 'draft_chapter',
        phase: 'Phase 3: AI-Powered Drafting & Review',
        title: 'Draft a Chapter',
        persona: 'WRITER',
        userActions: ['request_changes', 'approve_and_continue'],
        userInstruction: "The first draft of the chapter is ready! Read it over and see how it feels. You can ask for revisions or, if you're happy with it, we can move on to the next step.",
        prompt: "Time to write. Draft the next chapter based on our outline. Capture the book's voice and style, focusing on clear, compelling prose that's easy to read. Use techniques common in bestselling novels like cliffhangers, strong hooks, and vivid descriptions to keep the reader engaged. Your JSON response must include the 'chapterNumber'.",
        temperature: 1.0,
        output: {
            type: 'chapter_draft',
            schema: {
                type: Type.OBJECT,
                properties: {
                    chapterNumber: { type: Type.INTEGER },
                    chapterTitle: { type: Type.STRING },
                    chapterContent: { type: Type.STRING, description: 'The full text of the chapter in Markdown format.' }
                },
                required: ['chapterNumber', 'chapterTitle', 'chapterContent']
            }
        }
    },
    {
        id: 'review_chapter',
        phase: 'Phase 4: Output & Polish',
        title: 'Final Manuscript Review',
        persona: 'EDITOR',
        userActions: ['request_changes', 'approve_and_continue'],
        userInstruction: "I've gone through the chapter with an editor's eye. Here's the revised version with feedback and suggestions. Let me know if you want more changes or if you're ready to approve it.",
        prompt: "Let's polish the draft like a bestselling editor would. Review the chapter for clarity, pacing, grammar, and style. Provide specific, actionable feedback and suggest concrete improvements to strengthen the narrative, tighten the prose, and heighten the emotional impact.",
        temperature: 0.3,
        output: {
            type: 'chapter_review',
            schema: {
                type: Type.OBJECT,
                properties: {
                    editedContent: { type: Type.STRING, description: 'The revised chapter content in Markdown.' },
                    feedback: { type: Type.STRING, description: 'A summary of the key edits and suggestions for improvement.' }
                }
            }
        }
    },
    {
        id: 'generate_marketing_materials',
        phase: 'Phase 4: Output & Polish',
        title: 'Revision & Final Polish Complete',
        persona: 'MARKETER',
        userActions: ['select_option'],
        userInstruction: "Let's get the word out! I've created some marketing materials to help you promote your book. Choose the option that you think will best capture your target audience's attention.",
        prompt: "Let's get ready to launch! Based on an analysis of current bestsellers on platforms like Amazon Kindle, generate three options for marketing materials. Each should include a compelling back-cover blurb designed to convert browsers into buyers, and a list of high-traffic, low-competition keywords for discoverability.",
        temperature: 0.8,
        output: {
            type: 'options',
            key: 'marketing',
            schema: optionSchema
        }
    }
];
