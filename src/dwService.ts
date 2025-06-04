import axios from 'axios';
import * as cheerio from 'cheerio';
import { NewsArticle } from './types.js';

interface GraphQLResponse {
  data: {
    content: {
      id: number;
      name: string;
      teaser: string;
      text: string;
      audios: Array<{
        id: number;
        mp3Src: string;
        formattedDuration: string;
      }>;
    };
  };
}

export class DWService {
  private readonly RSS_URL = 'https://rss.dw.com/xml/dkpodcast_lgn_de';
  private readonly GRAPHQL_URL = 'https://learngerman.dw.com/graphql';
  private readonly GRAPHQL_HASH = '284477e6a28a04c4abc8177b4c21a3f265db23ac3947b75fd0dd0ae015aeb183';
  
  /**
   * Fetches the latest German news articles from Deutsche Welle RSS feed
   */
  async getLatestArticles(limit: number = 5): Promise<NewsArticle[]> {
    try {
      console.log(`Fetching RSS feed from: ${this.RSS_URL}`);
      const response = await axios.get(this.RSS_URL);
      const $ = cheerio.load(response.data, { xmlMode: true });
      
      const articles: NewsArticle[] = [];
      
      $('item').slice(0, limit).each((index, element) => {
        const title = $(element).find('title').text().trim();
        const description = $(element).find('description').text().trim();
        const link = $(element).find('link').text().trim();
        const pubDate = $(element).find('pubDate').text().trim();
        
        // Extract audio URL from enclosure
        const audioUrl = $(element).find('enclosure').attr('url') || '';
        
        if (title && link) {
          const articleId = this.extractArticleId(link);
          articles.push({
            id: articleId,
            title,
            description,
            url: link,
            audioUrl,
            publishedAt: new Date(pubDate),
            content: '', // Will be filled by getArticleContent
            words: [],
            quiz: null
          });
        }
      });
      
      console.log(`Extracted ${articles.length} articles from RSS feed`);
      return articles;
    } catch (error) {
      console.error('Error fetching RSS feed:', error);
      throw new Error(`Failed to fetch articles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extracts the article ID from a DW URL
   */
  private extractArticleId(url: string): string {
    // Extract ID from URLs like "/de/04062025-langsam-gesprochene-nachrichten/a-72784101"
    const match = url.match(/\/a-(\d+)/);
    return match ? match[1] : url;
  }

  /**
   * Fetches the full content of an article using the GraphQL API
   */
  async getArticleContent(article: NewsArticle): Promise<string> {
    try {
      console.log(`Fetching content for article ID: ${article.id} (${article.title})`);
      
      // Try to parse article ID as number
      const articleId = parseInt(article.id);
      if (isNaN(articleId)) {
        console.warn(`Invalid article ID: ${article.id}, using fallback content`);
        return this.generateFallbackContent(article);
      }
      
      // Fetch content from GraphQL API
      const content = await this.fetchFromGraphQL(articleId);
      if (content && content.length > 100) {
        return this.cleanHtmlContent(content);
      }
      
      // If GraphQL fails, generate fallback content
      console.log('GraphQL content fetch failed, generating fallback content');
      return this.generateFallbackContent(article);
      
    } catch (error) {
      console.error(`Error fetching content for article ${article.id}:`, error);
      return this.generateFallbackContent(article);
    }
  }

  /**
   * Fetches article content from the GraphQL API
   */
  private async fetchFromGraphQL(articleId: number): Promise<string> {
    try {
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
            sha256Hash: this.GRAPHQL_HASH
          }
        }
      };

      console.log(`Fetching from GraphQL API for article ID: ${articleId}`);
      const response = await axios.post<GraphQLResponse>(this.GRAPHQL_URL, graphqlQuery, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 15000
      });      if (response.data?.data?.content?.text) {
        console.log(`Successfully fetched content from GraphQL API`);
        return response.data.data.content.text;
      } else {
        console.log('No content found in GraphQL response');
        return '';
      }
      
    } catch (error) {
      console.error('Error fetching from GraphQL API:', error);
      return '';
    }
  }

  /**
   * Cleans HTML content and extracts plain text
   */
  private cleanHtmlContent(htmlContent: string): string {
    try {
      const $ = cheerio.load(htmlContent);
      
      // Remove script and style elements
      $('script, style').remove();      // Get text content and clean it up
      const text = $('body').text() || $.root().text()
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
        .trim();
      
      return text;
    } catch (error) {
      console.error('Error cleaning HTML content:', error);
      // Fallback: simple HTML tag removal
      return htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }

  /**
   * Generates fallback content when content fetching fails
   */
  private generateFallbackContent(article: NewsArticle): string {
    return `${article.title}

${article.description}

Dies ist ein Artikel aus den "Langsam gesprochene Nachrichten" von Deutsche Welle. 
Der vollständige Text konnte nicht automatisch abgerufen werden, aber Sie können den Artikel unter folgendem Link lesen: ${article.url}

Nutzen Sie die Audio-Datei, um Ihr Hörverständnis zu verbessern.`;
  }
}
