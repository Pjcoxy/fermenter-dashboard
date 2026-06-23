# RAPT Fermenter Dashboard - Architecture

## System Overview

The dashboard is a real-time monitoring system for RAPT fermentation sensors. It fetches data every 15 minutes via GitHub Actions, stores it in JSON, and displays it with Google One Tap authentication.

## High-Level Data Flow

```
RAPT Sensors → RAPT Cloud API → GitHub Actions (fetch-data.yml)
                                        ↓
                               data.json (GitHub)
                                        ↓
                        GitHub Pages CDN (HTTPS)
                                        ↓
                        Browser (index.html)
                                        ↓
                    Google One Tap → Email validation
                                        ↓
                            Dashboard display
```

## Component Architecture

### 1. Data Collection Layer
- **RAPT Pill Sensors:** Two IoT devices (reddy, yellow) measuring temperature, gravity, battery
- **RAPT Cloud API:** `https://api.rapt.io/api/Hydrometers/GetHydrometers`
- **Authentication:** OAuth2 via `https://id.rapt.io/connect/token`
- **Credentials:** RAPT_USERNAME, RAPT_API_SECRET (stored as GitHub secrets)

### 2. Data Processing Layer
**GitHub Actions Workflow** (`.github/workflows/fetch-data.yml`)
- Runs every 15 minutes triggered by Google Apps Script
- Step 1: Get OAuth2 token from RAPT
- Step 2: Fetch hydrometers data from RAPT API
- Step 3: Parse JSON with Python, extract two pill datasets
- Step 4: Update data.json with latest readings + timestamp
- Step 5: Commit and push to main branch (with git rebase for concurrency)

**Google Apps Script** (External scheduler)
- Project: "Fermenter pill automation"
- Time-driven trigger: Every 15 minutes
- POSTs to: `https://api.github.com/repos/Pjcoxy/fermenter-dashboard/actions/workflows/fetch-data.yml/dispatches`
- Uses GitHub Personal Access Token for authentication
- Reason: GitHub's built-in cron is unreliable; GAS is more dependable

### 3. Data Storage Layer
**data.json** (GitHub repository root)
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
- Auto-updated every 15 minutes by GitHub Actions
- Served globally via GitHub Pages CDN
- Cached for ~5 minutes, then purged

### 4. Hosting Layer
**GitHub Pages** (https://pjcoxy.github.io/fermenter-dashboard/)
- Static file hosting from main branch root
- HTTPS enforced
- Global CDN distribution
- Zero maintenance

### 5. Frontend Layer
**index.html** (Single-page application)
- Vanilla HTML/CSS/JavaScript (no frameworks)
- Client-side refresh: Fetches data.json every 30 seconds
- Renders metrics, charts, timestamps
- Responsive design (desktop, tablet, mobile)

### 6. Authentication Layer
**Google One Tap Sign-In**
- OAuth 2.0 Client ID: `385648361894-4rp1i1nb29ns11j6vla4dkh7aj67c4fa.apps.googleusercontent.com`
- Client-side JWT decoding (no backend redirects)
- Email whitelist validation
- Token stored in localStorage
- Expires on browser close or manual sign out

## Key Files & Responsibilities

| File | Purpose | Owner |
|------|---------|-------|
| `index.html` | Frontend UI, auth, charts | Claude Code |
| `data.json` | Latest readings (auto-updated) | GitHub Actions |
| `.github/workflows/fetch-data.yml` | Data fetching & storage | GitHub Actions |
| `README.md` | Setup & user guide | Claude Code |
| `WORKFLOW_AND_TROUBLESHOOTING.md` | System docs & troubleshooting | Claude Code |
| `ARCHITECTURE.md` | This file | Claude Code |
| `CONFIGURATION.md` | Config points | Claude Code |
| `DEV_GUIDE.md` | Development reference | Claude Code |
| `CLAUDE.md` | AI agent guidance | Claude Code |

## External Dependencies

### RAPT API
- Base URL: `https://api.rapt.io`
- Auth endpoint: `https://id.rapt.io/connect/token`
- Hydrometers endpoint: `/api/Hydrometers/GetHydrometers`
- Auth method: OAuth2 (client credentials grant with username/password)
- Rate limit: Not documented, assumed generous for once-per-15-min calls

### GitHub API
- Workflow dispatch endpoint: `https://api.github.com/repos/Pjcoxy/fermenter-dashboard/actions/workflows/fetch-data.yml/dispatches`
- Authentication: Personal Access Token (scope: `workflow`)
- Called by: Google Apps Script every 15 minutes

### Google Services
- Google One Tap: `https://accounts.google.com/gsi/client`
- OAuth config: Google Cloud Console project
- Credentials: Stored in index.html (public Client ID is safe)

### GitHub Pages
- Deployment: Automatic from main branch
- Domain: `pjcoxy.github.io`
- Protocol: HTTPS enforced
- Cache: ~5 minute global CDN cache

## Data Flow Timeline

1. **Minute 0:** Google Apps Script triggers workflow
2. **Minute 0-1:** GitHub Actions fetches token, calls RAPT API, updates data.json
3. **Minute 0-1:** data.json committed and pushed to main
4. **Minute 0-5:** GitHub Pages CDN updates
5. **Minute 0-30:** Browser continues refreshing from old data.json (cached)
6. **Minute 30:** Browser fetches fresh data.json
7. **Minute 30-45:** Dashboard displays updated readings
8. **Minute 15:** Google Apps Script triggers again (workflow repeats)

## Security Architecture

### Authentication & Authorization
- **User auth:** Google One Tap (Google handles identity verification)
- **Email validation:** Whitelist in ALLOWED_EMAILS array (frontend validation)
- **API auth:** GitHub PAT for workflow dispatch (Google Apps Script → GitHub)
- **RAPT auth:** OAuth2 credentials (GitHub Actions → RAPT API)

### Secrets Management
- `RAPT_USERNAME` & `RAPT_API_SECRET` → GitHub Secrets (not in code)
- `GITHUB_TOKEN` → Built-in GitHub Actions token (auto-provided)
- Google OAuth Client ID → Public in index.html (safe, Client ID is not sensitive)
- GitHub PAT (for GAS) → In Google Apps Script (private Google project)

### Data Protection
- All communication: HTTPS encrypted
- data.json: Public (contains only current readings, no sensitive data)
- Credentials: Never logged, never committed to git
- Client-side validation: Email whitelist prevents unauthorized access

### Vulnerabilities & Mitigations
| Risk | Mitigation |
|------|-----------|
| XSS injection in HTML | Static hosting, no user input, CSP headers |
| localStorage token theft | Physical machine access required, tokens expire |
| RAPT API compromise | Separate API keys for dashboard (limited permissions) |
| GitHub token leak | PAT has minimal scope (workflow dispatch only) |
| Google OAuth Client ID exposed | Client ID is public by design, Secret is not exposed |

## Performance Considerations

### Data Refresh
- Browser checks every 30 seconds (fast feedback)
- Server updates every 15 minutes (RAPT API limitation)
- GitHub Pages CDN caches for ~5 minutes

### Bandwidth
- data.json: ~500 bytes per fetch
- Browser requests: ~1 every 30 seconds = ~2.9 KB/min = 4 MB/month (negligible)

### Chart Data
- Stores ~50 historical points per metric in memory
- Limited to last N readings (scrolling window)
- No persistent storage of history (data.json only stores latest)

## Deployment & Scaling

### Current Setup
- Single GitHub repository
- Single GitHub Pages site
- Two RAPT sensors
- No backend infrastructure

### To Scale
- Add more pills: Update pill IDs in workflow + HTML
- Add more users: Extend ALLOWED_EMAILS array
- Add metrics: Extend data.json structure + HTML display
- Archive history: Implement data.json history files (e.g., `data-2026-06.json`)

### Limitations
- GitHub Pages: No server-side logic (static only)
- data.json: No transaction support, last-write-wins concurrency
- Google Apps Script: 6-hour execution timeout (not a concern for once-per-15-min)
- RAPT API: Rate limits unknown, assumes generous

## Monitoring & Observability

### Health Checks
- **Dashboard loads:** Browser connectivity ✅
- **Last Updated time:** Data freshness (should be <15 min)
- **Battery levels:** Sensor connectivity (>0% indicates active)
- **Google Apps Script:** Check trigger last-run in Triggers page (should be recent)
- **GitHub Actions:** Check workflow runs in Actions tab (should have 0 errors)

### Logs & Debugging
- Browser DevTools Console: Client-side errors
- GitHub Actions: Workflow logs (Settings → Secrets show masked output)
- Google Apps Script: Execution logs (Apps Script editor → Executions)
- data.json: Check file size & timestamp on GitHub

## Disaster Recovery

### If data.json is corrupted
- GitHub has full commit history
- Revert to previous commit: `git revert <commit-hash>`
- Workflow will regenerate data on next run

### If GitHub Actions fails
- Google Apps Script continues triggering
- Workflow logs show error
- Manual trigger: Go to Actions → Fetch RAPT Data → Run workflow

### If Google Apps Script fails
- GitHub Actions cron still runs (unreliable but present)
- Manual trigger: Same as above

### If RAPT API is down
- data.json stays stale
- Browser continues showing last-known readings
- No automatic recovery until RAPT returns

## Future Enhancements

### Possible Additions
- Historical data persistence (archive data.json to separate files)
- Email alerts (low battery, data stale >30 min)
- Multiple dashboard views (temperature vs gravity vs battery)
- Export data (CSV, JSON download)
- Predictive analytics (fermentation curve analysis)

### Technical Debt
- No tests (would require testing framework)
- No error tracking (would require external service)
- Frontend coupling to data.json schema (tight contract)
- No API versioning (schema changes break browser)
