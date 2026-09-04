# Deployment Guide — Free Tier

## Backend: Render (Free)

### 1. Create Render Account
Go to https://render.com and sign up (free).

### 2. Deploy Backend
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo (push this project to GitHub first)
3. Settings:
   - **Name**: `ledger-ai-server`
   - **Region**: Oregon (US West)
   - **Runtime**: Node
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node src/index.js`
   - **Plan**: Free
4. Click **"Advanced"** → Add env variable:
   - **Key**: `GROQ_API_KEY`
   - **Value**: `your_groq_api_key_here`
5. Click **"Create Web Service"**

### 3. Note Your Backend URL
Render gives you a URL like:
```
https://ledger-ai-server.onrender.com
```

Test it: open `https://ledger-ai-server.onrender.com/health` in browser.

**Note**: First visit takes ~30 seconds (cold start). After that it's fast until 15 min of inactivity.

---

## Frontend: Vercel (Free)

### 1. Create Vercel Account
Go to https://vercel.com and sign up (free).

### 2. Deploy Frontend
1. Click **"Add New Project"**
2. Import your GitHub repo
3. Framework: **Vite**
4. Root Directory: **client**
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Click **"Environment Variables"** and add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://ledger-ai-server.onrender.com`
8. Click **"Deploy"**

### 3. Done
Vercel gives you a URL like:
```
https://ledger-ai.vercel.app
```

---

## Summary

| Service | Provider | Cost | URL |
|---------|----------|------|-----|
| Backend | Render Free | $0 | `https://ledger-ai-server.onrender.com` |
| Frontend | Vercel Free | $0 | `https://ledger-ai.vercel.app` |

**Total: $0/month**

### Limitations
- Render: Server sleeps after 15 min inactivity (~30s cold start on first visit)
- Vercel: 100GB bandwidth/month
- SQLite: Data resets on Render restart (ephemeral disk)
