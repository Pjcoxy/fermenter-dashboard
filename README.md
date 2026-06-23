# Fermenter Temperature Dashboard

A real-time dashboard that displays fermenter temperature and gravity readings from your RAPT device.

## Features

- 🌡️ Real-time temperature monitoring
- 📊 Gravity tracking
- ⏰ Last updated timestamp
- 🔄 Auto-refreshes every 30 seconds (client-side)
- 📱 Responsive mobile-friendly design
- 🚀 Deployed via GitHub Pages
- 🔐 Google One Tap Sign-In authentication
- 📧 Email-based access control (whitelist authorized users)
- 📈 Historical trend charts (temperature & gravity)
- 🎯 Compact single-screen layout

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

### 3. Set Up Google One Tap Authentication

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: `Fermenter Dashboard`
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized origins: `https://yourusername.github.io`
7. Copy your **Client ID** (looks like: `123456789-abc...apps.googleusercontent.com`)
8. Open `index.html` and find line with `data-client_id="YOUR_CLIENT_ID_HERE"`
9. Replace with your actual Client ID
10. In Google Cloud Console, go to **Settings** → **OAuth consent screen**
11. Add authorized domain: `yourusername.github.io`
12. To restrict access to specific emails, edit `index.html` and update the `ALLOWED_EMAILS` array

### 4. Enable GitHub Pages

1. Go to repo → **Settings** → **Pages**
2. Set **Source** to: `Deploy from a branch`
3. Set **Branch** to: `main` / `/ (root)`
4. Click **Save**

Your dashboard will be available at: `https://yourusername.github.io/fermenter-dashboard/`

### 4. Verify GitHub Actions Workflow

1. Go to **Actions** tab
2. You should see "Fetch RAPT Data" workflow
3. Click **Run workflow** to test it manually
4. For automatic scheduled runs, use an external cron service (see below)

### 6. Set Up Google Apps Script for Reliable Automation

GitHub's built-in cron scheduler is unreliable. We use **Google Apps Script** for reliable 15-minute triggers.

**If already set up** (project: "Fermenter pill automation"):
- Script runs every 15 minutes via time-driven trigger
- POSTs to GitHub Actions workflow dispatch endpoint
- Status: Check error rate in [Google Apps Script Triggers](https://script.google.com/home/projects/1_0qas8CtkeHlyTpcNmgfhEtWGnO8g2XTldoSfZB9pyLUB7J-uEtvhAJ/triggers)

**If setting up new:**
1. Go to [Google Apps Script](https://script.google.com)
2. Create new project: `Fermenter Dashboard Trigger`
3. Replace code with:
```javascript
function triggerFermenterWorkflow() {
  const GITHUB_REPO = 'Pjcoxy/fermenter-dashboard';
  const GITHUB_TOKEN = 'your_github_pat_here'; // GitHub Personal Access Token
  
  const url = `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/fetch-data.yml/dispatches`;
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    },
    payload: JSON.stringify({ ref: 'main' }),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  Logger.log('Workflow triggered: ' + response.getResponseCode());
}
```
4. Get [GitHub Personal Access Token](https://github.com/settings/tokens) (scope: `workflow`)
5. Replace `your_github_pat_here` with your token
6. Save and test: **Run** button
7. Set up trigger: **Triggers** → **+ Add Trigger** → Time-driven, Minutes timer, Every 15 minutes

## API Integration Notes

The workflow calls the RAPT API endpoint. You may need to adjust:

- API endpoint URL (currently: `https://api.tryrapt.com/api/v1/telemetry`)
- Response field mappings (currently assumes `.temperature` and `.gravity` fields)
- Authentication headers

Check your RAPT API documentation and update `.github/workflows/fetch-data.yml` accordingly.

## Authentication & Access Control

### Email Whitelist
By default, only `pjcoxy@gmail.com` can access the dashboard. To add or change authorized emails:

1. Open `index.html`
2. Find the line: `const ALLOWED_EMAILS = ['pjcoxy@gmail.com'];`
3. Add more emails: `const ALLOWED_EMAILS = ['pjcoxy@gmail.com', 'other@gmail.com'];`
4. Commit and push changes

### How It Works
- Uses Google One Tap Sign-In (frictionless authentication)
- Validates user's email against the whitelist
- Stores auth token in browser localStorage
- Token expires and user must sign in again after browser restart (sessionStorage behavior can be configured)

## Dashboard Updates

- **Client-side refresh**: Every 30 seconds (reads data.json)
- **Server-side update**: Every 15 minutes (via GitHub Actions workflow)
- **Manual refresh**: Use "Run workflow" in Actions tab
- **Historical data**: Charts display last ~20 data points

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
