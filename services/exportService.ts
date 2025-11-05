
import { BookState } from '../types';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from '../utils/fileSaver';

const compileManuscript = (bookState: BookState, format: 'md' | 'txt'): string => {
    let manuscript = '';
    const hr = format === 'md' ? '\n\n---\n\n' : '\n\n********************\n\n';

    if (bookState.globalOutline) {
        manuscript += format === 'md' ? `# Global Outline\n\n` : `Global Outline\n\n`;
        manuscript += `${bookState.globalOutline}${hr}`;
    }

    if (bookState.chapters && bookState.chapters.length > 0) {
        manuscript += bookState.chapters
            .map(c => {
                const title = format === 'md' ? `# ${c.title}\n\n` : `${c.title}\n\n`;
                return `${title}${c.content}`;
            })
            .join(hr);
    }
    return manuscript;
};

export const exportAsTxt = (bookState: BookState, title: string = 'manuscript') => {
    const content = compileManuscript(bookState, 'txt');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${title}.txt`);
};

export const exportAsMarkdown = (bookState: BookState, title: string = 'manuscript') => {
    const content = compileManuscript(bookState, 'md');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${title}.md`);
};

const createParagraphsFromMarkdown = (text: string): Paragraph[] => {
    if (!text) return [];
    // This simple parser handles basic newlines. A more advanced version could handle bold/italics.
    return text.split('\n').map(line => new Paragraph({
        children: [new TextRun(line)],
        spacing: { after: 200 }
    }));
};

export const exportAsDocx = async (bookState: BookState, title: string = 'manuscript') => {
    const children: (Paragraph)[] = [];

    if (bookState.globalOutline) {
        children.push(new Paragraph({
            text: "Global Outline",
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 240 }
        }));
        children.push(...createParagraphsFromMarkdown(bookState.globalOutline));
        // FIX: Replaced deprecated `new docx.HorizontalRule()` with `thematicBreak: true` for modern `docx` library versions. This creates a horizontal rule.
        children.push(new Paragraph({ thematicBreak: true }));
    }

    if (bookState.chapters && bookState.chapters.length > 0) {
        for (const chapter of bookState.chapters) {
            children.push(new Paragraph({
                text: chapter.title,
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 240 }
            }));
            children.push(...createParagraphsFromMarkdown(chapter.content));
            // Add a page break after each chapter except the last one
            if (bookState.chapters.indexOf(chapter) < bookState.chapters.length - 1) {
                 children.push(new Paragraph({ pageBreakBefore: true }));
            }
        }
    }
    
    const doc = new Document({
        sections: [{
            properties: {},
            children,
        }],
    });

    try {
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${title}.docx`);
    } catch (e) {
        console.error("Error generating .docx file", e);
        alert("Sorry, there was an error generating the .docx file.");
    }
};