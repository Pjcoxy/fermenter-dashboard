# Family Task Squad 🚀

A kids' chore/task app you host as a simple URL. Kids open it on any phone
(Android or iPhone), tick off their tasks, log extra things they did, and earn
points, levels, and streaks. You allocate tasks by voice or typing and approve
completions from the Parent view.

**How it works:**

- A **Google Sheet** is the database (free, on your Google account — you can
  open it anytime to see everything).
- A tiny **Google Apps Script** web app reads/writes the Sheet.
- The **web page** (`index.html`) is static, so it hosts free on GitHub Pages.

One-time setup takes about 15 minutes.

---

## Step 1 — Turn on GitHub Pages for this repository

1. In this repository on GitHub, go to **Settings → Pages**.
2. Under **Branch**, choose **main** and folder **/ (root)**, then click **Save**.
3. After a minute, your app URL is:
   ```
   https://<your-username>.github.io/kids-chore-app/
   ```
   (GitHub shows the exact URL on that same Pages settings screen.)

## Step 2 — Create the Google Sheet + script

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank
   spreadsheet. Name it anything, e.g. **Kids Tasks**.
2. In the menu, click **Extensions → Apps Script**.
3. Delete any code in the editor, then copy in the entire contents of
   [`apps-script/Code.gs`](apps-script/Code.gs) from this folder.
4. Click the **Save** icon (💾).
5. In the toolbar dropdown (next to "Debug"), select the function **setup**,
   then click **Run**.
   - Google will ask for permission the first time — click **Review
     permissions**, choose your account, click **Advanced → Go to (project)
     (unsafe)** (it's your own script, this is normal), then **Allow**.
   - This creates the sheet tabs — **People**, **Tasks**, **Completions** —
     and pre-loads the family: **Peter 🧔** and **Tymanda 👩** as parents,
     **Toby 🦖** and **Ollie 🦊** as kids, all with PIN `1234`.
6. To change anyone's PIN or avatar later, just edit their row in the
   **People** tab.

## Step 3 — Deploy the script as a web app

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the ⚙️ gear next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**, then **copy the Web app URL** (ends in `/exec`).

> **Important:** if you ever change the script code later, you must go to
> **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**
> for changes to take effect.

## Step 4 — Point the web page at your script

1. Open `index.html` in this repository.
2. Near the top of the `<script>` section, find:
   ```js
   const APPS_SCRIPT_URL = '';
   ```
3. Paste your `/exec` URL between the quotes:
   ```js
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/XXXXX/exec';
   ```
4. Commit and push (or ask Claude to do it).

## Step 5 — Open the app

Once GitHub Pages deploys (a few seconds after pushing), open your app URL
from Step 1. Everyone taps their own card — Peter and Tymanda get Parent HQ, Toby and
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
| Page says "Setup needed" | `APPS_SCRIPT_URL` in index.html is still empty — do Step 4 |
| 404 when opening the URL | GitHub Pages isn't enabled yet — do Step 1 (allow a minute after saving) |
| Stuck on "Loading…" | Check the `/exec` URL is right and deployed with access set to **Anyone** |
| Changes to Code.gs don't take effect | You must create a **New version** under Deploy → Manage deployments |
| Anyone forgot their PIN | Open the Sheet → People tab → read/change their PIN |
| Points look wrong | Check the Completions tab — points count only when status is `approved` |

## Security notes (honest version)

This is a family app, not a bank. PINs stop siblings from ticking each other's
tasks and keep kids out of the Parent view. The parent PIN is checked by the
Google script (server-side), so kids can't bypass it just by poking at the web
page. The Apps Script URL is technically public, but it's unguessable and only
does what the app does.
