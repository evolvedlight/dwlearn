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
      
      // Load existing processed data
      console.log('📁 Loading existing processed data...');
      const existingData = await this.loadExistingData();
      console.log(`✅ Found ${existingData.length} previously processed articles`);
      
      // Fetch latest articles from DW
      console.log('📰 Fetching latest articles...');
      const articles = await this.dwService.getLatestArticles(5);
      
      if (articles.length === 0) {
        console.log('⚠️ No articles found');
        return;
      }

      console.log(`✅ Found ${articles.length} articles from RSS feed`);
      
      // Filter out articles that have already been processed
      const existingIds = new Set(existingData.map(item => item.article.id));
      const newArticles = articles.filter(article => !existingIds.has(article.id));
      
      console.log(`📋 Articles to process: ${newArticles.length} new, ${existingData.length} existing`);
      
      if (newArticles.length === 0) {
        console.log('✨ No new articles to process! Using existing data.');
        // Generate website with existing data
        await this.websiteGenerator.generateWebsite(existingData);
        console.log('🎉 Website regenerated with existing data!');
        return;
      }

      // Process only new articles with AI
      const newProcessedArticles: ProcessedArticle[] = [];
      
      for (let i = 0; i < newArticles.length; i++) {
        const article = newArticles[i];
        console.log(`🤖 Processing NEW article ${i + 1}/${newArticles.length}: ${article.title}`);
        
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
          
          newProcessedArticles.push({
            article,
            explanations,
            quizzes,
            processedDate: new Date().toISOString()
          });
          
          console.log(`  ✅ Processed: ${explanations.length} explanations, ${quizzes.length} quiz questions`);
          
          // Add delay to avoid rate limiting
          if (i < newArticles.length - 1) {
            console.log('  ⏳ Waiting to avoid rate limits...');
            await this.delay(2000);
          }
        } catch (error) {
          console.error(`  ❌ Error processing article "${article.title}":`, error);
          // Continue with other articles even if one fails
        }
      }

      // Combine existing and new data
      const allProcessedArticles = [...existingData, ...newProcessedArticles];

      // Save all processed data (including updates)
      await this.saveProcessedData(allProcessedArticles);

      // Generate static website
      console.log('🌐 Generating static website...');
      await this.websiteGenerator.generateWebsite(allProcessedArticles);

      console.log('🎉 Application completed successfully!');
      console.log(`📊 Summary:`);
      console.log(`   - Articles processed: ${allProcessedArticles.length} total (${newProcessedArticles.length} new)`);
      console.log(`   - Total word explanations: ${allProcessedArticles.reduce((sum: number, a: ProcessedArticle) => sum + a.explanations.length, 0)}`);
      console.log(`   - Total quiz questions: ${allProcessedArticles.reduce((sum: number, a: ProcessedArticle) => sum + a.quizzes.length, 0)}`);
      console.log(`   - Website generated in: ./public`);

    } catch (error) {
      console.error('💥 Application error:', error);
      process.exit(1);
    }
  }
  /**
   * Loads existing processed data from the data directory
   */
  private async loadExistingData(): Promise<ProcessedArticle[]> {
    try {
      const dataDir = './data';
      
      // Check if data directory exists
      try {
        await fs.access(dataDir);
      } catch {
        console.log('📁 No existing data directory found');
        return [];
      }

      // Read all JSON files in the data directory
      const files = await fs.readdir(dataDir);
      const jsonFiles = files.filter(file => file.endsWith('.json') && file.startsWith('processed-articles-'));
      
      if (jsonFiles.length === 0) {
        console.log('📁 No existing processed data files found');
        return [];
      }

      // Load and combine data from all files
      const allData: ProcessedArticle[] = [];
      for (const file of jsonFiles) {
        try {
          const filepath = path.join(dataDir, file);
          const content = await fs.readFile(filepath, 'utf-8');
          const data = JSON.parse(content) as ProcessedArticle[];
          allData.push(...data);
          console.log(`📄 Loaded ${data.length} articles from ${file}`);
        } catch (error) {
          console.warn(`⚠️ Error loading ${file}:`, error);
        }
      }

      // Remove duplicates based on article ID
      const uniqueData = allData.filter((item, index, self) => 
        index === self.findIndex(other => other.article.id === item.article.id)
      );

      console.log(`📚 Total unique articles loaded: ${uniqueData.length}`);
      return uniqueData;
    } catch (error) {
      console.warn('⚠️ Error loading existing data:', error);
      return [];
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
