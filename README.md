# Fermenter Temperature Dashboard

A real-time dashboard that displays fermenter temperature and gravity readings from your RAPT device.

## Features

- 🌡️ Real-time temperature monitoring
- 📊 Gravity tracking
- ⏰ Last updated timestamp
- 🔄 Auto-refreshes every 30 seconds (client-side)
- 📱 Responsive mobile-friendly design
- 🚀 Deployed via GitHub Pages

## File Structure

```
fermenter-dashboard/
├── index.html                 # Dashboard HTML/CSS/JS
├── data.json                  # Data file (auto-updated by workflow)
├── .github/
│   └── workflows/
│       └── fetch-data.yml     # GitHub Actions workflow
└── README.md
```

## Setup Instructions

### 1. Create GitHub Repository

Push this project to GitHub:

```bash
cd fermenter-dashboard
git remote add origin https://github.com/pjcoxy/fermenter-dashboard.git
git branch -M main
git push -u origin main
```

### 2. Add GitHub Secrets

Your RAPT API credentials must be stored as GitHub Secrets (not in the code).

1. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
2. Create two new secrets:
   - **RAPT_USERNAME**: `pjcoxy@gmail.com`
   - **RAPT_API_SECRET**: `P63wxmLlERm8`

3. ⚠️ **After setup, regenerate your RAPT API key** since it was exposed

### 3. Enable GitHub Pages

1. Go to repo → **Settings** → **Pages**
2. Set **Source** to: `Deploy from a branch`
3. Set **Branch** to: `main` / `/ (root)`
4. Click **Save**

Your dashboard will be available at: `https://pjcoxy.github.io/fermenter-dashboard/`

### 4. Verify GitHub Actions Workflow

1. Go to **Actions** tab
2. You should see "Fetch RAPT Data" workflow
3. Click **Run workflow** to test it manually
4. The workflow runs automatically every 15 minutes

## API Integration Notes

The workflow calls the RAPT API endpoint. You may need to adjust:

- API endpoint URL (currently: `https://api.tryrapt.com/api/v1/telemetry`)
- Response field mappings (currently assumes `.temperature` and `.gravity` fields)
- Authentication headers

Check your RAPT API documentation and update `.github/workflows/fetch-data.yml` accordingly.

## Dashboard Updates

- **Client-side refresh**: Every 30 seconds (reads data.json)
- **Server-side update**: Every 15 minutes (via GitHub Actions)
- **Manual refresh**: Use "Run workflow" in Actions tab

## Troubleshooting

**Dashboard shows "--" for all values:**
- Check that `data.json` exists and has valid JSON
- Open browser DevTools → Console for errors
- Verify the API response structure matches your RAPT API

**Workflow fails:**
- Check GitHub Actions logs for API errors
- Verify secrets are set correctly
- Check API endpoint and authentication

**Pages not updating:**
- Verify GitHub Pages is enabled
- Check that workflow committed changes to `data.json`
- Force refresh browser (Ctrl+Shift+R)

## License

MIT
