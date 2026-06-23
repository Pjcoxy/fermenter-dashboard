# RAPT Fermenter Dashboard - Configuration Guide

This document lists all configurable elements and where to change them.

## Pill Configuration

### Current Pills
- **Reddy Pill:** `b593f1b8-8c3d-4f5e-a798-6e7a3569a85b` (name: "reddymc redface")
- **Yellow Pill:** `176cc4c3-9e13-4106-b1c0-7455b4f9ca7c` (name: "yellow mc yellow face")

### Where Pill IDs Are Used

#### 1. `.github/workflows/fetch-data.yml` (Lines 54-55)
```python
reddy_pill = next((p for p in pills_data if p['id'] == 'b593f1b8-8c3d-4f5e-a798-6e7a3569a85b'), None)
yellow_pill = next((p for p in pills_data if p['id'] == '176cc4c3-9e13-4106-b1c0-7455b4f9ca7c'), None)
```
**Purpose:** Filters RAPT API response to extract these two pills
**How to change:** Replace UUID strings with new pill IDs (from RAPT app)

#### 2. `index.html` (Multiple locations)
- **Reddy metrics display:** Lines ~625-637 (template with IDs: `temp-reddy`, `gravity-reddy`, `battery-reddy`)
- **Yellow metrics display:** Lines ~645-657 (template with IDs: `temp-yellow`, `gravity-yellow`, `battery-yellow`)
- **Chart canvases:** Lines ~663-680 (canvas IDs for temperature/gravity trends)

**Purpose:** Display metrics and charts for each pill
**How to change:** If adding/removing pills, add corresponding HTML sections and canvas elements

### How to Add a New Pill

1. Get pill UUID from RAPT app
2. Update `.github/workflows/fetch-data.yml`:
   - Add new pill extraction (Python, after yellow_pill)
   - Add to `data` JSON array (new object)
3. Update `index.html`:
   - Add metrics boxes in pill-content
   - Add chart canvases for trends
   - Add tab button (if using tabs)
4. Update JavaScript in `index.html`:
   - Add to chartData object
   - Update updateDisplay() function
   - Add chart initialization

## Authentication & Authorization

### Allowed Email List

**Location:** `index.html`, line ~717
```javascript
const ALLOWED_EMAILS = ['pjcoxy@gmail.com'];
```

**Purpose:** Whitelist of emails that can access the dashboard

**How to change:**
```javascript
const ALLOWED_EMAILS = [
  'pjcoxy@gmail.com',
  'other.user@gmail.com',
  'third.user@gmail.com'
];
```

### Google OAuth Client ID

**Location:** `index.html`, line ~587
```html
data-client_id="385648361894-4rp1i1nb29ns11j6vla4dkh7aj67c4fa.apps.googleusercontent.com"
```

**Purpose:** Identifies the app to Google's authentication service

**How to change:** 
- Create new OAuth 2.0 Client ID in [Google Cloud Console](https://console.cloud.google.com)
- Replace entire Client ID string
- Update authorized domains in OAuth consent screen

## Data Update Frequency

### Browser Refresh Rate

**Location:** `index.html`, line ~875 (inside updateDashboard function)
```javascript
setInterval(updateDisplay, 30000); // 30 seconds
```

**Purpose:** How often the browser fetches fresh data.json

**How to change:** Replace `30000` with milliseconds
- 10 seconds = `10000`
- 1 minute = `60000`
- 2 minutes = `120000`

### Server Update Frequency (GitHub Actions)

**Location:** `.github/workflows/fetch-data.yml`, line ~6
```yaml
cron: '*/15 * * * *'  # Every 15 minutes
```

**Purpose:** How often GitHub Actions fetches from RAPT API

**How to change:** Modify cron expression
- Every 10 minutes: `*/10 * * * *`
- Every 30 minutes: `*/30 * * * *`
- Every hour: `0 * * * *`
- Every 6 hours: `0 */6 * * * *`

**Note:** Google Apps Script trigger must match (currently 15 minutes)

### Google Apps Script Trigger

**Location:** [Google Apps Script Triggers](https://script.google.com/home/projects/1_0qas8CtkeHlyTpcNmgfhEtWGnO8g2XTldoSfZB9pyLUB7J-uEtvhAJ/triggers)

**Purpose:** Triggers GitHub Actions workflow every 15 minutes

**How to change:**
1. Click the trigger name: "Fermenter pill timer"
2. Change "Every 15 minutes" to desired interval
3. Click Save

## Chart Configuration

### Data Points Displayed

**Location:** `index.html`, line ~897 (inside updateDisplay function)
```javascript
const maxDataPoints = 50;
```

**Purpose:** Number of historical data points to show in charts

**How to change:** Replace `50` with desired number
- More points = more history, slower charts
- Fewer points = less history, faster rendering

### Chart Colors

**Location:** `index.html`, Chart.js initialization sections (~663-680)
```javascript
new Chart(ctx, {
  data: {
    datasets: [{
      label: 'Temperature Trend',
      borderColor: '#ff6b6b',  // Red line
      // ...
    }]
  }
});
```

**Purpose:** Colors for trend line charts

**How to change:** Replace hex color codes
- Red pill lines: `#ff6b6b`
- Yellow pill lines: `#ffd93d`
- Standard colors: `#6b7fff` (blue), `#00d084` (green)

## Display Configuration

### Timezone

**Location:** `index.html`, line ~903 (inside updateDisplay function)
```javascript
const formatter = new Intl.DateTimeFormat('en-AU', {
  timeZone: 'Australia/Perth',
  // ...
});
```

**Purpose:** Converts UTC timestamps to Perth time for display

**How to change:** Replace timezone string
- New York: `'America/New_York'`
- London: `'Europe/London'`
- Sydney: `'Australia/Sydney'`
- UTC: `'UTC'`

### Metric Units & Decimal Places

**Location:** `index.html`, template display sections
```html
<div class="metric-unit">°C</div>  <!-- Temperature unit -->
<div class="metric-unit">SG</div>  <!-- Gravity unit -->
<div class="metric-unit">%</div>   <!-- Battery unit -->
```

**Purpose:** Labels shown under metric values

**How to change:** Edit the text in `.metric-unit` elements (no code change needed)

### Compact Layout Spacing

**Location:** `index.html`, CSS sections (lines ~10-280)

Key spacing variables:
- Body padding: Line ~23 (`padding: 10px`)
- Header margin: Line ~120 (`margin-bottom: 8px`)
- Logo height: Line ~143 (`height: 45px`)
- Title font size: Line ~166 (`font-size: 26px`)
- Metric value font: Line ~423 (`font-size: 24px`)
- Chart height: Line ~209 (`height: 130px`)

**How to change:** Adjust pixel values (e.g., `10px` → `15px`)

## API Configuration

### RAPT API Endpoint

**Location:** `.github/workflows/fetch-data.yml`, line ~36
```bash
curl -s -X GET "https://api.rapt.io/api/Hydrometers/GetHydrometers" \
```

**Purpose:** Endpoint to fetch pill data

**How to change:** If RAPT API URL changes, update this line (unlikely)

### RAPT OAuth Token Endpoint

**Location:** `.github/workflows/fetch-data.yml`, line ~23
```bash
curl -s -X POST "https://id.rapt.io/connect/token" \
```

**Purpose:** Endpoint to get OAuth2 access token

**How to change:** If RAPT auth URL changes, update this line (unlikely)

### GitHub Actions Dispatch Endpoint

**Location:** Google Apps Script (not in repo)
```
https://api.github.com/repos/Pjcoxy/fermenter-dashboard/actions/workflows/fetch-data.yml/dispatches
```

**Purpose:** Endpoint that Google Apps Script POSTs to trigger workflow

**How to change:** If repo is renamed or moved, update GitHub Apps Script

## Credentials & Secrets

### GitHub Secrets

**Location:** GitHub repo → Settings → Secrets and variables → Actions

| Secret | Purpose | How to update |
|--------|---------|--------------|
| `RAPT_USERNAME` | RAPT account email | Update in GitHub Secrets UI |
| `RAPT_API_SECRET` | RAPT API key | Update in GitHub Secrets UI |

**How to rotate RAPT credentials:**
1. Go to RAPT account settings, generate new API key
2. Go to GitHub repo Settings → Secrets
3. Click `RAPT_API_SECRET` → Edit → Paste new key
4. Test: Actions → Fetch RAPT Data → Run workflow
5. Verify data.json updated successfully

### GitHub Personal Access Token (for Google Apps Script)

**Location:** Google Apps Script editor (not in GitHub repo)

**Purpose:** Allows Google Apps Script to trigger GitHub Actions

**How to update:**
1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Create new PAT with `workflow` scope
3. Copy token
4. Open [Google Apps Script project](https://script.google.com/home/projects/1_0qas8CtkeHlyTpcNmgfhEtWGnO8g2XTldoSfZB9pyLUB7J-uEtvhAJ/editor)
5. Find line with `const GITHUB_TOKEN = '...'`
6. Paste new token
7. Save and test: Run → triggerFermenterWorkflow()

### Google OAuth Client ID

**Location:** [Google Cloud Console](https://console.cloud.google.com) - Credentials

**Purpose:** Identifies app for Google One Tap sign-in

**How to rotate:**
1. Create new OAuth 2.0 Client ID (Web application)
2. Add authorized domains & redirects
3. Copy new Client ID
4. Update `index.html` line ~587
5. Commit and push
6. Delete old Client ID from Google Cloud

## Data Storage Configuration

### data.json Structure

**Current schema:**
```json
{
  "pills": [
    {
      "name": "string",
      "id": "uuid",
      "temperature": "float",
      "gravity": "float",
      "battery": "float"
    }
  ],
  "lastUpdated": "ISO 8601 timestamp"
}
```

**How to extend:** Add new fields to pill objects or root level
- Avoid breaking changes (frontend expects specific fields)
- Always include `lastUpdated` for staleness detection
- Use ISO 8601 format for timestamps

### GitHub Pages Cache

**Location:** GitHub settings (automatic)

**Purpose:** Global CDN cache duration

**Current:** ~5 minutes (GitHub default)

**How to clear:**
- Purge is automatic after 5 minutes
- For immediate updates: Hard refresh browser (Ctrl+F5)

## Status Indicators

### Pill Status Logic

**Location:** `index.html`, updateDisplay function (lines ~920-935)

```javascript
const minutesSinceUpdate = (Date.now() - dataTime) / 1000 / 60;
if (minutesSinceUpdate < 45) {
  status = 'ACTIVE';  // Green
} else if (minutesSinceUpdate < 60) {
  status = 'STALE';   // Yellow
} else {
  status = 'INACTIVE'; // Red
}
```

**Thresholds:**
- Active: < 45 minutes old
- Stale: 45-60 minutes old
- Inactive: > 60 minutes old

**How to change:** Adjust minute values (e.g., `45` → `30`)

## Feature Flags (None Currently)

The dashboard has no feature flags. All features are always enabled.

## Backup & Recovery

### Regular Backups
- GitHub automatically maintains full history
- data.json revisions: View on GitHub → Click "History"
- Workflow changes: View in `.github/workflows/` history

### Manual Backup
```bash
git clone https://github.com/Pjcoxy/fermenter-dashboard.git backup-$(date +%s)
```

### Recovery
```bash
git log --oneline data.json  # View history
git show <commit>:data.json  # View specific version
git revert <commit>          # Revert bad commit
```
