# 🌍 How to Deploy to GitHub Pages

Since this project uses **Node.js** and **Puppeteer** (backend technologies), it cannot run entirely on GitHub Pages. You must use a **Split Deployment** strategy.

## Architecture

1. **Backend (Server)**: Hosted on **Render** (Free). Runs Node.js, MongoDB, and Scraper.
2. **Frontend (UI)**: Hosted on **GitHub Pages** (Free). Serves HTML/CSS/JS.

---

## Step 1: Deploy Backend to Render

1. Push your code to GitHub.
2. Go to dashboard.render.com and create a **New Web Service**.
3. Connect your GitHub repository.
4. Use the following settings:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables (same as your `.env`):
   - `MONGODB_URI`: Your MongoDB connection string (e.g., from MongoDB Atlas).
   - `JWT_SECRET`: Any random secret key.
   - `NODE_ENV`: `production`
6. Click **Deploy**.
7. Once deployed, copy your backend URL (e.g., `https://smartresult-api.onrender.com`).

---

## Step 2: Configure Frontend

1. Open `public/app.js` in your local code.
2. Find the `API_BASE_URL` constant at the top.
3. Paste your Render Backend URL there:
   ```javascript
   const API_BASE_URL = "https://smartresult-api.onrender.com";
   ```
4. Commit and push this change to GitHub.

---

## Step 3: Enable GitHub Pages

1. Go to your GitHub Repository **Settings**.
2. Click on **Pages** in the left sidebar.
3. Under **Build and deployment**:
   - **Source**: Deploy from a branch.
   - **Branch**: `main` (or master).
   - **Folder**: `/public` (Select this folder specifically).
4. Click **Save**.

_Note: If GitHub doesn't let you select `/public` as the source folder, you may need to move your `index.html` and other assets to the root directory or use a GitHub Action to deploy._

## Step 4: Done!

Visit the link provided by GitHub Pages. Your frontend is now hosted on GitHub, communicating with your backend on Render.
