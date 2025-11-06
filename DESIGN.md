# Design Decisions

This document details the specific design decisions for the AI-powered book writing application, focusing on the orchestration of AI personas.

## Persona Assignment Strategy

The `orchestrationService.ts` uses the `getPersonaForStep` function to assign the correct AI persona to each step of the writing process. The goal is to use the most specialized AI for each task.

### Phase 1: Concept & Research (Strategist)

All steps in this phase are handled by the `STRATEGIST_PERSONA`. This persona is an expert in market trends, narrative structure, and reader psychology.

*   `Book Format Selected`
*   `Genre Defined`
*   `Working Title Defined`
*   `Core Idea Locked In`
*   `Vibe Defined`
*   `Target Audience Identified`

### Phase 2: Structure & Character Development (Strategist)

The `STRATEGIST_PERSONA` also handles this phase, as it involves high-level structural decisions.

*   `Main Storyline Solidified`
*   `Key Characters Defined`
*   `Number of Chapters Defined`

### Phase 3: AI-Powered Drafting & Review (Strategist & Writer)

This phase involves both high-level strategy and detailed writing.

*   `Pacing Strategy Agreed`: `STRATEGIST_PERSONA`
*   `Chapter Outline`: `WRITER_PERSONA`
*   `Draft Chapter X`: `WRITER_PERSONA`

### Phase 4: Output & Polish (Editor)

This phase requires a detail-oriented persona focused on improving the existing text. We will create a new `EDITOR_PERSONA`.

*   `Final Manuscript Review`: `EDITOR_PERSONA`
*   `Revision & Final Polish Complete`: `EDITOR_PERSONA`

### Phase 5: Finalization & Marketing (Marketer)

This phase requires an AI with expertise in marketing and publishing. We will create a new `MARKETER_PERSONA`.

*   `KDP Keywords Researched`: `MARKETER_PERSONA`
*   `Book Categories Selected`: `MARKETER_PERSONA`
*   `Compelling Blurb Drafted`: `MARKETER_PERSONA`
*   `Final Title Locked In`: `MARKETER_PERSONA`

### Phase 6: Cover Design (Strategist)

This step is best handled by the `STRATEGIST_PERSONA`, as it relates to the overall market positioning of the book.

*   `Cover Concept Agreed`: `STRATEGIST_PERSONA`
