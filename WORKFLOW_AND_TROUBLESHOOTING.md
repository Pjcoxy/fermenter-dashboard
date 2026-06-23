# RAPT Fermenter Dashboard
## Workflow & Troubleshooting Guide

---

## Table of Contents
1. System Overview
2. How It Works
3. Component Architecture
4. Authentication & Access Control
5. Troubleshooting Guide
6. Maintenance & Operations

---

## 1. System Overview

The RAPT Fermenter Dashboard is a real-time monitoring system for fermentation vessels. It displays live temperature, gravity, and battery data from RAPT Pill sensors with automatic updates every 15 minutes.

**Key Features:**
- Real-time telemetry monitoring
- Dual-fermenter support (reddy and yellow pills)
- Automatic data updates via GitHub Actions (every 15 minutes)
- Google One Tap Sign-In authentication
- Email-based access control (whitelist authorized users)
- Historical trend charts (temperature & gravity)
- Professional, responsive web interface
- Compact single-screen layout
- GitHub Pages hosting
- Zero maintenance deployment

---

## 2. How It Works

### 2.1 System Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    RAPT SENSOR (Pill)                       │
│              Measures: Temp, Gravity, Battery                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │    RAPT Cloud API           │
        │  (api.rapt.io)              │
        └────────────┬─────────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │  Google Apps Script         │
        │  (Scheduled Every 15 Min)   │
        │  - Authenticates to RAPT    │
        │  - Fetches Pill Data        │
        │  - Triggers GitHub Workflow │
        └────────────┬─────────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │  GitHub Actions Workflow    │
        │  (.github/workflows/)       │
        │  - Runs every 15 minutes    │
        │  - Fetches RAPT API         │
        │  - Updates data.json        │
        │  - Commits & Pushes         │
        └────────────┬─────────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │   GitHub Repository         │
        │   (data.json)               │
        └────────────┬─────────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │   GitHub Pages CDN          │
        │   (Static Hosting)          │
        └────────────┬─────────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │   Browser / Dashboard       │
        │   - Fetches data.json       │
        │   - Refreshes every 30 sec  │
        │   - Displays Metrics        │
        └────────────────────────────┘
```

### 2.2 Data Flow Steps

**Step 1: Data Collection (RAPT Pill)**
- RAPT Pill sensors continuously measure temperature, gravity, and battery level
- Data is stored in RAPT Cloud infrastructure

**Step 2: Google Apps Script Trigger**
- Google Apps Script runs every 15 minutes
- Authenticates to RAPT API using OAuth2
- Requests telemetry data for both pills
- Sends webhook to GitHub to trigger workflow dispatch

**Step 3: GitHub Actions Workflow**
- Workflow is triggered by the Google Apps Script
- Authenticates to RAPT API with OAuth2
- Fetches data from: `https://api.rapt.io/api/Hydrometers/GetHydrometers`
- Extracts data for two active pills (by ID)
- Parses JSON and updates `data.json` with latest readings
- Commits changes with timestamp
- Pushes to GitHub repository

**Step 4: GitHub Pages Deployment**
- `data.json` is automatically served via GitHub Pages CDN
- Available at: `https://pjcoxy.github.io/fermenter-dashboard/data.json`
- Cached globally for fast access

**Step 5: Dashboard Display**
- Dashboard (`index.html`) loads from GitHub Pages
- JavaScript fetches `data.json` every 30 seconds
- Renders metrics for both fermenters
- Updates "Last Updated" timestamp in real-time
- Displays in Perth timezone (AWST)

---

## 3. Component Architecture

### 3.1 Frontend (index.html)
- **Framework:** Vanilla HTML/CSS/JavaScript (no dependencies)
- **Font:** Montserrat (Bold, uppercase styling)
- **Colors:** Dark theme with light text (#e0e0e0)
- **Refresh Rate:** 30 seconds (client-side)
- **Responsive:** Works on desktop, tablet, mobile

**Key Elements:**
- RAPT logo (white, inverted)
- Fermenter Dashboard title
- Dual-pill metrics (temperature, gravity, battery)
- Last updated timestamp (Perth timezone)
- Status information

### 3.2 Backend (GitHub Actions Workflow)
- **Location:** `.github/workflows/fetch-data.yml`
- **Trigger:** Every 15 minutes (via cron + Google Apps Script)
- **Runtime:** Ubuntu latest
- **Language:** Bash + Python3

**Workflow Steps:**
1. Checkout repository
2. Get RAPT OAuth2 token
3. Fetch Hydrometers data
4. Parse JSON with Python
5. Extract two pill datasets
6. Update data.json
7. Commit and push (with git rebase handling)

### 3.3 Data Storage (data.json)
```json
{
  "pills": [
    {
      "name": "reddymc redface",
      "id": "b593f1b8-8c3d-4f5e-a798-6e7a3569a85b",
      "temperature": 20.125,
      "gravity": 1023.6,
      "battery": 69.5753
    },
    {
      "name": "yellow mc yellow face",
      "id": "176cc4c3-9e13-4106-b1c0-7455b4f9ca7c",
      "temperature": 20.125,
      "gravity": 1037.25,
      "battery": 78.6045
    }
  ],
  "lastUpdated": "2026-06-22T13:55:00Z"
}
```

### 3.4 Automation (Google Apps Script)
- **Language:** Google Apps Script (JavaScript)
- **Trigger:** Time-based (every 15 minutes)
- **Action:** HTTP POST to GitHub API
- **Endpoint:** `https://api.github.com/repos/Pjcoxy/fermenter-dashboard/actions/workflows/fetch-data.yml/dispatches`
- **Auth:** GitHub Personal Access Token (PAT)

---

## 4. Authentication & Access Control

### 4.1 Google One Tap Sign-In
- **Method:** Google One Tap (OpenID Connect)
- **Flow:** Client-side only (no backend redirects needed)
- **Authentication:** JWT token from Google (cryptographically signed)
- **Storage:** Browser localStorage (persists until manual sign out)
- **Token Expiration:** Expires with browser session or manual sign out

### 4.2 Email-Based Access Control
- **Whitelist Location:** `index.html` line ~717, `const ALLOWED_EMAILS = [...]`
- **Default Authorized Email:** `pjcoxy@gmail.com`
- **Validation:** Checked against Google's signed JWT payload
- **Access Denied:** Shows error message if email not in whitelist
- **To Add More Emails:** Edit `ALLOWED_EMAILS` array and commit

### 4.3 Security Considerations
- ✅ Google authenticates user (you trust Google's identity verification)
- ✅ JWT is signed by Google (cannot be forged)
- ✅ Email whitelist prevents unauthorized access
- ⚠️ localStorage is readable by JavaScript (vulnerable to XSS)
- ⚠️ Physical access to machine allows token theft
- ✅ GitHub Pages is HTTPS-only (encrypted in transit)

---

## 5. Troubleshooting Guide

### Issue 1: "Access Denied" Error on Login

**Symptoms:**
- See message: "Access denied. [email] is not authorized to view this dashboard."
- Attempting to sign in with a different Gmail account

**Possible Causes:**
1. Email address not in whitelist
2. OAuth consent screen domain not authorized

**Solutions:**
1. **Check if email is authorized:**
   - Open `index.html` in GitHub
   - Find line: `const ALLOWED_EMAILS = [......]`
   - If your email is not listed, add it and commit

2. **Verify OAuth consent screen:**
   - Go to Google Cloud Console → Your Project
   - Go to **Settings** → **OAuth consent screen**
   - Check "Authorized domains" includes your domain (e.g., `pjcoxy.github.io`)
   - If missing, add it

3. **Clear browser cache and try again:**
   - Press Ctrl+Shift+Delete to open Clear Browsing Data
   - Clear all data
   - Refresh dashboard and sign in again

### Issue 2: Dashboard Shows "--" for All Values

**Symptoms:**
- Metrics display "--" instead of numbers
- "Last Updated" shows old timestamp

**Possible Causes:**
1. `data.json` not found or corrupted
2. Network connectivity issue
3. GitHub Pages CDN not serving file
4. Browser cache issue

**Solutions:**
1. **Check data.json exists:**
   - Go to GitHub repo
   - Verify `data.json` file is present
   - Check file size is > 100 bytes

2. **Clear browser cache:**
   - Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Open browser DevTools → Settings → Clear cache

3. **Verify GitHub Pages deployment:**
   - Go to repo → Settings → Pages
   - Ensure source is set to "main branch / root"
   - Check deployment status (green checkmark)

4. **Check browser console for errors:**
   - Press F12 → Console tab
   - Look for red error messages
   - Check if `data.json` returns 404 or 403

### Issue 3: Workflow Fails to Run

**Symptoms:**
- Last updated time hasn't changed in hours
- Actions tab shows failures
- Commit history shows no recent updates

**Possible Causes:**
1. GitHub secrets expired or misconfigured
2. RAPT API authentication failed
3. Google Apps Script not triggering
4. GitHub token lacks permissions

**Solutions:**
1. **Check GitHub secrets:**
   - Go to repo → Settings → Secrets and variables → Actions
   - Verify `RAPT_USERNAME` and `RAPT_API_SECRET` exist
   - Test RAPT credentials at `https://id.rapt.io`

2. **Manually trigger workflow:**
   - Go to Actions tab
   - Click "Fetch RAPT Data" workflow
   - Click "Run workflow" button
   - Check logs for error messages

3. **Verify GitHub token:**
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Ensure token has `workflow` scope
   - Check token hasn't expired

4. **Test Google Apps Script:**
   - Go to Google Apps Script project
   - Click "Run" button on `triggerFermenterWorkflow()` function
   - Check Execution log for errors
   - Verify POST request was made to GitHub API

5. **Check RAPT API connectivity:**
   - Verify RAPT account is active
   - Check API rate limits
   - Confirm pill IDs are correct

### Issue 4: RAPT Logo Not Displaying

**Symptoms:**
- Logo shows as broken image icon
- Only see "Fermenter Dashboard" text
- Logo space is empty

**Possible Causes:**
1. Image file not committed to git
2. GitHub Pages not serving image
3. Browser cache issue
4. Incorrect file path

**Solutions:**
1. **Verify logo file exists:**
   - Go to GitHub repo → Files
   - Look for `rapt.png` file
   - File should be ~11KB

2. **Hard refresh browser:**
   - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Wait 30 seconds for CDN cache to clear

3. **Check browser console:**
   - F12 → Console
   - Look for 404 error on `rapt.png`
   - Verify image URL: `https://raw.githubusercontent.com/Pjcoxy/fermenter-dashboard/main/rapt.png`

4. **Re-commit image:**
   - If missing, upload `rapt.png` to repo
   - Ensure it's committed (not just staged)

### Issue 5: Data Updates Inconsistently

**Symptoms:**
- Some updates work, others don't
- "Last Updated" randomly skips hours
- Metrics sometimes freeze

**Possible Causes:**
1. Concurrent workflow runs causing git conflicts
2. Network timeout during RAPT API call
3. GitHub rate limiting
4. Browser not fetching latest data.json

**Solutions:**
1. **Add git rebase to workflow:**
   - Workflow already includes `git pull --rebase`
   - This handles concurrent run conflicts
   - No action needed unless issue persists

2. **Check workflow timeout logs:**
   - Actions tab → Failed run
   - Look for "Timeout" or "Connection refused"
   - Increase timeout in `.github/workflows/fetch-data.yml` if needed

3. **Verify RAPT API rate limits:**
   - Check RAPT dashboard for throttling
   - Ensure only one trigger (Google Apps Script) is active
   - Disable manual triggers if causing duplicates

4. **Force browser refresh:**
   - Don't rely on cache
   - Press Ctrl+F5 to do full cache bust
   - Check DevTools Network tab to confirm fresh fetch

### Issue 6: Battery or Temperature Shows Wrong Values

**Symptoms:**
- Battery percentage >100% or <0%
- Temperature shows unrealistic values (e.g., 150°C)
- Gravity stuck at same value

**Possible Causes:**
1. RAPT API returning corrupted data
2. Pill sensor malfunction
3. JSON parsing error in workflow
4. Data.json not being updated

**Solutions:**
1. **Check RAPT app directly:**
   - Open RAPT mobile app
   - Compare values shown vs. dashboard
   - If different, API might be returning stale data

2. **Verify workflow JSON parsing:**
   - Check workflow logs in Actions tab
   - Look for Python error messages
   - Ensure `json.loads()` doesn't fail

3. **Test workflow manually:**
   - Actions → Fetch RAPT Data → Run workflow
   - Check "Update data.json" step
   - Verify it printed data to console

4. **Replace pill batteries:**
   - If battery shows >100% or unrealistic value
   - Contact RAPT support or replace batteries
   - Workflow may be receiving incorrect sensor readings

### Issue 7: Last Updated Shows Wrong Timezone

**Symptoms:**
- Timestamp shows UTC instead of Perth time
- Time is 8 hours off

**Possible Causes:**
1. Browser timezone incorrect
2. JavaScript Intl.DateTimeFormat not working
3. data.json timestamp in wrong format

**Solutions:**
1. **Check system timezone:**
   - Windows: Settings → Time & Language → Time zone
   - Ensure set to "UTC+08:00" (Perth)

2. **Check browser timezone:**
   - Some browsers override system timezone
   - Try in incognito mode
   - Test in different browser

3. **Verify data.json timestamp:**
   - Check GitHub repo → data.json
   - `lastUpdated` should end with "Z" (UTC indicator)
   - Should be formatted as ISO 8601: `YYYY-MM-DDTHH:MM:SSZ`

---

## 6. Maintenance & Operations

### 6.1 Regular Checks
- **Weekly:** Verify dashboard displays current data
- **Monthly:** Check GitHub Actions workflow success rate
- **Quarterly:** Review and rotate GitHub PAT if needed

### 6.2 Monitoring
- Check "Last Updated" time is current
- Verify battery levels are stable
- Monitor temperature/gravity trends
- Watch for any error messages

### 6.3 Updating RAPT Credentials
1. Go to RAPT account settings
2. Generate new API key
3. Update GitHub secret `RAPT_API_SECRET`
4. Test with manual workflow run

### 6.4 Changing Update Frequency
- Edit `.github/workflows/fetch-data.yml`
- Find cron line: `cron: '*/15 * * * *'`
- Change 15 to desired minutes
- Commit and push changes

### 6.5 Adding New Pill
1. Get pill ID from RAPT app
2. Edit workflow: `.github/workflows/fetch-data.yml`
3. Update Python script to extract new pill ID
4. Update `index.html` to display new pill
5. Test workflow run

---

## Support & Contact

**For Dashboard Issues:**
- Check troubleshooting guide above
- Review GitHub Actions logs
- Verify all credentials and tokens

**For RAPT Pill Issues:**
- Contact RAPT support
- Check RAPT app directly
- Verify pill connectivity

**Repository:** https://github.com/Pjcoxy/fermenter-dashboard
**Dashboard:** https://pjcoxy.github.io/fermenter-dashboard/

---

*Last Updated: June 2026*
*Version: 1.0*
