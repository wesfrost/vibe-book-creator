
import React from 'react';
import { bookCreationWorkflow } from '../config/bookCreationWorkflow';
import { processStep } from '../services/orchestrationService';
import { useBookStore } from '../store/useBookStore';
import { ChatMessage, Option, BookState, Chapter, Suggestion, MainView } from '../types';
import { generateCoverConcepts } from '../services/coverService';
import { DEFAULT_AI_MODEL_ID } from '../config/aiModels';

export const useAppLogic = () => {
    const {
        messages,
        bookState,
        isLoading,
        addMessage,
        setBookState,
        updateBookState,
        setIsLoading,
        advanceToNextStep,
        getCurrentStep,
        handleChapterEditing,
        updateChapterDetails,
    } = useBookStore();

    const [mainView, setMainView] = React.useState<MainView>('dashboard');
    const [selectedModelId, setSelectedModelId] = React.useState<string>(DEFAULT_AI_MODEL_ID);
    const initRef = React.useRef(false);

    const handleApiResponse = (response: any, stepId: string) => {
        const stepConfig = bookCreationWorkflow.find(s => s.id === stepId);
        if (!stepConfig) {
            addMessage({ id: 'error', role: 'model', parts: [{ text: "I've lost my place! Can't find the next step in our workflow. 🤷" }] });
            return;
        }

        switch (stepConfig.id) {
            case 'create_outline':
                handleOutlineResponse(response);
                break;
            case 'draft_chapter':
            case 'edit_chapter_loop':
                handleChapterUpdateResponse(response);
                break;
            case 'final_manuscript_review':
                handleFinalReviewResponse(response);
                break;
            case 'generate_cover_images':
                handleCoverOptionsResponse(response);
                break;
            default:
                if (stepConfig.output.type === 'options') {
                    handleGenericResponse(response);
                } else {
                    addMessage({ id: 'error', role: 'model', parts: [{ text: `I received an unexpected response from the AI. Let's try that again.` }] });
                }
                break;
        }
    };

    const handleGenericResponse = (responseData: any, messageOverride?: string) => {
        const currentStep = getCurrentStep();
        const stepConfig = bookCreationWorkflow.find(s => s.id === currentStep.id);
        const optionsFromUserActions = stepConfig?.userActions?.map(action => ({
            title: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: `Click to ${action.replace(/_/g, ' ')}`,
        }));
        const finalOptions = responseData.options || optionsFromUserActions || [];
        
        const jimResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            parts: [{ text: messageOverride || responseData.refinementMessage || stepConfig?.userInstruction || "Here are some options. What do you think?" }],
            options: finalOptions,
            bestOption: responseData.bestOption,
        };
        
        addMessage(jimResponse);
    };

    const handleOutlineResponse = React.useCallback((responseData: any) => {
        const chaptersFromOutline = responseData.globalOutline.map((item: any) => ({
            chapterNumber: item.chapterNumber,
            title: item.title, 
            summary: item.summary, 
            content: '', 
            status: 'outlined' as const
        }));
        updateBookState({ chapters: chaptersFromOutline });
        const currentStep = getCurrentStep();
        const stepConfig = bookCreationWorkflow.find(s => s.id === currentStep.id);
        handleGenericResponse({}, stepConfig?.userInstruction); 
        setMainView('outline');
    }, [getCurrentStep, addMessage, updateBookState]);

    const handleChapterUpdateResponse = React.useCallback((responseData: any) => {
        const { chapterNumber, chapterTitle, chapterContent } = responseData;
        if (typeof chapterNumber !== 'number') {
            addMessage({ id: 'error', role: 'model', parts: [{ text: "There was an issue identifying the chapter to update. Let's try again." }] });
            return;
        }
        const chapterIndex = bookState.chapters.findIndex(c => c.chapterNumber === chapterNumber);
        if (chapterIndex === -1) {
            addMessage({ id: 'error', role: 'model', parts: [{ text: "I seem to have lost my place! Could you tell me which chapter we were working on?" }] });
            return;
        }
        
        const currentStep = getCurrentStep();
        const detailsToUpdate: Partial<Chapter> = { content: chapterContent };

        if (chapterTitle) {
            detailsToUpdate.title = chapterTitle;
        }
        if (currentStep.id === 'draft_chapter') {
            detailsToUpdate.status = 'drafted';
        } else if (currentStep.id === 'edit_chapter_loop') {
            detailsToUpdate.status = 'edited';
        }
        
        updateChapterDetails(chapterIndex, detailsToUpdate);
        
        const stepConfig = bookCreationWorkflow.find(s => s.id === currentStep.id);
        const jimResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            parts: [{ text: stepConfig?.userInstruction || "Here's the next chapter! What do you think?" }],
            options: [
                { title: 'Approve and Continue', description: 'Move to the next step.' },
                { title: 'Request Changes', description: 'Provide feedback for revisions.' }
            ]
        };
        addMessage(jimResponse);
        setMainView('manuscript');
    }, [bookState.chapters, getCurrentStep, addMessage, updateChapterDetails]);

    const handleFinalReviewResponse = React.useCallback((responseData: any) => {
        const { chapters } = responseData;
        if (!Array.isArray(chapters)) {
            addMessage({ id: 'error', role: 'model', parts: [{ text: "The AI returned an invalid format for the final review. Let's try that again." }] });
            return;
        }
    
        const finalChapters: Chapter[] = chapters.map((chap: any) => ({
            chapterNumber: chap.chapterNumber,
            title: chap.chapterTitle,
            content: chap.chapterContent,
            status: 'reviewed',
            summary: useBookStore.getState().bookState.chapters.find(c => c.chapterNumber === chap.chapterNumber)?.summary || ''
        }));
    
        updateBookState({ chapters: finalChapters, finalReviewCompleted: true });
    
        const currentStep = getCurrentStep();
        const stepConfig = bookCreationWorkflow.find(s => s.id === currentStep.id);
        handleGenericResponse({}, stepConfig?.userInstruction);
        setMainView('manuscript');
    }, [addMessage, updateBookState, getCurrentStep, bookState.chapters]);

    const handleCoverOptionsResponse = React.useCallback(async (responseData: any) => {
        const { options } = responseData;
        if (!Array.isArray(options)) {
            addMessage({ id: 'error', role: 'model', parts: [{ text: "The AI returned an invalid format for the cover options. Let's try that again." }] });
            return;
        }
    
        updateBookState({ coverOptions: options });
        
        const imageUrls = await generateCoverConcepts(useBookStore.getState().bookState);
        updateBookState({ coverImages: imageUrls });
    
        const chatOptions = imageUrls.map((url, index) => ({
            title: `Option ${index + 1}`,
            description: options[index]?.title || `Select cover image ${index + 1}`,
        }));

        const jimResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            parts: [{ text: "Here are the cover concepts I've generated. Which one do you prefer?" }],
            options: chatOptions,
        };
        addMessage(jimResponse);
        setMainView('cover');
        advanceToNextStep();
    }, [addMessage, updateBookState]);

    const handleUserAction = async (text: string, isSelection: boolean = true) => {
        if (isLoading) return;
    
        addMessage({ id: Date.now().toString(), role: 'user', parts: [{ text }], isSystem: isSelection });
        setIsLoading(true);
    
        const currentStep = getCurrentStep();
        let nextStepId = currentStep.id;
        let shouldAdvance = true;
    
        if (currentStep.id === 'draft_chapter') {
            if (text.toLowerCase().includes('approve')) {
                const nextChapterToDraftIndex = useBookStore.getState().bookState.chapters.findIndex(c => c.status === 'outlined');
                if (nextChapterToDraftIndex !== -1) {
                    shouldAdvance = false;
                }
            } else {
                shouldAdvance = false;
            }
        } else if (currentStep.id === 'edit_chapter_loop') {
            if (text.toLowerCase().includes('approve')) {
                handleChapterEditing();
                const nextChapterToEditIndex = useBookStore.getState().bookState.chapters.findIndex(c => c.status === 'drafted');
                if (nextChapterToEditIndex === -1) {
                    shouldAdvance = true;
                } else {
                    shouldAdvance = false;
                }
            } else {
                shouldAdvance = false; 
            }
        } else if (currentStep.id === 'final_manuscript_review') {
            if (text.toLowerCase().includes('approve')) {
                updateBookState({ finalReviewCompleted: true });
            }
        } else if (currentStep.id === 'select_cover_image') {
            if (isSelection) {
                const optionIndex = parseInt(text.replace('Option ', ''), 10) - 1;
                if (bookState.coverImages && bookState.coverImages[optionIndex]) {
                    updateBookState({ coverImage: bookState.coverImages[optionIndex] });
                    shouldAdvance = true;
                }
            }
        }
    
        const stepConfig = bookCreationWorkflow.find(s => s.id === currentStep.id);
        if (stepConfig?.output.type === 'options' && 'key' in stepConfig.output) {
            const key = stepConfig.output.key as keyof BookState;
            updateBookState({ [key]: text });
        }
    
        if (shouldAdvance) {
            advanceToNextStep();
            const newStepId = useBookStore.getState().getCurrentStep().id;
            
            if (newStepId === 'edit_chapter_loop') {
                const nextChapterToEditIndex = useBookStore.getState().bookState.chapters.findIndex(c => c.status === 'drafted');
                if (nextChapterToEditIndex !== -1) {
                    updateBookState({ editingChapterIndex: nextChapterToEditIndex });
                }
            }
            nextStepId = newStepId;
        }
    
        const response = await processStep(useBookStore.getState().messages, nextStepId, useBookStore.getState().bookState, selectedModelId);
    
        if (response.success) {
            handleApiResponse(response.data, nextStepId);
        } else {
            addMessage({ id: 'error', role: 'model', parts: [{ text: `Oh no, a little glitch in the matrix! Here's the technical mumbo-jumbo: ${response.error}` }] });
        }
    
        setIsLoading(false);
    };

    React.useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;

        if (messages.length === 0) {
            const firstStep = bookCreationWorkflow[0];
            if (firstStep && firstStep.output.type === 'options') {
                addMessage({
                    id: 'jim-intro',
                    role: 'model',
                    parts: [{ text: firstStep.userInstruction || "Hello there! What kind of book are we creating today?" }],
                    options: firstStep.output.options as Option[]
                });
            }
        }
    }, [messages.length, addMessage]);

    return {
        mainView,
        selectedModelId,
        setMainView,
        setSelectedModelId,
        handleUserAction,
    };
};
