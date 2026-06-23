# RAPT Fermenter Dashboard - Development Guide

This guide explains the codebase and how to make changes.

## Code Structure Overview

```
index.html
├── HEAD
│   └── <style> CSS (lines 10-580)
│   └── <script> JavaScript (lines 712-950)
│
└── BODY
    ├── <div id="login-container"> Authentication UI
    └── <div id="dashboard-container"> Main dashboard
        ├── .auth-header (user info, sign out)
        ├── .header (logo, title)
        ├── .pills-grid (two pill cards)
        │   ├── pill-card (reddy)
        │   │   ├── .pill-header
        │   │   ├── .metrics-grid (3 metrics)
        │   │   └── .chart-container (2 charts)
        │   └── pill-card (yellow)
        │       └── [same structure]
        └── .footer-info (last updated, update frequency)
```

## File Breakdown by Section

### CSS (lines 10-580)

**Global styles:**
- Lines 11-26: Reset and body styling
- Lines 27-75: Authentication UI (login-container, login-box)

**Dashboard structure:**
- Lines 76-114: Auth header (user email, sign out button)
- Lines 115-135: Main header (logo, title, divider)
- Lines 136-190: Logo and title styling
- Lines 191-280: Pill cards, metrics, charts (mobile responsive)

**Key classes:**
- `.container` — Max width wrapper
- `.header` — Top section with logo/title
- `.pills-grid` — Two-column grid (collapses on mobile)
- `.pill-card` — Individual fermenter container
- `.metric-value` — Large number display
- `.chart-container` — Chart wrapper
- `.error` — Error message styling

**Responsive breakpoints:**
- Lines 226-280: Mobile adjustments (max-width: 768px, max-width: 480px)

### JavaScript (lines 712-950)

**Global variables:**
- Lines 713-718: allData, charts object, chartData for historical points
- Line 720: ALLOWED_EMAILS (email whitelist)

**Authentication functions:**
- Lines 721-751: `handleCredentialResponse()` — Decodes Google JWT, validates email, shows dashboard
- Lines 753-763: `showError()` — Displays access denied message
- Lines 765-770: `handleSignOut()` — Clears auth and reloads

**Data management:**
- Lines 772-920: `updateDisplay()` — Main function that:
  - Fetches data.json
  - Parses latest readings
  - Calculates pill status (ACTIVE/STALE/INACTIVE)
  - Updates all metric values
  - Updates all chart data
  - Updates "Last Updated" timestamp

**Chart initialization:**
- Lines 813-845: Chart.js setup for temperature/gravity trends
- Lines 862-920: Chart data population and rendering

**Utility functions:**
- Line 925: `setInterval(updateDisplay, 30000)` — Browser refresh loop (30 seconds)

## Making Common Changes

### Change 1: Add a New Pill

**Step 1:** Get pill UUID from RAPT app

**Step 2:** Update `.github/workflows/fetch-data.yml` (lines 54-55)

Old:
```python
reddy_pill = next((p for p in pills_data if p['id'] == 'b593f1b8-8c3d-4f5e-a798-6e7a3569a85b'), None)
yellow_pill = next((p for p in pills_data if p['id'] == '176cc4c3-9e13-4106-b1c0-7455b4f9ca7c'), None)
```

New (add blue pill):
```python
reddy_pill = next((p for p in pills_data if p['id'] == 'b593f1b8-8c3d-4f5e-a798-6e7a3569a85b'), None)
yellow_pill = next((p for p in pills_data if p['id'] == '176cc4c3-9e13-4106-b1c0-7455b4f9ca7c'), None)
blue_pill = next((p for p in pills_data if p['id'] == '<new-uuid>'), None)
```

**Step 3:** Add to data.json construction (lines 59-74)
```python
{
    "name": blue_pill['name'] if blue_pill else "blue pill name",
    "id": "<new-uuid>",
    "temperature": blue_pill['temperature'] if blue_pill else None,
    "gravity": blue_pill['gravity'] if blue_pill else None,
    "battery": blue_pill['battery'] if blue_pill else None
}
```

**Step 4:** Update `index.html` - Add metrics section (after yellow pill, around line 645)
```html
<div class="pill-card">
  <div class="pill-header">
    <div>
      <div class="brewer-name" style="color: #6b7fff;">
        <span class="status-dot" id="status-blue"></span>
        <span id="name-blue">--</span>
      </div>
    </div>
    <div class="status-badge" id="badge-blue">--</div>
  </div>
  <div class="pill-content">
    <div class="metrics-grid">
      <div class="metric-box">
        <div class="metric-label">Temperature</div>
        <div class="metric-value" id="temp-blue">--</div>
        <div class="metric-unit">°C</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Gravity</div>
        <div class="metric-value" id="gravity-blue">--</div>
        <div class="metric-unit">SG</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Battery</div>
        <div class="metric-value" id="battery-blue">--</div>
        <div class="metric-unit">%</div>
      </div>
    </div>
    <div class="charts-grid">
      <div class="chart-container">
        <div class="chart-title">Temperature Trend</div>
        <canvas id="chart-temp-blue" class="chart-canvas"></canvas>
      </div>
      <div class="chart-container">
        <div class="chart-title">Gravity Trend</div>
        <canvas id="chart-gravity-blue" class="chart-canvas"></canvas>
      </div>
    </div>
  </div>
</div>
```

**Step 5:** Update JavaScript - Add chartData (line 716)
```javascript
chartData = {
  reddy: { temps: [], gravities: [], times: [] },
  yellow: { temps: [], gravities: [], times: [] },
  blue: { temps: [], gravities: [], times: [] }  // Add this
};
```

**Step 6:** Update `updateDisplay()` - Add blue pill section (after yellow, around line 890)
```javascript
const blue = allData.pills[2];
if (blue) {
  document.getElementById('temp-blue').textContent = blue.temperature?.toFixed(2) || '--';
  document.getElementById('gravity-blue').textContent = blue.gravity?.toFixed(2) || '--';
  document.getElementById('battery-blue').textContent = blue.battery?.toFixed(1) || '--';
  document.getElementById('name-blue').textContent = blue.name || '--';
  
  // Status indicator logic
  const minutesSinceUpdate = (Date.now() - dataTime) / 1000 / 60;
  let status = 'INACTIVE';
  if (minutesSinceUpdate < 45) status = 'ACTIVE';
  else if (minutesSinceUpdate < 60) status = 'STALE';
  
  document.getElementById('status-blue').style.backgroundColor = 
    status === 'ACTIVE' ? '#00d084' : status === 'STALE' ? '#ffd93d' : '#ff6b6b';
  document.getElementById('badge-blue').textContent = status;
}
```

**Step 7:** Update chart initialization (after yellow charts, around line 845)
```javascript
// Blue pill charts
const ctxTempBlue = document.getElementById('chart-temp-blue').getContext('2d');
charts['temp-blue'] = new Chart(ctxTempBlue, {
  type: 'line',
  data: { labels: chartData.blue.times, datasets: [{
    label: 'Temperature Trend',
    borderColor: '#6b7fff',
    backgroundColor: 'rgba(107, 127, 255, 0.05)',
    data: chartData.blue.temps,
    tension: 0.3,
    fill: true
  }]},
  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
});
// Similar for gravity chart...
```

### Change 2: Update Data Refresh Frequency

**Browser refresh rate** (how often it checks for new data):

Edit `index.html` line ~925:
```javascript
setInterval(updateDisplay, 30000); // Change 30000 to desired milliseconds
```

**Server update rate** (how often workflow fetches):

Edit `.github/workflows/fetch-data.yml` line ~6:
```yaml
cron: '*/15 * * * *'  # Change 15 to desired minutes
```

**Also update Google Apps Script trigger** to match (see CONFIGURATION.md)

### Change 3: Change Colors

Edit CSS lines 141-148 for pill colors:
```css
/* Change hex colors for each pill line */
#chart-temp-reddy { color: #ff6b6b; }  /* Red */
#chart-temp-yellow { color: #ffd93d; } /* Yellow */
```

Or edit Chart.js initialization (around line 813-845):
```javascript
borderColor: '#ff6b6b',  // Change this hex code
```

### Change 4: Modify Layout Spacing

Edit CSS for compact adjustments:
- Body padding: Line 23 (`padding: 10px`)
- Header gap: Line 122 (`gap: 10px`)
- Logo height: Line 143 (`height: 45px`)
- Chart height: Line 209 (`height: 130px`)

Decrease values for more compact, increase for more space.

### Change 5: Add New Metric

Example: Add pressure readings

**Step 1:** Update workflow to include pressure (`.github/workflows/fetch-data.yml`)
```python
"pressure": reddy_pill['pressure'] if reddy_pill else None,
```

**Step 2:** Update HTML metrics grid
```html
<div class="metric-box">
  <div class="metric-label">Pressure</div>
  <div class="metric-value" id="pressure-reddy">--</div>
  <div class="metric-unit">kPa</div>
</div>
```

**Step 3:** Update JavaScript updateDisplay()
```javascript
document.getElementById('pressure-reddy').textContent = reddy.pressure?.toFixed(1) || '--';
```

## Testing Changes Locally

### Without a local server:
1. Edit `index.html` locally
2. Open in browser: `file:///path/to/index.html`
3. Open DevTools → Console for errors
4. Note: data.json won't load (CORS), so you'll see "--" for metrics

### With a local server (recommended):
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node
npx http-server
```
Then open: `http://localhost:8000`

### Testing data loading:
Create a local `data.json` for testing:
```json
{
  "pills": [
    { "name": "test", "id": "xxx", "temperature": 20.5, "gravity": 1.020, "battery": 85 },
    { "name": "test2", "id": "yyy", "temperature": 21.0, "gravity": 1.021, "battery": 90 }
  ],
  "lastUpdated": "2026-06-23T12:00:00Z"
}
```

## Debugging Guide

### Common Issues

**Problem:** Metrics show "--"
- Check browser DevTools Console for fetch errors
- Verify data.json exists and is valid JSON
- Check CORS headers (GitHub Pages returns correct headers)
- Try hard refresh: Ctrl+Shift+R

**Problem:** Charts not rendering
- Check if Chart.js library loaded (line 8 of index.html)
- Verify canvas elements exist (id="chart-temp-reddy", etc.)
- Check DevTools Console for Chart.js errors

**Problem:** Authentication not working
- Check Google OAuth Client ID is correct (line 587)
- Verify authorized domain is added in Google Cloud Console
- Try incognito mode (clear cached login)
- Check DevTools Console for JWT decode errors

**Problem:** Workflow doesn't fetch data
- Check `.github/workflows/fetch-data.yml` syntax (YAML is whitespace-sensitive)
- Verify RAPT_USERNAME and RAPT_API_SECRET secrets exist
- Check GitHub Actions logs for error details
- Manual trigger to test: Actions tab → Fetch RAPT Data → Run workflow

**Problem:** Google Apps Script trigger doesn't fire
- Check last-run time in Triggers page
- Review execution logs in Apps Script editor
- Verify GITHUB_TOKEN (PAT) is still valid
- Check if rate-limited (unlikely, but possible)

## Code Quality Notes

### Style
- No frameworks (vanilla HTML/CSS/JS)
- All CSS in `<style>` tag (no external stylesheets)
- All JS in `<script>` tag (no external scripts except Chart.js)
- Responsive with media queries (no Bootstrap)

### Performance
- Charts re-render every 30 seconds (acceptable for this use case)
- Historical data limited to ~50 points (memory efficient)
- No database queries (data.json is entire dataset)

### Security
- No user input fields (no XSS risk)
- Email validation against whitelist (frontend only)
- HTTPS enforced by GitHub Pages
- API keys never logged (GitHub hides secrets)

### Maintainability
- Each pill follows same pattern (easy to copy)
- Chart code is repetitive (could be refactored, but clear)
- Functions are small and focused
- Comments minimal (code is self-documenting)

## Git Workflow

### Making a change:
```bash
git checkout -b feature/add-new-pill
# Edit files
git add .
git commit -m "Add blue pill monitoring"
git push origin feature/add-new-pill
# Open PR on GitHub (optional for this project)
git checkout main
git pull
git merge feature/add-new-pill
git push origin main
```

### Reverting a change:
```bash
git log --oneline  # Find commit
git revert <commit-hash>  # Creates new commit that undoes the change
git push origin main
```

### Checking what changed:
```bash
git diff  # Unstaged changes
git diff --staged  # Staged changes
git log --stat  # Recent commits and file changes
```

## External Dependencies

Only dependency is Chart.js (CDN, line 8):
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
```

If this fails:
- Check CDN status: https://www.jsdelivr.com/
- Use alternate CDN: https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js
- Cache issues: Hard refresh (Ctrl+Shift+R)

No npm, webpack, build step, or package.json required.
