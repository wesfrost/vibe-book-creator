# Design Philosophy

This document details the specific design decisions for the Vibe Book Creator.

## Our Mission: A Co-Creative Partnership

Our core mission is to break the stigma of "AI junk" in the ebook market. We believe that AI should not be a replacement for human creativity, but a powerful partner in the creative process.

Our eBooks are not quickly written by AI. Our eBooks are **co-created** between a user and an AI within a defined and detailed collaborative workflow. This philosophy is the foundation of every design decision we make.

## Core Principles

Our application is built on three core principles that bring this mission to life: **Conversational UI**, **Stateless Architecture**, and **Configuration-Driven Development**.

### 1. Conversational UI: A Collaborative Partner

Our primary design goal is to create an experience that feels less like a tool and more like a collaborative partner. This is achieved through a few key principles:

*   **Acknowledge and Confirm:** The AI always acknowledges the user's input, especially when refining a previous step. Instead of just re-displaying a generic instruction, the AI is programmed to generate a custom `refinementMessage` (e.g., "That's a great idea! Here are some new options based on your suggestion...").
*   **Clear, Actionable Choices:** All AI-generated suggestions are presented as clean, clickable buttons within the chat interface. This removes ambiguity and makes it easy for the user to make decisions and drive the workflow forward.
*   **Separation of Concerns:** We make a clear distinction between a **Command** (clicking a button to advance the workflow) and a **Conversation** (typing a message to refine the current step). This is handled by dedicated functions (`handleSelection` and `handleRefinement`) to ensure the application always understands the user's intent.

### 2. Stateless Architecture: Robust and Predictable

All interactions with the Gemini API are designed to be **stateless**. This is a critical architectural decision that makes our application more robust, predictable, and easier to debug.

*   **No Server-Side Chat History:** We do not rely on the Gemini API's built-in `chat` service to maintain conversation history.
*   **Master Context Object:** On every single call to the AI, our `orchestrationService` constructs a complete "master context object." This object contains:
    *   The full `bookSpec` (the current state of the book).
    *   A clean, conversational-only `chatHistory`.
    *   The `currentTask`, including the detailed instructions for the AI.
*   **Single, Perfect Prompt:** This entire context object is stringified and sent to the Gemini API as a single, comprehensive prompt. This ensures the AI has the full picture on every turn, eliminating the possibility of confusion or "memory loss."

### 3. Configuration-Driven Development: The Single Source of Truth

The entire book creation process is defined in a single, highly-structured configuration file: `config/bookCreationWorkflow.ts`. This is the undisputed "source of truth" for the application's logic.

*   **Centralized Control:** Every step of the workflow is defined as an object in this file, specifying the `persona`, the `prompt`, the `output` schema, and even the creative `temperature` for the AI.
*   **Rapid Prototyping and Iteration:** This approach allows us to add, remove, or reorder steps in the book creation process by simply modifying this one file. We can instantly change the AI's instructions, its persona, or its level of creativity without having to touch any of the core application logic.
*   **Consistency and Maintainability:** By abstracting our core logic into a configuration file, we ensure that our application is incredibly consistent and easy to maintain. All prompts and AI-related logic live in one place, making it easy to understand and update the entire system.
