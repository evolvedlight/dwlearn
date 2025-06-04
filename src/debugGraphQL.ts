import axios from 'axios';

/**
 * Debug script to test the GraphQL API directly and examine the response
 */
async function debugGraphQL() {
  const GRAPHQL_URL = 'https://learngerman.dw.com/graphql';
  const GRAPHQL_HASH = '284477e6a28a04c4abc8177b4c21a3f265db23ac3947b75fd0dd0ae015aeb183';
  
  // Test with a known article ID
  const articleId = 72784101;
  
  const graphqlQuery = {
    operationName: "ContentPage",
    variables: {
      id: articleId,
      lang: "GERMAN",
      appName: "mdl"
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: GRAPHQL_HASH
      }
    }
  };

  try {
    console.log('🔍 Testing GraphQL API directly...\n');
    console.log('Request URL:', GRAPHQL_URL);
    console.log('Request Body:', JSON.stringify(graphqlQuery, null, 2));
    console.log('\n🚀 Sending request...\n');
    
    const response = await axios.post(GRAPHQL_URL, graphqlQuery, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        'Referer': 'https://learngerman.dw.com/'
      },
      timeout: 15000
    });

    console.log('✅ Response Status:', response.status);
    console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('\n📄 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
      if (response.data?.data?.content) {
      console.log('\n🎉 Content found!');
      const content = response.data.data.content;
      console.log('- ID:', content.id);
      console.log('- Name:', content.name);
      console.log('- Text length:', content.text?.length || 0);
      if (content.text) {
        console.log('- Text preview:', content.text.substring(0, 200) + '...');
      }
    } else {
      console.log('\n❌ No content found in response');
    }
    
  } catch (error) {
    console.error('❌ Request failed:');
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Response Headers:', JSON.stringify(error.response?.headers, null, 2));
    } else {
      console.error('Error:', error);
    }
  }
}

debugGraphQL().catch(console.error);
