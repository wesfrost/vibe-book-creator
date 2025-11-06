
import { Schema, Type } from "@google/genai";

// --- Schema Definitions for Typed Responses ---

const optionSchema = (itemDescription: string): Schema => ({
    type: Type.OBJECT,
    properties: {
        message: { type: Type.STRING, description: "A friendly, conversational message to the user explaining the options." },
        options: {
            type: Type.ARRAY,
            description: `An array of 3-5 distinct and well-reasoned ${itemDescription}.`,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "A short, catchy title for the option." },
                    description: { type: Type.STRING, description: "A detailed, paragraph-long description of the option." },
                    rationale: { type: Type.STRING, description: "A compelling argument for why this option is a good choice." }
                },
                required: ['title', 'description', 'rationale']
            }
        },
        bestOption: { type: Type.NUMBER, description: "The 0-indexed number of the option you recommend the most." }
    },
    required: ["message", "options", "bestOption"],
});

const outlineSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        message: { type: Type.STRING, description: "A message to the user presenting the generated chapter outline." },
        outline: {
            type: Type.ARRAY,
            description: "The complete, chapter-by-chapter outline.",
            items: {
                type: Type.OBJECT,
                properties: {
                    chapterTitle: { type: Type.STRING, description: "The title of the chapter." },
                    chapterDescription: { type: Type.STRING, description: "A detailed paragraph describing the chapter's key events, character arcs, and plot points." }
                },
                required: ['chapterTitle', 'chapterDescription']
            }
        }
    },
    required: ["message", "outline"],
};

const chapterDraftSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        message: { type: Type.STRING, description: "A message that comes *after* the chapter content, encouraging the user or suggesting next steps." },
        chapterTitle: { type: Type.STRING, description: "The final title of the drafted chapter." },
        chapterContent: { type: Type.STRING, description: "The full content of the chapter, written in engaging, professional prose." }
    },
    required: ["message", "chapterTitle", "chapterContent"],
};

const messageSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        message: { type: Type.STRING, description: "A friendly, conversational message to the user." },
    },
    required: ["message"],
};


// --- Book Creation Workflow Definition ---

export const bookCreationWorkflow = [
    {
        id: 'foundation_format',
        title: "Book Format",
        persona: 'STRATEGIST',
        prompt: "Your task is to help the author choose a book format. Present a few popular options (like Novel, Novella, Short Story Collection) and explain the pros and cons of each in relation to market trends and reader expectations.",
        userActions: ['select_option', 'request_refinement'],
        output: { type: 'options', schema: optionSchema("book formats"), key: 'format' },
    },
    {
        id: 'foundation_genre',
        title: "Genre",
        persona: 'STRATEGIST',
        prompt: "Based on the chosen format, help the author define their genre. Provide several compelling genre options that are popular and commercially viable. For each, describe the core conventions, target audience, and potential for series development.",
        userActions: ['select_option', 'request_refinement'],
        output: { type: 'options', schema: optionSchema("genres"), key: 'genre' },
    },
    {
        id: 'foundation_idea',
        title: "Core Idea",
        persona: 'STRATEGIST',
        prompt: "Now, let's brainstorm the core idea or 'logline' of the book. Generate a few high-concept pitches that fit the chosen genre. Each pitch should be a single, powerful sentence that grabs attention and clearly communicates the story's hook.",
        userActions: ['select_option', 'request_refinement'],
        output: { type: 'options', schema: optionSchema("core ideas"), key: 'coreIdea' },
    },
    {
        id: 'foundation_vibe',
        title: "Vibe & Tone",
        persona: 'STRATEGIST',
        prompt: "Define the book's vibe and tone. Offer a selection of stylistic approaches (e.g., 'Gritty and suspenseful', 'Whimsical and lighthearted', 'Epic and cinematic'). For each, explain how it would influence the reader's experience and prose style.",
        userActions: ['select_option', 'request_refinement'],
        output: { type: 'options', schema: optionSchema("vibe and tone options"), key: 'vibe' },
    },
     {
        id: 'foundation_audience',
        title: "Target Audience",
        persona: 'MARKETER',
        prompt: "Describe the ideal target audience for this book. Create a few detailed reader personas, including their demographics, reading habits, and what they look for in a story. This will help focus our writing and marketing efforts.",
        userActions: ['select_option', 'request_refinement'],
        output: { type: 'options', schema: optionSchema("target audience personas"), key: 'audience' },
    },
    {
        id: 'foundation_title',
        title: "Working Title",
        persona: 'MARKETER',
        prompt: "Let's come up with a compelling working title. Generate a list of titles that are memorable, genre-appropriate, and hint at the core conflict. Include a mix of short, punchy titles and more evocative ones.",
        userActions: ['select_option', 'request_refinement'],
        output: { type: 'options', schema: optionSchema("working titles"), key: 'title' },
    },
    {
        id: 'foundation_storyline',
        title: "Main Storyline",
        persona: 'WRITER',
        prompt: "Flesh out the main storyline. Provide a few variations of a 1-3 paragraph summary of the plot, including the inciting incident, rising action, climax, and resolution. Focus on creating a strong narrative arc.",
        userActions: ['select_option', 'request_refinement'],
        output: { type: 'options', schema: optionSchema("storyline summaries"), key: 'storyline' },
    },
     {
        id: 'foundation_characters',
        title: "Key Characters",
        persona: 'WRITER',
        prompt: "Develop the key characters. For the protagonist and antagonist, create a few different character concepts. Each concept should include their core motivation, a fatal flaw, a unique strength, and a brief backstory.",
        userActions: ['select_option', 'request_refinement'],
        output: { type: 'options', schema: optionSchema("character concepts"), key: 'characters' },
    },
    {
        id: 'outline_chapters',
        title: "Chapter Outline",
        persona: 'WRITER',
        prompt: "You are a master storyteller. Based on all the book's details, generate a complete, chapter-by-chapter outline. Each chapter in the outline must have a compelling title and a detailed, paragraph-long description of its key events, character arcs, and plot points. The full outline should follow a proven story structure (like the three-act structure) to maximize reader engagement.",
        userActions: ['approve_outline', 'regenerate_outline', 'request_refinement'],
        output: { type: 'outline', schema: outlineSchema },
    },
    {
        id: 'draft_chapter',
        title: "Draft Chapter", // This is a dynamic step, the title will be updated in the app
        persona: 'WRITER',
        prompt: "You are a bestselling author. Using the approved outline and all established book details, write the full content for the specified chapter. The prose should be vivid, engaging, and perfectly capture the book's genre and vibe. Make sure the chapter flows well, advances the plot, and stays true to the characters.",
        userActions: ['approve_draft', 'regenerate_draft', 'request_refinement'],
        output: { type: 'chapter_draft', schema: chapterDraftSchema },
    },
    {
        id: 'marketing_blurb',
        title: "Compelling Blurb",
        persona: 'MARKETER',
        prompt: "It's time to write the book blurb! This is a crucial marketing tool. Craft a few different versions of a compelling, attention-grabbing blurb (150-200 words). It should introduce the main character, hint at the central conflict, and end with a hook that makes readers desperate to know more.",
        userActions: ['select_option', 'request_refinement'],
        output: { type: 'options', schema: optionSchema("book blurbs"), key: 'blurb' },
    },
    {
        id: 'marketing_keywords',
        title: "KDP Keywords",
        persona: 'MARKETER',
        prompt: "Research and select the best KDP (Kindle Direct Publishing) keywords for this book. Provide a list of 7-10 keywords that have high search volume and low competition, maximizing the book's visibility on Amazon. Explain the reasoning behind each keyword choice.",
        userActions: ['select_option', 'request_refinement'],
        output: { type: 'options', schema: optionSchema("KDP keyword sets"), key: 'keywords' },
    },
];
