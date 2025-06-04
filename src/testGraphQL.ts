import { DWService } from './dwService.js';

/**
 * Test script to verify GraphQL integration with DW's API
 */
async function testGraphQLIntegration() {
  const dwService = new DWService();
  
  try {
    console.log('🔍 Testing DW GraphQL Integration...\n');
    
    // Step 1: Fetch RSS feed
    console.log('1. Fetching RSS feed...');
    const articles = await dwService.getLatestArticles(3);
    console.log(`   ✅ Found ${articles.length} articles from RSS feed\n`);
    
    // Step 2: Test GraphQL content fetching for each article
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      console.log(`2.${i + 1} Testing GraphQL for: ${article.title}`);
      console.log(`     Article ID: ${article.id}`);
      console.log(`     URL: ${article.url}`);
      
      try {
        const content = await dwService.getArticleContent(article);
        console.log(`     ✅ Content fetched: ${content.length} characters`);
        
        if (content.length > 200) {
          // Show first 200 characters as preview
          console.log(`     Preview: "${content.substring(0, 200)}..."`);
        } else {
          console.log(`     Full content: "${content}"`);
        }
        
        console.log(''); // Empty line for readability
        
      } catch (error) {
        console.error(`     ❌ Error fetching content:`, error);
        console.log('');
      }
    }
    
    console.log('✅ GraphQL Integration Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testGraphQLIntegration().catch(error => {
  console.error('❌ Unhandled error in test:', error);
  process.exit(1);
});
