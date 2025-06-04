import axios from 'axios';
import { WordExplanation, Quiz, GitHubModelsResponse } from './types';

/**
 * Service for interacting with GitHub Models AI
 */
export class AIService {
  private readonly token: string;
  private readonly endpoint: string;

  constructor() {
    this.token = process.env.GITHUB_TOKEN || '';
    this.endpoint = process.env.GITHUB_MODEL_ENDPOINT || 'https://models.inference.ai.azure.com';
    
    if (!this.token) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }
  }

  /**
   * Identifies difficult German words in the text and provides explanations
   */
  async explainDifficultWords(text: string): Promise<WordExplanation[]> {
    const prompt = `
    Analyze the following German text and identify 5-8 difficult words that would be challenging for intermediate German learners. 
    For each word, provide:
    1. The word itself
    2. A clear definition in English
    3. An example sentence in German using the word
    4. Difficulty level (beginner/intermediate/advanced)
    5. Part of speech

    Return the response as a JSON array of objects with properties: word, definition, example, difficulty, partOfSpeech.

    German text:
    ${text}
    `;

    try {
      const response = await this.callGitHubModels(prompt);
      return this.parseWordExplanations(response);
    } catch (error) {
      console.error('Error getting word explanations:', error);
      return [];
    }
  }

  /**
   * Generates quiz questions based on the article content and word explanations
   */
  async generateQuiz(text: string, explanations: WordExplanation[]): Promise<Quiz[]> {
    const wordsForQuiz = explanations.map(e => e.word).join(', ');
    
    const prompt = `
    Create 4-5 multiple choice quiz questions based on this German text and the difficult words: ${wordsForQuiz}

    The quiz should test:
    1. Reading comprehension of the main article
    2. Understanding of the difficult German words
    3. Grammar and context usage

    For each question, provide:
    - question: The question text in English
    - options: Array of 4 possible answers
    - correctAnswer: Index (0-3) of the correct answer
    - explanation: Brief explanation of why the answer is correct
    - relatedWord: (optional) If the question relates to a specific difficult word

    Return as JSON array of objects.

    German text:
    ${text}
    `;

    try {
      const response = await this.callGitHubModels(prompt);
      return this.parseQuizQuestions(response);
    } catch (error) {
      console.error('Error generating quiz:', error);
      return [];
    }
  }

  /**
   * Makes a call to GitHub Models API
   */
  private async callGitHubModels(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.endpoint}/chat/completions`,
        {
          messages: [
            {
              role: 'system',
              content: 'You are a helpful German language learning assistant. Always respond with valid JSON when requested.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'gpt-4o',
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data as GitHubModelsResponse;
      return result.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('GitHub Models API error:', error);
      throw new Error('Failed to call GitHub Models API');
    }
  }

  /**
   * Parses word explanations from AI response
   */
  private parseWordExplanations(response: string): WordExplanation[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse word explanations:', error);
      return [];
    }
  }

  /**
   * Parses quiz questions from AI response
   */
  private parseQuizQuestions(response: string): Quiz[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse quiz questions:', error);
      return [];
    }
  }
}
