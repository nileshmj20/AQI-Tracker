# AQI Tracker Free Deployment Guide

## Best free option for this project
Use **Render Web Service**. This project has a Python/FastAPI backend and a static frontend, and the backend already serves the frontend from `/`, so one Render service is enough.

## 1. Prepare GitHub
1. Extract this ZIP.
2. Open the `AQI-Tracker` folder in VS Code.
3. Create a new GitHub repository, for example: `aqi-tracker`.
4. Upload/push the complete `AQI-Tracker` folder contents.

Useful commands:

```bash
git init
git add .
git commit -m "Deploy-ready AQI Tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/aqi-tracker.git
git push -u origin main
```

## 2. Deploy on Render
1. Go to Render.
2. Choose **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Use these settings if Render does not read `render.yaml` automatically:

| Setting | Value |
|---|---|
| Runtime | Python |
| Build Command | `pip install --upgrade pip && pip install -r requirements.txt` |
| Start Command | `bash start.sh` |
| Instance Type | Free |
| Health Check Path | `/api/health` |

## 3. Add environment variables on Render
Add these in Render → Service → Environment:

```env
WAQI_API_TOKEN=your_waqi_token_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
NOMINATIM_USER_AGENT=AQI-Tracker/2.2 (your-email@example.com)
AQI_TRACKER_ENV=production
AQI_TRACKER_VERBOSE=0
```

`WAQI_API_TOKEN` is the important one for live AQI. `GEMINI_API_KEY` is optional for AI insights if your app uses that section.

## 4. Test after deployment
Open your Render URL:

```text
https://your-service-name.onrender.com
```

Then test:

```text
https://your-service-name.onrender.com/api/health
```

If `/api/health` works, the frontend and backend should work from the same Render URL.

## Notes
- Do not upload a real `.env` file to GitHub.
- Keep `.env.example` only.
- Render free services may sleep after inactivity, so the first load can be slow.
