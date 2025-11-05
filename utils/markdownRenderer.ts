import React from 'react';

// FIX: Replaced (JSX.Element | null)[] with React.ReactNode[] to resolve "Cannot find namespace 'JSX'" error.
// This uses the React namespace directly, which is more robust.
// FIX: Replaced JSX syntax with React.createElement calls to be valid in a .ts file.
export const renderMarkdown = (text: string): React.ReactNode[] => {
    // Split by newlines, but also by horizontal rule '---'
    return text.split(/(\n|---)/g).map((line, index) => {
        if (line.trim() === '') return React.createElement('br', { key: index });
        if (line.trim() === '---') return React.createElement('hr', { key: index, className: "my-6 border-gray-600" });

        if (line.startsWith('# ')) {
            return React.createElement('h1', { key: index, className: "text-3xl font-bold mt-4 mb-2" }, line.substring(2));
        }
        if (line.startsWith('## ')) {
            return React.createElement('h2', { key: index, className: "text-2xl font-bold mt-3 mb-1" }, line.substring(3));
        }
         if (line.startsWith('### ')) {
            return React.createElement('h3', { key: index, className: "text-xl font-bold mt-2" }, line.substring(4));
        }

        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g).filter(part => part);

        return React.createElement(
            'p',
            { key: index, className: "my-1 leading-relaxed" },
            parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return React.createElement('strong', { key: i }, part.slice(2, -2));
                }
                if (part.startsWith('*') && part.endsWith('*')) {
                    return React.createElement('em', { key: i, className: "italic" }, part.slice(1, -1));
                }
                return React.createElement('span', { key: i }, part);
            })
        );
    });
};
