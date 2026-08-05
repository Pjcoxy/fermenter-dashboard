# Family Task Squad 🚀 — Setup Guide

A kids' chore/task app you host as a simple URL. Kids open it on any phone
(Android or iPhone), tick off their tasks, log extra things they did, and earn
points, levels, and streaks. You allocate tasks by voice or typing and approve
completions from the Parent view.

**How it works (same pattern as the fermenter dashboard):**

- A **Google Sheet** is the database (free, on your Google account — you can
  open it anytime to see everything).
- A tiny **Google Apps Script** web app reads/writes the Sheet.
- The **web page** (`index.html`) is static, so it hosts free on GitHub Pages.

One-time setup takes about 15 minutes.

---

## Step 1 — Create the Google Sheet + script

The spreadsheet ("Kids Tasks") already exists in Google Drive, and the script
points at it by ID (`SHEET_ID` at the top of the code), so the script can be
created directly at the Apps Script site:

1. Go to [script.google.com/create](https://script.google.com/create)
   (on a phone, use the browser with "Desktop site" turned on if the editor
   doesn't load).
2. Delete any code in the editor, then copy in the entire contents of
   [`apps-script/Code.gs`](apps-script/Code.gs) from this folder.
3. Click the **Save** icon (💾).

You don't need to run anything — the first time the app talks to the script,
it auto-creates the tabs (**People**, **Tasks**, **Completions**) and
pre-loads the family: **Peter 🧔** and **Tymanda 👩** as parents, **Toby 🦖**
and **Ollie 🦊** as kids, all with PIN `1234`. To change anyone's PIN or
avatar later, just edit their row in the **People** tab.

## Step 2 — Deploy the script as a web app

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the ⚙️ gear next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**. Google will ask for permission — click **Review
   permissions** (or **Authorize access**), choose your account, click
   **Advanced → Go to (project) (unsafe)** (it's your own script, this is
   normal), then **Allow**.
5. **Copy the Web app URL** (ends in `/exec`).

> **Important:** if you ever change the script code later, you must go to
> **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**
> for changes to take effect. (Same gotcha as the fermenter script.)

## Step 3 — Point the web page at your script

1. Open `kids-tasks/index.html` in this repository.
2. Near the top of the `<script>` section, find:
   ```js
   const APPS_SCRIPT_URL = '';
   ```
3. Paste your `/exec` URL between the quotes:
   ```js
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/XXXXX/exec';
   ```
4. Commit and push (or ask Claude to do it).

## Step 4 — Open the app

Once GitHub Pages deploys (a few seconds after pushing), the app is live at:

```
https://<your-username>.github.io/<repo-name>/kids-tasks/
```

Everyone taps their own card — Peter and Tymanda get Parent HQ, Toby and
Ollie get the kid view. Tell the kids to bookmark the URL — on both
Android and iPhone they can use **"Add to Home Screen"** so it looks like a
real app.

---

## Daily use

### Kids
- Tap your avatar and enter your PIN.
- Tap the circle next to a task when it's done → 🎉 confetti → it shows
  **"Waiting for a grown-up to check"**.
- Tap **"➕ I did something extra!"** to tell your parent about a job you did
  that wasn't on the list.
- Watch your points, level (🥚 Egg → 👑 MEGA LEGEND), streak 🔥, and the
  leaderboard.

### Parents
- Tap your own card (👑) and enter your PIN — both parents have full access.
- **Awaiting your approval** — approve (✓) or reject (✗) what kids ticked.
  Points only land when you approve. Kid-added extras ask you how many points
  they're worth.
- **Allocate a task** — type it or tap 🎤 and speak it, pick the kid, how
  often (every day / once a week / one-off), and the points.
- **Add a kid** — name, avatar emoji, optional 4-digit PIN.

### Task cycles
- **Every day** — resets each morning; ticking it counts for today only.
- **Once a week** — can be done any day; resets each Monday.
- **One-off** — disappears from the kid's list once approved.

---

## Where the data lives

Everything is in your Google Sheet — open it anytime:

| Tab | Contains |
|-----|----------|
| People | Everyone's name, avatar emoji, PIN, and role (parent or kid) |
| Tasks | Allocated tasks: who, what, points, how often |
| Completions | Every tick-off: date, status (pending/approved/rejected), points |

You can edit the Sheet directly (e.g. change a PIN, fix a typo in a task) and
the app picks it up on its next refresh (within a minute, or on reopening).

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Page says "Setup needed" | `APPS_SCRIPT_URL` in index.html is still empty — do Step 3 |
| Stuck on "Loading…" | Check the `/exec` URL is right and deployed with access set to **Anyone** |
| Changes to Code.gs don't take effect | You must create a **New version** under Deploy → Manage deployments |
| Anyone forgot their PIN | Open the Sheet → People tab → read/change their PIN |
| Points look wrong | Check the Completions tab — points count only when status is `approved` |

## Security notes (honest version)

This is a family app, not a bank. PINs stop siblings from ticking each other's
tasks and keep kids out of the Parent view. The parent PIN is checked by the
Google script (server-side), so kids can't bypass it just by poking at the web
page. The Apps Script URL is technically public, but it's unguessable and only
does what the app does. Same trust level as the fermenter dashboard.
