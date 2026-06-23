# Claude Code Agent Guidance

This file is instructions for Claude (AI agent) on how to assist with this project.

## User Profile
- **Role:** Non-technical project owner managing a fermenter monitoring system
- **Preference:** Wants comprehensive documentation so they can request changes without explaining technical details
- **Communication style:** Casual, sometimes brief/terse messages
- **Expectation:** When pointing to docs, expect me to understand the system fully

## Project Context
- **Purpose:** Real-time monitoring dashboard for RAPT fermentation sensors
- **Audience:** Personal/small team use (single email authorized)
- **Constraints:** Must run on GitHub Pages (static only, no backend), no databases
- **Status:** Production-ready (launched with auth, charts, multiple pills, Google Apps Script automation)

## Important Decisions & Rationale

### Why Google Apps Script (not GitHub cron)
- GitHub's built-in cron scheduler is unreliable (documented issue)
- Google Apps Script provides time-driven trigger every 15 minutes
- More dependable than GitHub's scheduler
- Trade-off: External dependency (Google project), but acceptable for reliability

### Why Client-Side Authentication (not backend)
- Cannot run backend on GitHub Pages (static hosting only)
- Google One Tap handles identity verification (delegate to Google)
- Email whitelist validates authorization (frontend-only validation)
- Trade-off: Email whitelist can be bypassed by modifying browser JS, but only affects that user's local browser—doesn't compromise the dashboard on other devices

### Why No Historical Data Persistence
- data.json stores only latest readings (fast, simple)
- Historical charts show ~50 in-memory points (good balance)
- Full history would require database or file archive strategy
- Trade-off: Data older than 50 points is lost; acceptable for fermentation monitoring

### Why Vanilla JS (no frameworks)
- GitHub Pages hosts static files only
- No build step, no dependencies, no package.json
- Single HTML file with inline CSS/JS is easiest to deploy
- Trade-off: More verbose code, but clear and maintainable

### Why Compact Single-Screen Layout
- Fits all metrics on one screen without scrolling
- Desktop-first design, mobile-responsive
- User requested this as UX improvement
- Trade-off: Smaller fonts, less padding, might be crowded on very small screens

## Deployment & Operations

### Deployment Process
1. Edit files locally in git
2. Commit with message describing change
3. Push to main branch
4. GitHub Pages auto-deploys (within 5 seconds)
5. GitHub Actions workflow auto-triggers every 15 minutes (via GAS)

### Monitoring Checklist
- Last Updated time should be <15 minutes old
- All metrics should show numbers (not "--")
- Battery levels >0% on active pills
- Check Google Apps Script error rate (should be 0%)
- Check GitHub Actions workflow status (should be successful)

### When Things Break
- **Dashboard shows "--":** Check data.json exists and GitHub Pages is enabled
- **Data doesn't update:** Check Google Apps Script last-run time, then GitHub Actions workflow
- **Authentication fails:** Check OAuth console for authorized domains
- **Metrics are stale:** Workflow may have failed; check GitHub Actions logs

## How I Should Assist

### When user says: "can you [change something]"
1. Read the relevant documentation (CONFIGURATION.md for config, DEV_GUIDE.md for code)
2. Make the change confidently without asking for clarification
3. Test the change (manually verify logic, don't break other features)
4. Commit with a clear message
5. Push to GitHub
6. Update documentation if anything changed (auto-update rule below)

### When user says: "check [something]"
1. Look at the docs first (don't ask them to explain)
2. Verify against current code/config
3. Report what's configured and whether it matches expectations

### When user says: "why [something]"
1. Reference the rationale in this file if applicable
2. Explain in simple terms (avoid jargon)
3. Mention trade-offs

## Auto-Update Documentation Rules

**Automatically update documentation when:**
- ✅ Adding/changing features (pills, metrics, auth)
- ✅ Adding/changing configuration points
- ✅ Changing API endpoints or external services
- ✅ Adding/changing security settings
- ✅ Changing data structure or schema
- ✅ Changing update frequencies or timing
- ✅ Adding new troubleshooting issues

**Update these files in this order:**
1. CONFIGURATION.md — if user can change it themselves
2. DEV_GUIDE.md — if developers need to know how to make this change
3. ARCHITECTURE.md — if system design or dependencies changed
4. README.md — only if setup instructions changed
5. WORKFLOW_AND_TROUBLESHOOTING.md — if new troubleshooting is needed

**Commit documentation updates together with code changes:**
```
git commit -m "Add [feature] and update docs

- Code change: [what changed in code]
- Docs: Updated CONFIGURATION.md with new config points"
```

## Code Quality Standards

### What to do:
- ✅ Make changes confidently (user wants minimal back-and-forth)
- ✅ Test logic mentally (don't introduce obvious bugs)
- ✅ Keep code style consistent with existing code
- ✅ Keep comments minimal (well-named variables > comments)
- ✅ Push after testing; no "draft" commits

### What not to do:
- ❌ Add abstractions "for future scalability" (do what's needed, no more)
- ❌ Refactor working code (fix bugs, don't reorganize)
- ❌ Add error handling for cases that can't happen
- ❌ Ask user "does this look good" — just do it and they'll tell you if not
- ❌ Add features beyond what they asked for
- ❌ Skip documentation updates

## Limitations & Constraints

### Hard Constraints
- Cannot run backend code (GitHub Pages is static only)
- Cannot add database/persistent storage (static hosting)
- Cannot use NPM packages or build tools
- Cannot add server-side authentication (static only)
- Data.json updates limited by RAPT API (every 15 min minimum)
- GitHub Actions limited to 60-minute workflows

### Soft Constraints
- Keep file size manageable (data.json could grow if archiving history)
- Keep API calls minimal (RAPT may have undocumented rate limits)
- Keep JavaScript footprint small (single HTML file, no bundler)
- Keep security model simple (static site, email whitelist)

### What to Suggest If User Wants [X]

| Want | What to Suggest | Why |
|------|-----------------|-----|
| Server-side auth | "Can't do on GitHub Pages, but email whitelist is sufficient for personal use" | Static hosting limitation |
| Full history | "Can archive data.json versions or move to external storage, but adds complexity" | No database |
| Real-time updates | "Can't do faster than RAPT API allows (~15 min), could poll more often but wastes bandwidth" | API limitation |
| Mobile app | "Dashboard is responsive, works great on mobile already" | Don't add complexity |
| Notifications | "Can send via email/webhook if you add a backend, but defeats simplicity" | Requires backend |

## Testing Philosophy

### What to test:
- ✅ Logic is correct (e.g., status badges show correct color)
- ✅ No obvious syntax errors (JS runs, HTML renders)
- ✅ Doesn't break other features (e.g., adding a pill doesn't break existing pills)

### What not to test:
- ❌ Don't require full browser testing (I can't run servers easily, and user will test)
- ❌ Don't write unit tests (no test framework, and overhead > benefit for this project)
- ❌ Don't test edge cases extensively (not a library, just a dashboard)

## Tone & Communication

### How to write commit messages:
```
Clear, action-oriented subject line describing what changed

- Bullet points for implementation details if needed
- Reference any docs updated

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

### How to respond to user:
- Be direct and concise
- Confirm what changed (brief summary)
- If pushing to GitHub, mention it's live
- Don't over-explain (user knows what they asked for)

### How to ask for clarification (rare):
- Only if genuinely ambiguous
- Frame as "I want to make sure I get this right"
- Offer options: "Should I [A] or [B]?"

## Key Files for Reference

| File | Purpose | When to Update |
|------|---------|-----------------|
| README.md | Setup instructions | If setup process changes |
| ARCHITECTURE.md | System design | If components/dependencies change |
| CONFIGURATION.md | What can be configured | After any config-related change |
| DEV_GUIDE.md | How to code changes | After code structure changes |
| WORKFLOW_AND_TROUBLESHOOTING.md | Operations & troubleshooting | When fixing bugs or adding features |
| CLAUDE.md | This file | Rarely; only if project vision changes |

## Examples of Conversations I Should Expect

### Example 1: "Add the third pill"
- I read CONFIGURATION.md section "How to add a new pill"
- I read DEV_GUIDE.md section "Change 1: Add a new pill"
- I get pill UUID from context or ask user
- I update workflow, HTML, JavaScript
- I test logic (new pill displays, status works, charts initialize)
- I commit with clear message
- I push
- I update CONFIGURATION.md and DEV_GUIDE.md to reflect new pill
- I notify user: "Added blue pill monitoring. Live at [URL]"

### Example 2: "Update every 5 minutes instead of 15"
- I read CONFIGURATION.md section "Data Update Frequency"
- I update .github/workflows/fetch-data.yml cron (*/5)
- I tell user to also update Google Apps Script trigger
- I commit and push
- I document in CONFIGURATION.md that it changed
- Done without asking clarifying questions

### Example 3: "Why does the login keep asking me to sign in?"
- I read ARCHITECTURE.md "Authentication Layer"
- I explain: "Token is stored in localStorage, which clears when browser closes"
- I mention we could use sessionStorage instead if they want it to persist longer
- I ask: "Would you like tokens to persist across browser sessions?" before making change

## Failure Modes & Recovery

### If I break something:
- I should catch it in logic check before pushing
- If user reports breakage, I should:
  1. Read docs to understand what went wrong
  2. Identify the commit that broke it (git log)
  3. Create a new commit that fixes it (not revert, unless simple)
  4. Test the fix
  5. Document what happened and how to avoid it

### If documentation gets out of sync:
- User should point to the discrepancy
- I should find truth in the code/config
- Update docs to match code (not vice versa)
- Commit with message: "Update docs to match current implementation"

## Future Enhancement Zones (Don't Start Without Asking)

These are nice-to-haves that user might request; don't implement unless explicitly asked:
- Historical data archiving
- Email alerts (low battery, stale data)
- Multiple dashboard views
- Data export (CSV)
- Dark mode toggle
- Pill status history
- Fermentation curve analysis
