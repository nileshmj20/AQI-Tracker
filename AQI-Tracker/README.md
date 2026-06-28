# AQI Tracker

Optimised AQI dashboard with a realistic globe, solar system explorer, weather intelligence, disaster watch, radio and reporting tools.

## Run locally

```bash
python main.py
```

Open `http://127.0.0.1:8000`.

## API keys

A real `.env` file is intentionally not included in this ZIP. Copy `.env.example` to `.env` and add your own keys:

```bash
copy .env.example .env
```

Required for full live functionality:

- `WAQI_API_TOKEN` for AQI data
- `GEMINI_API_KEY` for AI insights/reports

The project can still open without keys, but live/AI features may show fallback or warning messages.

## Mobile optimisation notes

The frontend has a mobile-first cleanup pass:

- bottom navigation on phones
- safer mobile viewport support
- lighter globe rendering on small screens
- improved solar system scaling on phones
- cleaned unused development/audit files
- service-worker cache version updated

## Separate frontend/backend deployment

The frontend uses same-origin API paths by default, such as `/api/snapshot`.

If you host the frontend separately from the backend, set a global value before loading `scripts/main.js`:

```html
<script>window.AQI_API_BASE_URL = "https://your-backend.example.com";</script>
```

On the backend, set `AQI_CORS_ORIGINS` to the deployed frontend origin list, for example:

```env
AQI_CORS_ORIGINS=https://your-frontend.example.com,http://localhost:5173
```

## Free deployment
This ZIP includes Render-ready files:

- `render.yaml`
- `start.sh`
- `Procfile`
- `runtime.txt`
- root `requirements.txt`
- `DEPLOYMENT_GUIDE.md`

Recommended free deployment: **Render Web Service**.

Build Command:

```bash
pip install --upgrade pip && pip install -r requirements.txt
```

Start Command:

```bash
bash start.sh
```

After deployment, open:

```text
https://your-service-name.onrender.com
```

Health check:

```text
https://your-service-name.onrender.com/api/health
```
