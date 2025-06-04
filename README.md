# DW German Learning Application 🇩🇪

An automated German learning application that fetches content from Deutsche Welle's "Langsam gesprochene Nachrichten" (Slowly spoken news), uses AI to explain difficult words, generates interactive quizzes, and produces a beautiful static website for learning.

## Features ✨

- **Daily Content Updates**: Automatically fetches the latest German news articles
- **AI-Powered Explanations**: Uses GitHub Models to explain difficult German words with definitions, examples, and difficulty levels
- **Interactive Quizzes**: Generates comprehension and vocabulary quizzes for each article
- **Audio Integration**: Includes audio files for listening practice
- **Static Website**: Generates a beautiful, responsive website that works offline
- **GitHub Actions Automation**: Runs daily to keep content fresh

## Setup 🚀

### Prerequisites

- Node.js 18+ 
- npm
- GitHub token with access to GitHub Models

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd dwlearn
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```bash
GITHUB_TOKEN=your_github_token_here
GITHUB_MODEL_ENDPOINT=https://models.inference.ai.azure.com
```

### Getting a GitHub Token

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with appropriate permissions for GitHub Models
3. Add the token to your `.env` file

## Usage 📖

### Development Mode

Run the application in development mode:
```bash
npm run dev
```

### Production Build

Build and run the application:
```bash
npm run generate
```

This will:
1. Fetch the latest 5 articles from DW
2. Process each article with AI to explain difficult words
3. Generate interactive quizzes
4. Create a static website in the `./public` directory

### Manual Execution

You can also run individual steps:
```bash
# Build TypeScript
npm run build

# Run the built application
npm start
```

## Project Structure 📁

```
dwlearn/
├── src/
│   ├── index.ts              # Main application entry point
│   ├── dwService.ts          # Deutsche Welle content fetching
│   ├── aiService.ts          # GitHub Models AI integration
│   ├── websiteGenerator.ts   # Static website generation
│   └── types.ts              # TypeScript type definitions
├── public/                   # Generated static website
├── data/                     # Saved processed data
├── .github/
│   ├── workflows/
│   │   └── daily-update.yml  # GitHub Actions workflow
│   └── copilot-instructions.md
└── package.json
```

## Automation 🤖

The application includes a GitHub Actions workflow that:

1. Runs daily at 8:00 AM UTC
2. Fetches new content from Deutsche Welle
3. Processes articles with AI
4. Generates a fresh website
5. Deploys to GitHub Pages
6. Commits processed data to the repository

### Setting up GitHub Actions

1. Enable GitHub Pages in your repository settings
2. Ensure your GitHub token has the necessary permissions
3. The workflow will run automatically according to the schedule

### Manual Trigger

You can manually trigger the workflow from the GitHub Actions tab in your repository.

## Technical Details 🔧

### Technologies Used

- **TypeScript**: For type-safe development
- **Cheerio**: For web scraping and HTML parsing
- **Axios**: For HTTP requests
- **GitHub Models API**: For AI-powered content analysis
- **GitHub Actions**: For automation
- **GitHub Pages**: For hosting the static website

### AI Processing

The application uses GitHub Models (GPT-4) to:

- Identify difficult German words for intermediate learners
- Provide English definitions and explanations
- Generate example sentences in German
- Create multiple-choice quiz questions
- Test reading comprehension and vocabulary

### Website Features

The generated website includes:

- **Responsive design** that works on all devices
- **Audio playback** for listening practice
- **Interactive quizzes** with immediate feedback
- **Word explanations** with difficulty levels
- **Clean, modern interface** optimized for learning

## API Rate Limits ⚠️

The application includes built-in delays between API calls to respect rate limits. Processing 5 articles typically takes 2-3 minutes.

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License 📄

ISC License - see package.json for details

## Support 💬

For issues and questions, please use the GitHub Issues tab.

---

**Happy German Learning! 🎓**
