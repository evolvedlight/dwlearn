import axios from 'axios';
import { DWService } from './dwService';

/**
 * Enhanced test with detailed debugging
 */
async function testWithDebugging() {
  console.log('🔍 Enhanced DW Service Test with Debugging\n');
  
  try {
    // Test 1: Check if we can reach the RSS URL
    console.log('📡 Step 1: Testing RSS feed accessibility...');
    const rssUrl = 'https://rss.dw.com/xml/dkpodcast_lgn_de';
    
    console.log(`   🌐 Attempting to fetch: ${rssUrl}`);
    const response = await axios.get(rssUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`   ✅ RSS feed response: ${response.status} ${response.statusText}`);
    console.log(`   📊 Content length: ${response.data.length} characters`);
    
    // Test 2: Check RSS structure
    console.log('\n🔍 Step 2: Analyzing RSS structure...');
    const contentPreview = response.data.substring(0, 500);
    console.log(`   📄 Content preview:\n${contentPreview}...\n`);
    
    // Test 3: Use our service
    console.log('📰 Step 3: Testing DW Service...');
    const dwService = new DWService();
    const articles = await dwService.getLatestArticles(3);
    
    if (articles.length > 0) {
      console.log(`✅ Success! Found ${articles.length} articles:`);
      articles.forEach((article, index) => {
        console.log(`   ${index + 1}. ${article.title}`);
        console.log(`      🔗 ${article.link}`);
        console.log(`      📅 ${article.pubDate}`);
        console.log(`      🎧 Audio: ${article.audioUrl ? 'Yes' : 'No'}`);
        console.log(`      📝 Text: ${article.textContent.length} chars`);
        console.log('');
      });
    } else {
      console.log('⚠️  No articles parsed from RSS feed');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    
    if (axios.isAxiosError(error)) {
      console.log('\n🔧 Network Error Details:');
      console.log(`   Code: ${error.code}`);
      console.log(`   Message: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Status Text: ${error.response.statusText}`);
      }
    }
    
    console.log('\n💡 Possible solutions:');
    console.log('   1. Check your internet connection');
    console.log('   2. Try using a VPN if DW is blocked in your region');
    console.log('   3. Check if your firewall is blocking the request');
    console.log('   4. The RSS feed might be temporarily unavailable');
  }
}

testWithDebugging();
