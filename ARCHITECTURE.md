# Architecture Overview

This document outlines the high-level architecture of the Vibe Book Creator, an AI-powered book writing application. Our architecture is designed to be modular, scalable, and easy to maintain, following modern best practices for building AI-driven web applications.

## Core Philosophy: A Clear Separation of Concerns

The application is built on a clear separation between **State**, **UI**, **Logic**, and **Services**.

*   **State (`store/useBookStore.ts`):** A single, centralized Zustand store acts as the "single source of truth" for the entire application. This includes the `bookState` (the book itself), the `messages` (the chat history), and the current workflow `progress`.
*   **UI (`components`):** All UI elements are React components that are decoupled from the application logic. They receive data and functions as props and are responsible for rendering the UI.
*   **Logic (`App.tsx`):** The main `App.tsx` component is the central hub of the application. It contains all the "handler" functions that respond to user interactions, orchestrate calls to the AI, and update the state.
*   **Services (`services`):** These are the "power tools" of our application. They are completely decoupled from the UI and are responsible for all communication with the Gemini API.

## Detailed Component Breakdown

### 1. State Management (Zustand)

*   **`useBookStore.ts`:** This is the heart of our application. It defines the shape of our state and provides a set of actions for updating it. Using Zustand gives us a simple, powerful, and scalable way to manage our state without the boilerplate of more complex solutions.

### 2. UI Components (React + Tailwind CSS)

*   **`App.tsx`:** The root component of our application. It's responsible for laying out the main UI and passing data and functions down to the other components.
*   **`ChatWindow.tsx` & `MessageBubble.tsx`:** These components are responsible for rendering the conversational UI. They are designed to be "dumb" components that simply display the `messages` array from our Zustand store.
*   **`ChatInput.tsx`:** This component provides the text input and send button for our chat interface. It is a simple, controlled component that calls a function when the user submits a message.
*   **`ProgressTracker.tsx`:** This component dynamically renders the user's progress through the book creation workflow, providing a detailed, chapter-by-chapter view of the drafting process.

### 3. AI Services (Gemini API)

*   **`geminiService.ts`:** This is our direct, low-level interface to the Google Gemini API. Its only job is to provide a robust, type-safe function for making API calls. It is completely decoupled from the rest of our application.
*   **`orchestrationService.ts`:** This is the "brain" of our AI. It receives the current `bookState` and `messages` from `App.tsx` and constructs a perfect, context-rich prompt for the Gemini API. It is responsible for all the "prompt engineering" that makes our AI so powerful.
*   **`services/personas`:** These are the "system instructions" that we provide to the Gemini API. They tell the AI what "hat" to wear for each task (e.g., `Strategist`, `Writer`, `Editor`).

### 4. Configuration

*   **`bookCreationWorkflow.ts`:** This is the "source of truth" for our entire application. It is a highly-structured array of objects, where each object defines a single step in the book creation process. It includes the `persona`, the `prompt`, the `temperature`, and the expected `output` for each step.

## Data Flow: A Refined, Unidirectional Flow

The application follows a simple, unidirectional data flow that is now enhanced by our clear separation of concerns:

1.  **User Interaction:** The user interacts with a UI component (e.g., clicks a button in `MessageBubble.tsx` or types a message in `ChatInput.tsx`).
2.  **Handler Called:** The UI component calls the appropriate handler function in `App.tsx` (`handleSelection` or `handleRefinement`).
3.  **State Updated (User Message):** The handler in `App.tsx` immediately calls `addMessage` from our Zustand store to add the user's message to the chat history.
4.  **Orchestration:** The handler calls the `processStep` function in `orchestrationService.ts`, passing in the current `bookState` and `messages`.
5.  **AI Processing:** The `orchestrationService` constructs the perfect prompt and calls the `callGemini` function in `geminiService.ts`.
6.  **Response:** The `geminiService` returns a structured response, which is passed back to the handler in `App.tsx`.
7.  **State Updated (AI Response):** The handler calls `addMessage` again to add the AI's response to the chat history, and it calls `setBookState` to update the book itself (e.g., with a new chapter draft).
8.  **UI Re-renders:** Because our UI components are all subscribed to the Zustand store, they automatically re-render to reflect the new state.
