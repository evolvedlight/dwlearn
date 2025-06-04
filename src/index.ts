import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { DWService } from './dwService';
import { AIService } from './aiService';
import { WebsiteGenerator } from './websiteGenerator';
import { ProcessedArticle } from './types';

// Load environment variables
dotenv.config();

/**
 * Main application class for the DW German Learning application
 */
class DWLearningApp {
  private dwService: DWService;
  private aiService: AIService;
  private websiteGenerator: WebsiteGenerator;

  constructor() {
    this.dwService = new DWService();
    this.aiService = new AIService();
    this.websiteGenerator = new WebsiteGenerator('./public');
  }

  /**
   * Main application entry point
   */
  async run(): Promise<void> {
    try {
      console.log('🚀 Starting DW German Learning App...');
        // Fetch latest articles from DW
      console.log('📰 Fetching latest articles...');
      const articles = await this.dwService.getLatestArticles(5);
      
      if (articles.length === 0) {
        console.log('⚠️ No articles found');
        return;
      }

      console.log(`✅ Found ${articles.length} articles`);      // Process each article with AI
      const processedArticles: ProcessedArticle[] = [];
      
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        console.log(`🤖 Processing article ${i + 1}/${articles.length}: ${article.title}`);
        
        try {
          // First get the full content
          console.log('  📄 Fetching article content...');
          article.content = await this.dwService.getArticleContent(article);
          
          // Get word explanations
          console.log('  📚 Analyzing difficult words...');
          const explanations = await this.aiService.explainDifficultWords(article.content);
          
          // Generate quiz questions
          console.log('  ❓ Generating quiz questions...');
          const quizzes = await this.aiService.generateQuiz(article.content, explanations);
          
          processedArticles.push({
            article,
            explanations,
            quizzes,
            processedDate: new Date().toISOString()
          });
          
          console.log(`  ✅ Processed: ${explanations.length} explanations, ${quizzes.length} quiz questions`);
          
          // Add delay to avoid rate limiting
          if (i < articles.length - 1) {
            console.log('  ⏳ Waiting to avoid rate limits...');
            await this.delay(2000);
          }
        } catch (error) {
          console.error(`  ❌ Error processing article "${article.title}":`, error);
          // Continue with other articles even if one fails
        }
      }

      // Save processed data
      await this.saveProcessedData(processedArticles);

      // Generate static website
      console.log('🌐 Generating static website...');
      await this.websiteGenerator.generateWebsite(processedArticles);

      console.log('🎉 Application completed successfully!');
      console.log(`📊 Summary:`);
      console.log(`   - Articles processed: ${processedArticles.length}`);
      console.log(`   - Total word explanations: ${processedArticles.reduce((sum, a) => sum + a.explanations.length, 0)}`);
      console.log(`   - Total quiz questions: ${processedArticles.reduce((sum, a) => sum + a.quizzes.length, 0)}`);
      console.log(`   - Website generated in: ./public`);

    } catch (error) {
      console.error('💥 Application error:', error);
      process.exit(1);
    }
  }

  /**
   * Saves processed data to JSON file for reference
   */
  private async saveProcessedData(articles: ProcessedArticle[]): Promise<void> {
    const dataDir = './data';
    await fs.mkdir(dataDir, { recursive: true });
    
    const filename = `processed-articles-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(dataDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(articles, null, 2));
    console.log(`💾 Processed data saved to: ${filepath}`);
  }

  /**
   * Utility function to add delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the application if this file is executed directly
if (require.main === module) {
  const app = new DWLearningApp();
  app.run().catch(error => {
    console.error('Failed to run application:', error);
    process.exit(1);
  });
}

export { DWLearningApp };
