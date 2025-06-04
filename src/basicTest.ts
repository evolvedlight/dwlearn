import { DWService } from './dwService';

/**
 * Test DW content fetching without AI processing
 * This doesn't require a GitHub token
 */
async function testBasicFunctionality() {
  console.log('🧪 Testing basic DW content fetching...');
  console.log('ℹ️  This test does NOT require a GitHub token\n');
  
  try {
    const dwService = new DWService();
    
    console.log('📡 Fetching latest articles from Deutsche Welle...');
    const articles = await dwService.getLatestArticles(2); // Just 2 for testing
    
    if (articles.length === 0) {
      console.log('⚠️  No articles found. This might be a network issue or the RSS feed might be down.');
      return;
    }
    
    console.log(`\n✅ Successfully fetched ${articles.length} articles:\n`);
      articles.forEach((article: any, index: number) => {
      console.log(`${index + 1}. 📰 ${article.title}`);
      console.log(`   📅 Published: ${new Date(article.publishedAt).toLocaleDateString()}`);
      console.log(`   🎧 Audio: ${article.audioUrl ? 'Available' : 'Not available'}`);
      console.log(`   📝 Content length: ${article.content.length} characters`);
      console.log(`   🔗 URL: ${article.url}`);
      
      // Show first 200 characters of content
      if (article.content.length > 0) {
        console.log(`   📄 Preview: ${article.content.substring(0, 200)}...`);
      }
      console.log('');
    });
    
    console.log('🎉 Basic functionality test completed successfully!');
    console.log('💡 Next step: Set up your GitHub token to enable AI features.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   - Check your internet connection');
    console.log('   - Verify the DW RSS feed is accessible');
    console.log('   - Try running the test again in a few minutes');
  }
}

// Run the test
testBasicFunctionality();
