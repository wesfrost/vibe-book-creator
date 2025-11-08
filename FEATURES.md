# Vibe Book Creator: Feature Roadmap

This document outlines the planned features and improvements for the Vibe Book Creator application. It is organized into high-level "Epics" and detailed "User Stories" to guide our development process.

## Epic 1: Project Persistence & User Accounts

*Goal: Allow users to save, load, and manage their book projects, providing a secure and persistent creative workspace.*

---

### Story 1.1: Local Project Storage

*   **As a user,** I want my current book project to be automatically saved to my browser's local storage.
*   **So that** I can refresh the page or close my browser and not lose all of my creative work.
*   **Technical Notes:**
    *   This is our highest priority feature.
    *   We can implement this by subscribing to changes in our `useBookStore` and writing the `bookState` to `localStorage`.
    *   On app load, we will check for a saved project in `localStorage` and rehydrate the store.

### Story 1.2: Multi-Project Management

*   **As a user,** I want to be able to start a new project, save the current one, and switch between my saved projects.
*   **So that** I can work on multiple book ideas at once.
*   **Technical Notes:**
    *   This will likely require a new UI element, perhaps a "My Projects" dropdown or a modal window.
    *   We will need to update our `localStorage` logic to handle an array of saved projects, each with its own unique ID.

### Story 1.3 (Future): Cloud-Based Accounts (Firebase)

*   **As a user,** I want to be able to create an account and have my projects saved to the cloud.
*   **So that** I can access my work from any device and be confident that it is securely backed up.
*   **Technical Notes:**
    *   This is a larger, future-state feature.
    *   It would involve integrating **Firebase Authentication** for user accounts and **Firestore** to store the book data.

## Epic 2: The "Bestseller" Marketing Suite

*Goal: To provide authors with a dedicated workspace to collaborate with the AI on crafting the perfect marketing materials for their book.*

---

### Story 2.1: Marketing UI Tab

*   **As a user,** I want a dedicated "Marketing" tab in the main interface.
*   **So that** I can easily access all the tools I need to prepare my book for publication.
*   **Technical Notes:**
    *   This will involve creating a new `Marketing.tsx` component and adding it to our main view toggle in `App.tsx`.

### Story 2.2: Collaborative Blurb & Keyword Generation

*   **As a user,** I want to be able to work with the AI to generate and refine my book's blurb, KDP keywords, and book categories.
*   **So that** I can create a compelling sales page for my book.
*   **Technical Notes:**
    *   This will use the same conversational "refinement loop" that we have perfected for our main writing workflow.
    *   The `Marketing.tsx` component will have dedicated sections for each of these elements.

## Epic 3: Professional Export Formats

*Goal: To provide authors with the professional, industry-standard file formats they need to publish their work.*

---

### Story 3.1: ePub Export

*   **As a user,** I want to be able to export my finished manuscript as an `.epub` file.
*   **So that** I can easily upload it to ebook retailers like Amazon KDP and Apple Books.
*   **Technical Notes:**
    *   We will need to research and integrate a library like `epub-gen` to handle the conversion from our `bookState` to the ePub format.

### Story 3.2: PDF Export

*   **As a user,** I want to be able to export my manuscript as a print-ready PDF.
*   **So that** I can create physical copies of my book or send it to reviewers.
*   **Technical Notes:**
    *   We can investigate libraries like `jspdf` and `html2canvas` to create a beautiful, professional-grade PDF from our content.

## Epic 4: The "Supercharged" Editor

*Goal: To enhance the core writing and editing experience to make it more powerful and intuitive.*

---

### Story 4.1: Markdown Toolbar

*   **As a user,** I want a simple toolbar in the Markdown editor with buttons for common formatting (Bold, Italic, Headings).
*   **So that** I can easily style my manuscript without having to remember Markdown syntax.
*   **Technical Notes:**
    *   This can be implemented by adding a new component that manipulates the text in the editor's `textarea`.

### Story 4.2: Interactive Final Manuscript Review

*   **As a user,** I want the "Final Review" step to provide me with a list of specific, actionable suggestions from the AI editor.
*   **So that** I can accept or reject each change individually and have more control over the final polish.
*   **Technical Notes:**
    *   This will require a new workflow step and a new UI component to display the list of suggestions.
    *   We will need to design a new AI prompt that asks the editor to return an array of `suggestions`, each with the original text, the proposed change, and a rationale.
