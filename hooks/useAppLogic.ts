
import React from 'react';
import { bookCreationWorkflow } from '../config/bookCreationWorkflow';
import { processStep } from '../services/orchestrationService';
import { useBookStore } from '../store/useBookStore';
import { ChatMessage, Option, BookState } from '../types';
import { DEFAULT_AI_MODEL_ID } from '../config/aiModels';

type MainView = 'progress' | 'editor' | 'dashboard' | 'outline';

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
        updateChapterContent,
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

        switch (stepConfig.output.type) {
            case 'outline':
                handleOutlineResponse(response);
                break;
            case 'chapter_draft':
                handleChapterDraftResponse(response);
                break;
            case 'chapter_review':
                handleChapterReviewResponse(response);
                break;
            case 'options':
                handleGenericResponse(response);
                break;
            default:
                addMessage({ id: 'error', role: 'model', parts: [{ text: `I received an unexpected response from the AI. Let's try that again.` }] });
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
            status: 'outlined'
        }));
        updateBookState({ chapters: chaptersFromOutline });
        const currentStep = getCurrentStep();
        const stepConfig = bookCreationWorkflow.find(s => s.id === currentStep.id);
        handleGenericResponse({}, stepConfig?.userInstruction); 
        setMainView('outline');
    }, [getCurrentStep, addMessage, updateBookState]);

    const handleChapterDraftResponse = React.useCallback((responseData: any) => {
        if (typeof responseData.chapterNumber !== 'number') {
            addMessage({ id: 'error', role: 'model', parts: [{ text: "There was an issue identifying the chapter to update. Let's try again." }] });
            return;
        }
        const chapterIndex = bookState.chapters.findIndex(c => c.chapterNumber === responseData.chapterNumber);
        if (chapterIndex === -1) {
            addMessage({ id: 'error', role: 'model', parts: [{ text: "I seem to have lost my place! Could you tell me which chapter we were working on?" }] });
            return;
        }
        
        updateChapterContent(chapterIndex, responseData.chapterContent);
        
        const currentStep = getCurrentStep();
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
        setMainView('editor');
    }, [bookState.chapters, getCurrentStep, addMessage, updateChapterContent]);
    
    const handleChapterReviewResponse = React.useCallback((responseData: any) => {
        if (typeof responseData.chapterNumber !== 'number') {
            addMessage({ id: 'error', role: 'model', parts: [{ text: "There was an issue identifying the chapter for review. Let's try again." }] });
            return;
        }
    
        const chapterIndex = bookState.chapters.findIndex(c => c.chapterNumber === responseData.chapterNumber);
        if (chapterIndex === -1) {
            addMessage({ id: 'error', role: 'model', parts: [{ text: "I can't seem to find the chapter we're supposed to be editing. Could you point me in the right direction?" }] });
            return;
        }
    
        updateBookState({ editingChapterIndex: chapterIndex });
    
        handleGenericResponse(responseData);
        setMainView('editor');
    }, [bookState, updateBookState, addMessage]);

    const handleUserAction = async (text: string, isSelection: boolean = true) => {
        if (isLoading) return;
    
        addMessage({ id: Date.now().toString(), role: 'user', parts: [{ text }], isSystem: isSelection });
        setIsLoading(true);
    
        const currentStep = getCurrentStep();
        const stepConfig = bookCreationWorkflow.find(s => s.id === currentStep.id);
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
            }
            shouldAdvance = false; 
        }
    
        if (stepConfig?.output.type === 'options' && 'key' in stepConfig.output) {
            const key = stepConfig.output.key as keyof BookState;
            updateBookState({ [key]: text });
        }
    
        if (shouldAdvance) {
            advanceToNextStep();
            nextStepId = useBookStore.getState().getCurrentStep().id;
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
