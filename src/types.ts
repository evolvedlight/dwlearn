/**
 * Types for the DW German Learning Application
 */

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  audioUrl: string;
  publishedAt: Date;
  content: string;
  words: WordExplanation[];
  quiz: Quiz | null;
}

export interface WordExplanation {
  word: string;
  definition: string;
  example: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  partOfSpeech: string;
}

export interface Quiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  relatedWord?: string;
}

export interface ProcessedArticle {
  article: NewsArticle;
  explanations: WordExplanation[];
  quizzes: Quiz[];
  processedDate: string;
}

export interface GitHubModelsResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}
