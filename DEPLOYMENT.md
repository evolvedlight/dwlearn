# Deployment Instructions

## Setting up the Complete Application

### 1. GitHub Repository Setup

1. **Create a new GitHub repository** for your DW German Learning app
2. **Clone this code** to your repository
3. **Enable GitHub Pages** in repository settings:
   - Go to Settings → Pages
   - Source: GitHub Actions

### 2. Environment Configuration

1. **Create a GitHub Personal Access Token:**
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token"
   - Select scopes: `public_repo` (and model access if available)
   - Copy the token

2. **Add Repository Secrets:**
   - In your repository, go to Settings → Secrets and variables → Actions
   - Add a new secret named `GITHUB_TOKEN` with your personal access token

### 3. Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your GitHub token.

3. **Test the basic functionality:**
   ```bash
   npm test
   ```

4. **Run the full application:**
   ```bash
   npm run generate
   ```

### 4. GitHub Actions Automation

The included workflow (`.github/workflows/daily-update.yml`) will:

- **Run automatically** every day at 8:00 AM UTC
- **Fetch new articles** from Deutsche Welle
- **Process content** with AI explanations and quizzes
- **Generate website** and deploy to GitHub Pages
- **Commit processed data** back to the repository

### 5. Manual Triggering

You can manually trigger the workflow:

1. Go to your repository on GitHub
2. Click the "Actions" tab
3. Select "Daily DW German Learning Update"
4. Click "Run workflow"

### 6. Accessing Your Learning Website

Once the workflow runs successfully:

- Your website will be available at: `https://[username].github.io/[repository-name]/`
- The workflow will show you the deployed URL in the Actions log

### 7. Customization Options

#### Adjust Article Count
In `src/index.ts`, change the number in:
```typescript
const articles = await this.dwService.fetchLatestArticles(5); // Change 5 to desired number
```

#### Modify Schedule
In `.github/workflows/daily-update.yml`, change the cron schedule:
```yaml
schedule:
  - cron: '0 8 * * *'  # Change to your preferred time
```

#### Customize Appearance
Modify the CSS in `src/websiteGenerator.ts` in the `generateStylesheet()` method.

### 8. Monitoring

- **Check GitHub Actions** for workflow status
- **Monitor repository commits** for daily data updates
- **Review generated content** in the `data/` directory

### 9. Troubleshooting

#### Common Issues:

1. **"GitHub token not found"**
   - Ensure `GITHUB_TOKEN` is set in repository secrets
   - Verify token has correct permissions

2. **"Failed to fetch DW articles"**
   - Check internet connection
   - Verify DW RSS feed is accessible

3. **"AI service error"**
   - Confirm GitHub Models access
   - Check token permissions
   - Verify API endpoint

4. **Pages deployment fails**
   - Ensure GitHub Pages is enabled
   - Check workflow permissions

#### Debug Steps:

1. **Run locally first:**
   ```bash
   npm run test
   ```

2. **Check logs in GitHub Actions** for detailed error messages

3. **Verify generated content** in `public/` directory

### 10. Success Indicators

When everything is working correctly:

- ✅ Daily commits appear in your repository
- ✅ Website updates with new content
- ✅ Generated articles include word explanations
- ✅ Interactive quizzes work properly
- ✅ Audio files are linked correctly

---

**Your German learning website should now be fully automated and running!** 🎉
