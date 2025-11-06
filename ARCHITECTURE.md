# Architecture Overview

This document outlines the high-level architecture of the AI-powered book writing application.

## Core Components

The application is built around a few key components that work together to provide a seamless user experience.

### 1. Frontend (React + Vite)

*   **Framework:** The user interface is built using React and Vite, providing a fast and responsive user experience.
*   **Component-Based:** The UI is broken down into a series of reusable components (e.g., `ChatWindow`, `MessageBubble`, `SidebarNav`) located in the `components` directory.
*   **State Management:** The application state (including the `bookState` and chat history) is managed within the main `App.tsx` component.

### 2. AI Services

*   **Gemini Service (`geminiService.ts`):** This is the core interface to the Google Gemini large language model. It handles the API calls and returns the AI-generated responses.
*   **Personas (`services/personas`):** To ensure high-quality, specialized responses, the application uses a series of "personas." These are system-level instructions that tell the AI how to behave (e.g., as a `Strategist`, `Writer`, `Editor`).
*   **Orchestration Service (`orchestrationService.ts`):** This service is the "brain" of the AI. It receives the current state of the application and the user's request, and then decides which persona to use for the response.

### 3. Configuration

*   **Progress Tracks (`config/progressTracks.ts`):** This file defines the step-by-step process for writing a book. It is the "source of truth" for the application's workflow.
*   **AI Models (`config/aiModels.ts`):** This file defines the available AI models that can be used by the application.

## Data Flow

The application follows a simple, unidirectional data flow:

1.  **User Interaction:** The user interacts with the UI, either by clicking a button or sending a message.
2.  **State Update:** The `App.tsx` component updates its state based on the user's interaction.
3.  **Orchestration:** The `App.tsx` component calls the `orchestrationService.ts` with the current state and chat history.
4.  **AI Processing:** The `orchestrationService.ts` selects the appropriate persona and sends a request to the `geminiService.ts`.
5.  **Response:** The `geminiService.ts` returns a response, which is then passed back to the `App.tsx` component.
6.  **UI Update:** The `App.tsx` component updates its state with the AI's response, and the UI is re-rendered.
