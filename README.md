# AP Live Receipt Reimbursement

AI-powered expense receipt processor for AP Live contractors.

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Import in Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Framework Preset: **Other** (no build step needed)
4. Root Directory: `.` (default)

### 3. Add Environment Variable
In the Vercel project dashboard:
- Settings → Environment Variables
- Add: `ANTHROPIC_API_KEY` = your Anthropic secret key
- Apply to: Production, Preview, Development

### 4. Deploy
Click Deploy. Vercel auto-deploys on every push to main.

## Local Development

```bash
npm i -g vercel      # install Vercel CLI once
cp .env.local.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY
vercel dev           # starts local server at http://localhost:3000
```

`vercel dev` runs the serverless function locally with your `.env.local` key —
no API key ever touches the HTML source.

## Architecture

```
Browser → /api/vision (Vercel function) → Anthropic API
```

- `index.html` — the full single-page app (no API key)
- `api/vision.js` — serverless proxy (adds API key from env var)
- `vercel.json` — routing config
