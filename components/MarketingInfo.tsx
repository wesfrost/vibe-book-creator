
import React from 'react';
import { BookState } from '../types';
import { renderMarkdown } from '../utils/markdownRenderer';

interface MarketingInfoProps {
    bookState: BookState;
}

const MarketingInfo: React.FC<MarketingInfoProps> = ({ bookState }) => {
    const { kdpKeywords, bookCategories, blurb } = bookState;

    return (
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
            <h2 className="text-2xl font-bold text-teal-400 mb-6">📢 Marketing & Publishing</h2>
            <div className="space-y-8">
                
                {/* KDP Keywords Section */}
                <div>
                    <h3 className="font-semibold text-lg mb-3 text-gray-300">🔑 KDP Keywords</h3>
                    {kdpKeywords && kdpKeywords.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {kdpKeywords.map((keyword, index) => (
                                <span key={index} className="bg-gray-700 text-gray-200 text-sm font-medium px-3 py-1 rounded-full">
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">Keywords will be generated here...</p>
                    )}
                </div>

                {/* Book Categories Section */}
                <div>
                    <h3 className="font-semibold text-lg mb-3 text-gray-300">📚 Book Categories</h3>
                    {bookCategories && bookCategories.length > 0 ? (
                         <ul className="list-disc list-inside space-y-1 text-gray-300">
                            {bookCategories.map((category, index) => (
                                <li key={index}>{category}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 italic">Categories will be generated here...</p>
                    )}
                </div>
                
                {/* Blurb Section */}
                <div>
                    <h3 className="font-semibold text-lg mb-3 text-gray-300">✒️ Compelling Blurb</h3>
                     {blurb ? (
                        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
                            <div className="prose prose-invert prose-p:my-2 max-w-none text-gray-200">
                               {renderMarkdown(blurb)}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">Your book blurb will be drafted here...</p>
                    )}
                </div>

            </div>
        </div>
    );
};

export default MarketingInfo;
