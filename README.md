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
   - **RAPT_USERNAME**: Your RAPT account email
   - **RAPT_API_SECRET**: Your RAPT API key

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
4. For automatic scheduled runs, use an external cron service (see below)

### 5. Set Up External Cron Service (Required for Automation)

GitHub's built-in scheduler is unreliable. Use **cron-job.org** (free) to trigger the workflow:

1. Go to [cron-job.org](https://cron-job.org)
2. Sign up (free account)
3. Create a new cronjob with these settings:
   - **Title**: `Fermenter Dashboard Update`
   - **URL**: `https://api.github.com/repos/Pjcoxy/fermenter-dashboard/actions/workflows/fetch-data.yml/dispatches`
   - **Request Method**: `POST`
   - **Cron Expression**: `0 */15 * * * *` (every 15 minutes)
   - **HTTP Auth**:
     - Username: `x-access-token`
     - Password: [Your GitHub Personal Access Token](https://github.com/settings/tokens)
   - **Request Body**: `{"ref":"main"}`
   - **Headers**: `Content-Type: application/json`
4. Click **Save** and enable the cronjob

Done! The workflow will now run every 15 minutes.

## API Integration Notes

The workflow calls the RAPT API endpoint. You may need to adjust:

- API endpoint URL (currently: `https://api.tryrapt.com/api/v1/telemetry`)
- Response field mappings (currently assumes `.temperature` and `.gravity` fields)
- Authentication headers

Check your RAPT API documentation and update `.github/workflows/fetch-data.yml` accordingly.

## Dashboard Updates

- **Client-side refresh**: Every 30 seconds (reads data.json)
- **Server-side update**: On schedule (via GitHub Actions, configurable in workflow)
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
