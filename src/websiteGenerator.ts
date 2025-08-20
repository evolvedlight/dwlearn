import fs from 'fs/promises';
import path from 'path';
import { ProcessedArticle } from './types';

/**
 * Service for generating static website content
 */
export class WebsiteGenerator {
  private readonly outputDir: string;

  constructor(outputDir: string = './public') {
    this.outputDir = outputDir;
  }

  /**
   * Generates the complete static website
   */
  async generateWebsite(articles: ProcessedArticle[]): Promise<void> {
    console.log('Generating static website...');
    
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'articles'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'css'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'js'), { recursive: true });

    // Generate main index page
    await this.generateIndexPage(articles);
    
    // Generate individual article pages
    for (const processedArticle of articles) {
      await this.generateArticlePage(processedArticle);
    }
    
    // Generate CSS and JavaScript
    await this.generateStylesheet();
    await this.generateJavaScript();
    
    console.log(`Website generated with ${articles.length} articles`);
  }

    /**
     * Basic HTML escaping to prevent HTML injection in tooltips
     */
    private escapeHtml(raw: string): string {
        return raw
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

  /**
   * Generates the main index page
   */
  private async generateIndexPage(articles: ProcessedArticle[]): Promise<void> {
    const sortedArticles = [...articles].sort((a, b) => new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime());
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DW German Learning - Langsam gesprochene Nachrichten</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <h1>🇩🇪 DW German Learning</h1>
        <p>Learn German with Deutsche Welle's slow news</p>
    </header>
    
    <main>
        <div class="articles-grid">
            ${sortedArticles.map(article => `
                <div class="article-card">
                    <h2><a href="articles/${this.slugify(article.article.title)}.html">${article.article.title}</a></h2>
                    <p class="date">${new Date(article.article.publishedAt).toLocaleDateString()}</p>
                    <p class="description">${article.article.description}</p>
                    <div class="stats">
                        <span class="stat">📚 ${article.explanations.length} words explained</span>
                        <span class="stat">❓ ${article.quizzes.length} quiz questions</span>
                        ${article.article.audioUrl ? '<span class="stat">🎧 Audio available</span>' : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </main>
    
    <footer>
        <p>Generated on ${new Date().toLocaleDateString()} | Data from <a href="https://www.dw.com">Deutsche Welle</a></p>
    </footer>
</body>
</html>`;

    await fs.writeFile(path.join(this.outputDir, 'index.html'), html);
  }

  /**
   * Generates individual article pages
   */
  private async generateArticlePage(processedArticle: ProcessedArticle): Promise<void> {
    const { article, explanations, quizzes } = processedArticle;
    const filename = `${this.slugify(article.title)}.html`;
    
        // Highlight difficult words inside the article text with tooltip spans
        const highlightWord = (paragraph: string): string => {
            let result = paragraph;
            // Sort words by length desc to avoid partial replacements (e.g., 'in' inside 'international')
            const sortedExplanations = [...explanations].sort((a, b) => b.word.length - a.word.length);
            for (const exp of sortedExplanations) {
                const escapedWord = exp.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Match word boundaries using Unicode letters; keep preceding separator via capture
                const regex = new RegExp(`(^|[^\\p{L}])(${escapedWord})(?=([^\\p{L}]|$))`, 'giu');
                result = result.replace(regex, (match, p1, p2) => {
                    const safeWord = this.escapeHtml(p2);
                    const safeDef = this.escapeHtml(exp.definition);
                    const safePos = this.escapeHtml(exp.partOfSpeech || '');
                        const safeExample = this.escapeHtml(exp.example || '');
                    const tooltip = `<span class=\"explained-word ${exp.difficulty}\"><span class=\"ew-term\">${safeWord}</span><span class=\"tooltip-text\"><strong>${safeWord}</strong><br/><em>${safePos}</em><br/>${safeDef}${safeExample ? `<br/><span class=\"example\">${safeExample}</span>` : ''}</span></span>`;
                    return `${p1}${tooltip}`;
                });
            }
            return result;
        };

            // Heuristic to detect in-article subheadings (short, title-cased lines without sentence punctuation)
            const isSubheading = (text: string): boolean => {
                if (text.length < 3 || text.length > 120) return false;
                if (/[.!?]$/.test(text)) return false; // ends like a sentence
                if (/^[-*•]/.test(text)) return false; // list item
                const words = text.split(/\s+/).filter(Boolean);
                if (words.length > 0 && words.length <= 12) {
                    const capitalized = words.filter(w => /^[A-ZÄÖÜ]/.test(w));
                    if (capitalized.length / words.length >= 0.6) return true;
                }
                return false;
            };

            const processedParagraphs = article.content.split('\n\n').map((p: string) => {
                const trimmed = p.trim();
                if (!trimmed) return '';
                if (isSubheading(trimmed)) {
                    return `<h3 class="article-subheading">${highlightWord(trimmed)}</h3>`;
                }
                return `<p>${highlightWord(trimmed)}</p>`;
            }).join('');

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title} - DW German Learning</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <header>
        <nav>
            <a href="../index.html">← Back to Articles</a>
        </nav>
        <h1>${article.title}</h1>
        <p class="date">Published: ${new Date(article.publishedAt).toLocaleDateString()}</p>
    </header>
    
    <main>
        ${article.audioUrl ? `
        <section class="audio-section">
            <h2>🎧 Listen to the Article</h2>
            <audio controls>
                <source src="${article.audioUrl}" type="audio/mpeg">
                Your browser does not support the audio element.
            </audio>
        </section>
        ` : ''}
        
        <section class="text-section">
            <h2>📖 Article Text</h2>
                        <p class="hover-hint">Hover highlighted words for definitions & examples.</p>
            <div class="german-text">
                                ${processedParagraphs}
            </div>
        </section>
        
        <section class="quiz-section">
            <h2>❓ Test Your Understanding</h2>
            <div id="quiz-container">
                ${quizzes.map((quiz, index) => `
                    <div class="quiz-question" data-question="${index}">
                        <h3>Question ${index + 1}</h3>
                        <p class="question">${quiz.question}</p>
                        <div class="options">
                            ${quiz.options.map((option, optIndex) => `
                                <label>
                                    <input type="radio" name="q${index}" value="${optIndex}">
                                    ${option}
                                </label>
                            `).join('')}
                        </div>
                        <div class="answer-feedback" style="display: none;">
                            <p class="explanation">${quiz.explanation}</p>
                        </div>
                    </div>
                `).join('')}
                <button onclick="checkAnswers()" class="check-button">Check Answers</button>
                <div id="quiz-results" style="display: none;"></div>
            </div>
        </section>
    </main>
    
    <footer>
        <p><a href="${article.url}" target="_blank">Read original article on DW.com</a></p>
    </footer>
    
    <script src="../js/quiz.js"></script>
    <script>
        const quizData = ${JSON.stringify(quizzes)};
    </script>
</body>
</html>`;

    await fs.writeFile(path.join(this.outputDir, 'articles', filename), html);
  }

  /**
   * Generates the CSS stylesheet
   */
  private async generateStylesheet(): Promise<void> {
    const css = `
/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    /* Separate heading font stack */
    --heading-font: 'Georgia', 'Times New Roman', serif;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f8f9fa;
}

/* Apply heading font */
h1, h2, h3, h4, h5, h6 {
    font-family: var(--heading-font);
    font-weight: 600;
    letter-spacing: 0.5px;
}

/* Header */
header {
    background: linear-gradient(135deg, #d32f2f, #f44336);
    color: white;
    padding: 2rem;
    text-align: center;
}

header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
}

nav a {
    color: white;
    text-decoration: none;
    font-size: 1.1rem;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background-color 0.3s;
}

nav a:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

/* Main content */
main {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 1rem;
}

/* Article grid */
.articles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
}

.article-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s, box-shadow 0.3s;
}

.article-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.article-card img { /* Added style for images in article cards */
    max-width: 100%;
    height: auto;
    display: block; /* Optional: to remove extra space below image if it's an inline element */
    margin-top: 1rem; /* Optional: to add some space above the image */
    margin-bottom: 1rem; /* Optional: to add some space below the image */
    border-radius: 4px; /* Optional: to match card's rounded corners */
}

.article-card h2 a {
    color: #d32f2f;
    text-decoration: none;
}

.article-card h2 a:hover {
    text-decoration: underline;
}

.date {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 1rem;
}

.stats {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    flex-wrap: wrap;
}

.stat {
    background: #e3f2fd;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    color: #1976d2;
}

/* Article page sections */
section {
    background: white;
    margin: 2rem 0;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

section h2 {
    color: #d32f2f;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
}

/* Audio section */
.audio-section audio {
    width: 100%;
    margin-top: 1rem;
}

/* German text */
.german-text p {
    margin-bottom: 1rem;
    font-size: 1.1rem;
    line-height: 1.8;
}

.article-subheading {
    font-family: var(--heading-font);
    font-size: 1.35rem;
    margin: 2rem 0 1rem;
    color: #b71c1c;
    line-height: 1.3;
    position: relative;
}
.article-subheading:after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -6px;
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg,#d32f2f,#f44336);
    border-radius: 2px;
}

/* Explained word hover tooltips */
.hover-hint {
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 0.75rem;
}

.explained-word {
        position: relative;
        background: #fff9c4;
        padding: 0 2px;
        border-radius: 3px;
        cursor: help;
        transition: background-color 0.2s;
}
.explained-word.beginner { background: #e8f5e8; }
.explained-word.intermediate { background: #fff3e0; }
.explained-word.advanced { background: #ffebee; }
.explained-word:hover { background: #ffe082; }

.explained-word .tooltip-text {
        visibility: hidden;
        opacity: 0;
        position: absolute;
        left: 0;
        top: 110%;
        z-index: 10;
        background: #222;
        color: #fff;
        padding: 0.6rem 0.75rem;
        border-radius: 6px;
        font-size: 0.8rem;
        line-height: 1.2;
        width: 240px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        transition: opacity 0.15s;
}
.explained-word .tooltip-text .example { color: #90caf9; font-style: italic; }
.explained-word:hover .tooltip-text { visibility: visible; opacity: 1; }

@media (max-width: 600px) {
    .explained-word .tooltip-text {
        left: 50%;
        transform: translateX(-50%);
        top: 125%;
        width: 70vw;
    }
}

/* Explanations */
.explanations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
}

.explanation-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1.5rem;
    position: relative;
}

.explanation-card.beginner {
    border-left: 4px solid #4caf50;
}

.explanation-card.intermediate {
    border-left: 4px solid #ff9800;
}

.explanation-card.advanced {
    border-left: 4px solid #f44336;
}

.explanation-card h3 {
    color: #d32f2f;
    font-size: 1.3rem;
    margin-bottom: 0.5rem;
}

.part-of-speech {
    font-style: italic;
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 1rem;
}

.definition {
    margin-bottom: 1rem;
    font-weight: 500;
}

.example {
    color: #555;
    margin-bottom: 1rem;
}

.difficulty-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
}

.beginner .difficulty-badge {
    background: #e8f5e8;
    color: #2e7d32;
}

.intermediate .difficulty-badge {
    background: #fff3e0;
    color: #ef6c00;
}

.advanced .difficulty-badge {
    background: #ffebee;
    color: #c62828;
}

/* Quiz section */
.quiz-question {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.quiz-question h3 {
    color: #d32f2f;
    margin-bottom: 1rem;
}

.question {
    font-weight: 500;
    margin-bottom: 1rem;
}

.options {
    margin-bottom: 1rem;
}

.options label {
    display: block;
    padding: 0.5rem 0;
    cursor: pointer;
    transition: background-color 0.3s;
}

.options label:hover {
    background-color: #f5f5f5;
    border-radius: 4px;
}

.options input[type="radio"] {
    margin-right: 0.5rem;
}

.check-button {
    background: #d32f2f;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s;
}

.check-button:hover {
    background: #b71c1c;
}

.answer-feedback {
    background: #e8f5e8;
    border: 1px solid #4caf50;
    border-radius: 4px;
    padding: 1rem;
    margin-top: 1rem;
}

.answer-feedback.incorrect {
    background: #ffebee;
    border-color: #f44336;
}

#quiz-results {
    margin-top: 2rem;
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    font-size: 1.1rem;
}

/* Footer */
footer {
    text-align: center;
    padding: 2rem;
    color: #666;
    border-top: 1px solid #ddd;
    margin-top: 3rem;
}

footer a {
    color: #d32f2f;
    text-decoration: none;
}

footer a:hover {
    text-decoration: underline;
}

/* Responsive design */
@media (max-width: 768px) {
    .articles-grid {
        grid-template-columns: 1fr;
    }
    
    .explanations-grid {
        grid-template-columns: 1fr;
    }
    
    header h1 {
        font-size: 2rem;
    }
    
    .stats {
        flex-direction: column;
        gap: 0.5rem;
    }
}`;

    await fs.writeFile(path.join(this.outputDir, 'css', 'style.css'), css);
  }

  /**
   * Generates the JavaScript for quiz functionality
   */
  private async generateJavaScript(): Promise<void> {
    const js = `
function checkAnswers() {
    const questions = document.querySelectorAll('.quiz-question');
    let correct = 0;
    let total = questions.length;
    
    questions.forEach((question, index) => {
        const selectedAnswer = question.querySelector('input[name="q' + index + '"]:checked');
        const feedback = question.querySelector('.answer-feedback');
        const correctAnswer = quizData[index].correctAnswer;
        
        if (selectedAnswer) {
            const isCorrect = parseInt(selectedAnswer.value) === correctAnswer;
            
            if (isCorrect) {
                correct++;
                feedback.classList.remove('incorrect');
                question.style.borderColor = '#4caf50';
            } else {
                feedback.classList.add('incorrect');
                question.style.borderColor = '#f44336';
            }
            
            feedback.style.display = 'block';
        } else {
            question.style.borderColor = '#ff9800';
        }
    });
    
    const resultsDiv = document.getElementById('quiz-results');
    const percentage = Math.round((correct / total) * 100);
    
    let resultClass = 'good';
    let resultMessage = '🎉 Excellent work!';
    
    if (percentage < 60) {
        resultClass = 'poor';
        resultMessage = '📚 Keep studying!';
    } else if (percentage < 80) {
        resultClass = 'okay';
        resultMessage = '👍 Good job!';
    }
    
    resultsDiv.innerHTML = \`
        <div class="result-\${resultClass}">
            <h3>\${resultMessage}</h3>
            <p>You got \${correct} out of \${total} questions correct (\${percentage}%)</p>
        </div>
    \`;
    
    resultsDiv.style.display = 'block';
    
    // Disable the check button
    document.querySelector('.check-button').disabled = true;
    document.querySelector('.check-button').textContent = 'Quiz Completed';
}

// Add some basic styling for results
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = \`
        .result-excellent, .result-good {
            background: #e8f5e8;
            color: #2e7d32;
            border: 2px solid #4caf50;
        }
        
        .result-okay {
            background: #fff3e0;
            color: #ef6c00;
            border: 2px solid #ff9800;
        }
        
        .result-poor {
            background: #ffebee;
            color: #c62828;
            border: 2px solid #f44336;
        }
    \`;
    document.head.appendChild(style);
});`;

    await fs.writeFile(path.join(this.outputDir, 'js', 'quiz.js'), js);
  }

  /**
   * Creates a URL-friendly slug from a title
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
