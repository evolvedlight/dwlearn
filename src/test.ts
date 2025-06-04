import dotenv from 'dotenv';
import { DWService } from './dwService';

// Load environment variables
dotenv.config();

/**
 * Simple test to fetch and display DW articles without AI processing
 * Useful for testing the basic functionality
 */
async function testDWService() {
  console.log('🧪 Testing DW Service...');
  
  try {
    const dwService = new DWService();
    const articles = await dwService.getLatestArticles(2); // Fetch only 2 for testing
    
    console.log(`\n✅ Successfully fetched ${articles.length} articles:\n`);
    
    articles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   Published: ${new Date(article.pubDate).toLocaleDateString()}`);
      console.log(`   Audio: ${article.audioUrl ? '🎧 Available' : '❌ Not available'}`);
      console.log(`   Text length: ${article.textContent.length} characters`);
      console.log(`   Link: ${article.link}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDWService();
}
