
import { BookFormatTitle, Genre } from '../types';

type ChapterCountOptions = {
    low: number;
    medium: number;
    high: number;
};

// Data sourced from industry best practices and genre conventions.
// This provides a strategic starting point for authors.
export const CHAPTER_COUNT_OPTIONS: Record<BookFormatTitle, Record<Genre | 'default', ChapterCountOptions>> = {
    'Novel': {
        'default': { low: 25, medium: 40, high: 60 },
        'Science Fiction': { low: 30, medium: 45, high: 70 },
        'Fantasy': { low: 35, medium: 50, high: 80 },
        'Romance': { low: 20, medium: 30, high: 45 },
        'Thriller': { low: 40, medium: 60, high: 100 },
        'Mystery': { low: 30, medium: 40, high: 50 },
        'Horror': { low: 25, medium: 40, high: 60 },
        'Historical Fiction': { low: 30, medium: 45, high: 65 },
    },
    'Novella': {
        'default': { low: 10, medium: 15, high: 20 },
        'Romance': { low: 8, medium: 12, high: 18 },
        'Science Fiction': { low: 10, medium: 15, high: 25 },
        'Fantasy': { low: 10, medium: 15, high: 25 },
    },
    'How-To / Self-Help Guide': {
        'default': { low: 7, medium: 10, high: 15 },
    },
    'Memoir': {
        'default': { low: 15, medium: 25, high: 35 },
    },
    'Episodic Series (Kindle Vella)': {
        'default': { low: 50, medium: 75, high: 100 }, // Episodes are chapters
    },
    'Short Story Collection': {
        'default': { low: 5, medium: 8, high: 12 }, // Stories are chapters
    },
    'Flash Fiction / Vignette': {
        'default': { low: 1, medium: 1, high: 1 }, // Typically single-chapter
    }
};
