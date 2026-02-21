# SmartResult — Academic Performance Dashboard

This repository contains a Node.js + Express backend and a React (Vite) frontend to parse HTML result pages and render an interactive student performance dashboard.

Summary

- Backend: Express, Puppeteer, Cheerio, optional MongoDB (Mongoose)
- Frontend: React + Vite, Tailwind CSS, Chart.js

Quick start (development)

1. Backend

```powershell
cd D:\smartresult
npm install
# optional: install rate limit middleware
npm install express-rate-limit
# (optional) set MONGODB_URI in .env to enable DB persistence
npm run dev    # starts server on http://localhost:3000
```

2. Frontend

```powershell
cd D:\smartresult\client
npm install
npm run dev    # starts Vite on http://localhost:5173
```

APIs

- `POST /api/fetch` — body: `{ "pin": "REG123" }` (uses scraper)
- `POST /api/parse` — body: `{ "html": "<html>...</html>" }` (parses raw HTML)

Publishing to GitHub

Use one of the two methods below to create a remote and push.

1. Using GitHub CLI (`gh`) — easiest if authenticated:

```powershell
cd D:\smartresult
git init
git add .
git commit -m "Initial commit: SmartResult dashboard"
gh repo create my-username/smartresult --public --source=. --remote=origin --push
```

2. Manual (create repo on github.com then push):

```powershell
cd D:\smartresult
git init
git add .
git commit -m "Initial commit: SmartResult dashboard"
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

Notes

- If Puppeteer has issues in your environment, launch with `--no-sandbox` flags in `services/scraperService.js`.
- To serve the built frontend from Express, build the client and copy `client/dist` into `public` or update Express static path.

If you want, I can create the GitHub repo for you now — provide either `gh` CLI access on this machine or a GitHub Personal Access Token and the desired repo name.
