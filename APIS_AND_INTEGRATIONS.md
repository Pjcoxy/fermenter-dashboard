# RAPT Fermenter Dashboard - APIs & Integrations

This document details all external services and APIs used by the dashboard.

## RAPT API

### Overview
- **Service:** RAPT (fermentation monitoring hardware company)
- **Purpose:** Provides temperature, gravity, and battery readings from Pill sensors
- **Base URL:** `https://api.rapt.io`
- **Authentication:** OAuth2 (username/password grant)

### Authentication Flow

**Endpoint:** `https://id.rapt.io/connect/token`
**Method:** POST
**Content-Type:** `application/x-www-form-urlencoded`

**Request:**
```bash
curl -X POST "https://id.rapt.io/connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=rapt-user&grant_type=password&username=YOUR_EMAIL&password=YOUR_API_KEY"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "..."
}
```

**Key Notes:**
- `client_id` is hardcoded as `rapt-user` (not confidential)
- `grant_type` is always `password`
- Token expires in 1 hour
- Tokens are single-use; new token requested for each workflow run

**Location in code:** `.github/workflows/fetch-data.yml` lines 23-25

### Data Endpoint

**Endpoint:** `https://api.rapt.io/api/Hydrometers/GetHydrometers`
**Method:** GET
**Authorization:** `Bearer {access_token}` (header)

**Request:**
```bash
curl -X GET "https://api.rapt.io/api/Hydrometers/GetHydrometers" \
  -H "Authorization: Bearer {TOKEN}"
```

**Response:**
```json
[
  {
    "id": "b593f1b8-8c3d-4f5e-a798-6e7a3569a85b",
    "name": "reddymc redface",
    "temperature": 20.125,
    "gravity": 1023.6,
    "battery": 69.5753,
    "rssi": -45,
    "lastUpdate": "2026-06-23T12:00:00Z",
    "mode": "active",
    "timezone": "Australia/Perth",
    ...
  },
  {
    "id": "176cc4c3-9e13-4106-b1c0-7455b4f9ca7c",
    "name": "yellow mc yellow face",
    "temperature": 20.125,
    "gravity": 1037.25,
    "battery": 78.6045,
    ...
  }
]
```

**Used Fields:**
- `id` — UUID to identify pill
- `name` — Display name
- `temperature` — Celsius (float)
- `gravity` — Specific gravity (float)
- `battery` — Percentage (float, 0-100)

**Unused Fields (available but not displayed):**
- `rssi` — Signal strength
- `lastUpdate` — Last reading time
- `mode` — Active/inactive
- `timezone` — Sensor timezone

**Location in code:** `.github/workflows/fetch-data.yml` lines 35-37

### Rate Limits
- **Not documented** by RAPT
- **Assumed:** Generous (can call every 15 minutes)
- **Current usage:** Once per 15 minutes (via Google Apps Script)
- **Contingency:** If rate-limited, would see auth errors in workflow logs

### Credentials
| Credential | Where Stored | How to Update |
|------------|--------------|--------------|
| RAPT_USERNAME | GitHub Secrets | Repo Settings → Secrets → RAPT_USERNAME |
| RAPT_API_SECRET | GitHub Secrets | Repo Settings → Secrets → RAPT_API_SECRET |

**How to rotate credentials:**
1. Go to RAPT mobile app or web portal
2. Generate new API key
3. Update GitHub secret: Settings → Secrets → RAPT_API_SECRET → Edit → Paste new key
4. Test: Go to GitHub Actions → Fetch RAPT Data → Run workflow → Check logs

### Troubleshooting RAPT API
| Issue | Check | Fix |
|-------|-------|-----|
| 401 Unauthorized | Username/password correct | Verify credentials in RAPT app, update secrets |
| 404 Pill not found | Pill ID is correct | Get UUID from RAPT app, update workflow |
| Empty response | Pill is online in RAPT app | Check RAPT service status or contact support |
| Timeout | Network connectivity | Check if RAPT servers are down |

## Google One Tap OAuth 2.0

### Overview
- **Service:** Google Identity Services
- **Purpose:** Authenticate users and verify their email address
- **Scope:** Public (Client ID exposed in HTML)
- **Type:** OpenID Connect (uses ID tokens, not access tokens)

### Setup Configuration

**Client ID:** `385648361894-4rp1i1nb29ns11j6vla4dkh7aj67c4fa.apps.googleusercontent.com`
**Project:** Google Cloud Console → "Fermenter Dashboard"

**Authorized Domains:**
- `pjcoxy.github.io`

**Authorized Origins:**
- `https://pjcoxy.github.io`

**Authorized Redirect URIs:**
- `https://pjcoxy.github.io/fermenter-dashboard/`

**Location in code:** `index.html` line 587

### Authentication Flow

**Step 1:** Browser loads One Tap UI
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
<div id="g_id_onload"
     data-client_id="385648361894-4rp1i1nb29ns11j6vla4dkh7aj67c4fa.apps.googleusercontent.com"
     data-callback="handleCredentialResponse">
</div>
```

**Step 2:** User clicks "Sign in as [email]"
Google creates a JWT (ID token) containing:
```json
{
  "iss": "https://accounts.google.com",
  "sub": "110169547051522812345",
  "aud": "385648361894-4rp1i1nb29ns11j6vla4dkh7aj67c4fa.apps.googleusercontent.com",
  "email": "pjcoxy@gmail.com",
  "email_verified": true,
  "name": "Pete Cox",
  "picture": "https://lh3.googleusercontent.com/...",
  "iat": 1656000000,
  "exp": 1656003600
}
```

**Step 3:** Browser callback function receives JWT
```javascript
function handleCredentialResponse(response) {
  // response.credential contains the JWT string
  const userData = decodeJWT(response.credential);
  // userData.email = "pjcoxy@gmail.com"
}
```

**Step 4:** Frontend validates email against whitelist
```javascript
const ALLOWED_EMAILS = ['pjcoxy@gmail.com'];
if (!ALLOWED_EMAILS.includes(userData.email)) {
  showError('Access denied');
  return;
}
```

**Step 5:** Show dashboard
```javascript
localStorage.setItem('auth_token', response.credential);
localStorage.setItem('user_email', userData.email);
showDashboard(userData);
```

### JWT Structure

**Format:** Three base64-encoded parts separated by dots
```
header.payload.signature
```

**Decoding (what frontend does):**
1. Split by "."
2. Base64-decode the middle part (payload)
3. Parse JSON
4. Extract email, name, etc.

**Security:**
- ✅ JWT is signed by Google (cryptographic signature in third part)
- ✅ Can't be forged without Google's private key
- ⚠️ Frontend doesn't validate signature (trusts Google created it)
- ✅ Sufficient for this use case (Google authenticates, we just read email)

**Location in code:** `index.html` lines 721-751

### Token Storage

**Storage method:** `localStorage`
**Keys stored:**
- `auth_token` — Full JWT (large, ~1KB)
- `user_email` — Just email string (small)
- `user_name` — Just name (small)

**Expiration:**
- JWT expires in 1 hour (per Google)
- localStorage persists until manual sign out or browser cache clear
- No automatic refresh (user signs out after 1 hour)

**Security implications:**
- ✅ Only accessible from same origin (github.com domain locked by browser)
- ⚠️ Readable by JavaScript on the page (XSS could steal it)
- ✅ No sensitive data (email is public)
- ⚠️ Physical machine access can read localStorage

### Email Whitelist

**Location:** `index.html` line 720
```javascript
const ALLOWED_EMAILS = ['pjcoxy@gmail.com'];
```

**How it works:**
1. User attempts to sign in
2. Frontend decodes JWT and reads email
3. Checks if email is in ALLOWED_EMAILS array
4. If not, shows error message: "Access denied. [email] is not authorized"

**Adding new authorized email:**
```javascript
const ALLOWED_EMAILS = [
  'pjcoxy@gmail.com',
  'friend@gmail.com',
  'team@company.com'
];
```

**Limitations:**
- ⚠️ Frontend-only validation (determined user could bypass locally)
- ⚠️ Only affects that user's browser (doesn't help if they share device with authorized user)
- ✅ Sufficient for personal/small team dashboard

### Troubleshooting Google OAuth

| Issue | Check | Fix |
|-------|-------|-----|
| "OAuth client not found" | Client ID correct | Verify Client ID hasn't changed, hard refresh browser |
| One Tap not showing | Browser logged into Gmail | Log into Google account in browser first |
| "Access denied" | Email is authorized | Check ALLOWED_EMAILS array in code, check spelling |
| Sign-out not working | Sign-out button HTML | Check `handleSignOut()` function clears all localStorage keys |

## GitHub API

### Overview
- **Service:** GitHub Actions API
- **Purpose:** Trigger workflow runs from Google Apps Script
- **Rate Limit:** Generous for personal use

### Workflow Dispatch Endpoint

**Endpoint:** `https://api.github.com/repos/Pjcoxy/fermenter-dashboard/actions/workflows/fetch-data.yml/dispatches`
**Method:** POST
**Content-Type:** `application/json`

**Request (from Google Apps Script):**
```bash
curl -X POST "https://api.github.com/repos/Pjcoxy/fermenter-dashboard/actions/workflows/fetch-data.yml/dispatches" \
  -H "Authorization: token YOUR_GITHUB_PAT" \
  -H "Accept: application/vnd.github.v3+json" \
  -d '{"ref":"main"}'
```

**Response:** 204 No Content (success) or 4xx/5xx (error)

**Key Notes:**
- `repo` is case-sensitive: `Pjcoxy/fermenter-dashboard`
- `workflow` can be filename or workflow ID
- `ref` must be valid branch (usually `main`)
- No body parsing (workflow dispatch is trigger-only)

**Location in code:** Google Apps Script (not in GitHub repo)

### Personal Access Token (PAT)

**Scopes required:**
- `workflow` — Can trigger workflow runs
- `repo` — (optional, but usually included with workflow)

**Security:**
- ✅ Token has minimal permissions (workflow dispatch only)
- ✅ Stored in Google Apps Script (not in GitHub)
- ⚠️ If exposed, can only trigger workflows (can't modify code/secrets)

**How to create:**
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token"
3. Check `workflow` scope
4. Name: "Fermenter Dashboard Trigger"
5. Copy token
6. Paste into Google Apps Script

**How to rotate:**
1. Create new token (above)
2. Update Google Apps Script code
3. Delete old token

### Rate Limiting

**Limits:**
- **Authenticated requests:** 5,000 per hour
- **Current usage:** 4 requests per hour (one per 15 minutes)
- **Headroom:** 4,960 requests unused per hour

**If rate limited:**
- GitHub returns 403 Forbidden
- Check X-RateLimit-Remaining header
- Unlikely to hit this limit at current usage

## GitHub Pages CDN

### Overview
- **Service:** GitHub Pages (static hosting)
- **Purpose:** Serve index.html and data.json globally
- **Protocol:** HTTPS enforced
- **Deployment:** Automatic on push to main

### Caching

**CDN Behavior:**
- First request: Download from GitHub origin
- Cached for ~5 minutes by Fastly (GitHub's CDN)
- Subsequent requests: Served from cache
- After 5 minutes: Cache expires, next request fetches fresh

**Cache busting:**
- Hard refresh: Ctrl+F5 (browser-side only)
- CDN purge: Automatic after 5 minutes
- Content hash: Not used (always at same URL)

**Impact on dashboard:**
- data.json updates every 15 minutes
- Browser refreshes every 30 seconds
- First refresh after update: May get cached version (up to 5 min old)
- Acceptable lag: 5-minute max cache + 30-second browser refresh = ~6 minutes

### Configuration

**Repository:** https://github.com/Pjcoxy/fermenter-dashboard
**Branch:** main
**Source:** Root directory (/)
**Domain:** https://pjcoxy.github.io/fermenter-dashboard/

**Enabling GitHub Pages:**
1. Go to repo Settings → Pages
2. Source: "Deploy from a branch"
3. Branch: main / (root)
4. Click Save
5. Wait 1-2 minutes for first deployment

**Status:**
- Check repo home for "Latest deployment" badge
- Green checkmark = deployed
- Red X = build failed (syntax error in HTML/CSS/JS)

## Google Apps Script

### Overview
- **Service:** Google Apps Script (part of Google Cloud)
- **Purpose:** Time-driven scheduler to trigger GitHub Actions
- **Runtime:** JavaScript (modern ES6)
- **Execution:** Serverless, managed by Google

### Project Details

**Project Name:** "Fermenter pill automation"
**URL:** https://script.google.com/home/projects/1_0qas8CtkeHlyTpcNmgfhEtWGnO8g2XTldoSfZB9pyLUB7J-uEtvhAJ/editor

### Main Function

```javascript
function triggerFermenterWorkflow() {
  const GITHUB_REPO = 'Pjcoxy/fermenter-dashboard';
  const GITHUB_TOKEN = '...'; // GitHub PAT
  
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

**What it does:**
1. Constructs GitHub API endpoint
2. Prepares HTTP request with auth token
3. POSTs to GitHub Actions API
4. Logs response code (200-299 = success)

### Trigger Configuration

**Type:** Time-driven
**Frequency:** Every 15 minutes
**Schedule:** Runs every hour and every 30 minutes (4x per hour)

**View status:**
1. Go to Apps Script project
2. Click "Triggers" (left sidebar)
3. Look for "Fermenter pill timer"
4. Check "Last run" and "Error rate"

### Execution Logs

**View logs:**
1. Go to Apps Script editor
2. Click "Executions" (left sidebar)
3. See list of recent runs with status/time
4. Click execution to see detailed logs

**Common issues:**
- "Authorization failed" — GitHub token is invalid/expired
- "Cannot reach API" — GitHub is down or GAS is blocked by network
- "Script error" — Syntax error in JavaScript

### Limitations

**Execution time:** 6-hour limit per script (not an issue, runs in seconds)
**Quota:** 20 million executions/month (4 per hour = ~3,000/month)
**Reliability:** Google says "reliable" but not SLA-backed

## Data Persistence: data.json

### Structure

```json
{
  "pills": [
    {
      "name": "string",
      "id": "uuid",
      "temperature": "float (degrees C)",
      "gravity": "float (specific gravity)",
      "battery": "float (percentage 0-100)"
    }
  ],
  "lastUpdated": "ISO 8601 timestamp (UTC)"
}
```

### Constraints

**File size:** ~500 bytes (very small)
**Update frequency:** Every 15 minutes (GitHub Actions workflow)
**Retention:** Only stores latest readings (no history)
**Concurrency:** Last-write-wins (no transactions)

### Git handling

**Location:** Repository root (https://github.com/Pjcoxy/fermenter-dashboard/blob/main/data.json)

**Update process:**
1. Workflow fetches fresh data from RAPT API
2. Python script overwrites data.json
3. Git adds file: `git add data.json`
4. Git commits: `git commit -m "Update fermenter data: ..."`
5. Git pulls (rebase): `git pull --rebase` (handles concurrent writes)
6. Git pushes: `git push`
7. GitHub Pages deploys within 5 seconds

**Concurrency handling:**
- Rebase prevents merge conflicts
- Last write wins (acceptable for read-only dashboard)
- No data loss (overwrites old readings with new ones)

### Extending data.json

**Adding new field:**
1. Update workflow Python (add field to JSON)
2. Update index.html JavaScript (read and display field)
3. Both changes in same commit
4. Test that JavaScript doesn't crash if field is missing

**Example: Adding pressure field**
```python
"pressure": reddy_pill['pressure'] if reddy_pill else None,
```
```javascript
document.getElementById('pressure-reddy').textContent = reddy.pressure?.toFixed(1) || '--';
```

## Summary: API Call Sequence (Every 15 Minutes)

```
1. Google Apps Script trigger fires (time-driven)
   ↓
2. Google Apps Script POSTs to GitHub API
   ↓
3. GitHub Actions workflow starts
   ↓
4. Workflow POSTs to RAPT API for token
   ↓
5. RAPT returns OAuth2 token
   ↓
6. Workflow GETs from RAPT API with token
   ↓
7. RAPT returns pill readings
   ↓
8. Workflow parses JSON and updates data.json
   ↓
9. Workflow commits and pushes to GitHub
   ↓
10. GitHub Pages CDN updates (within 5 min)
   ↓
11. Browser fetches fresh data.json (every 30 sec)
   ↓
12. Dashboard displays updated readings
```

**Timeline:** 0-30 seconds for server update, 0-5 minutes for CDN, next 30 seconds for browser refresh = 15-35 minute lag from RAPT sensor to dashboard display
