# IELTS Coach (full project)

**Live demo:** https://huggingface.co/spaces/muhammad-uzair02/ielts-coach  
_The demo runs in the browser only (built-in practice tasks, progress saved on your device). The full version with accounts and AI needs the Node server in this repo._

An IELTS practice website: Reading, Writing, Listening and Speaking, with real accounts, saved progress,
streaks and rewards, band + CEFR reports, and AI-generated tasks and marking.

## Project structure

```
ielts-coach/
├── frontend/                      THE WEBSITE (what users see)
│   ├── index.html                 Page shell: loads the CSS and scripts below
│   ├── css/
│   │   └── styles.css             All styling, light and dark themes, animations
│   └── js/                        Loaded in this order
│       ├── 01-utils-icons.js      Helpers, topic list, SVG icons
│       ├── 02-state-server.js     App state, saving, server mode (calls /api)
│       ├── 03-auth-profile.js     Left sidebar, sign in / sign up, profile page
│       ├── 03b-account-recovery.js  Forgot password, new password, check-your-email screens
│       ├── 03c-security.js        Change password and delete account (profile page)
│       ├── 04-difficulty-core.js  Difficulty calibration, colours, shared helpers
│       ├── 05-rewards.js          XP, streaks, badges, CEFR estimate, dashboard
│       ├── 06-playbook-home.js    8+ playbook, settings chips, home screen
│       ├── 07-offline-bank.js     Built-in practice tasks and offline feedback
│       ├── 08-ai-and-ui.js        AI requests, timers, question rendering, marking
│       ├── 09-results-report.js   Band conversion tables and the results report
│       ├── 10-modules.js          Reading, Writing, Listening, Speaking
│       ├── 10b-full-exams.js      Full Reading test (3 passages, 40 questions) and full Listening test (4 sections)
│       └── 11-main.js             Theme switch and start-up
├── backend/                       THE SERVER (accounts, saving, AI)
│   ├── server.js                  Entry point
│   ├── src/
│   │   ├── config.js              Reads .env and settings
│   │   ├── db.js                  JSON-file database (data/db.json)
│   │   ├── utils.js               Tokens, password hashing, rate limits, HTTP helpers
│   │   ├── routes.js              API: signup, login, verify, forgot, reset, me, password, delete-account, generate, health
│   │   ├── mailer.js              Sends verification and reset emails
│   │   ├── claude.js              Calls the Anthropic API (key stays on the server)
│   │   └── static.js              Serves the frontend files
│   ├── test/smoke.js              Automated test (npm test)
│   └── data/                      Created accounts are saved here
├── Dockerfile                     Container recipe
├── docker-compose.yml             One-command start with Docker
├── .env.example                   Settings template (copy to .env)
├── .gitignore  .dockerignore
├── package.json                   "npm start", "npm test"
└── README.md
```

No npm packages are needed. You only need Node.js 18 or newer.

## 1. Run it on your computer

1. Install Node.js (LTS) from https://nodejs.org
2. In a terminal, open this folder.
3. Copy the settings file: Mac/Linux `cp .env.example .env`, Windows `copy .env.example .env`
4. Edit `.env` and set `SECRET` to long random text. Generate one with:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
5. Run `npm start`, then open http://localhost:3000 and sign up.

Quick look without any server: open `frontend/index.html` in your browser. It works with
browser-only accounts and the built-in practice tasks.

## 2. Turn on the AI

1. Make an account at https://platform.claude.com, add credit, and create an API key
   (separate from a claude.ai chat subscription; billed by usage).
2. In `.env` set `ANTHROPIC_API_KEY=your-key`, then restart. The key never reaches the browser.
3. Limit spending with `DAILY_LIMIT` (AI requests per user per day) and a monthly limit in your Anthropic account.

## 3. Put it live

You need a host that runs Node.js (Render, Railway, Fly.io, a VPS) or Docker.

- Render / Railway: push this folder to GitHub, create a Web Service, start command `npm start`.
  Add the variables from `.env.example` (`SECRET`, `ANTHROPIC_API_KEY`, `TRUST_PROXY=1`, `PUBLIC_URL`).
  Add a persistent disk and set `DATA_DIR` to its path, or accounts are lost on every deploy.
- Docker: `docker compose up -d --build` (accounts are kept in a Docker volume).
- VPS: install Node 18+, upload the folder, set the variables, run with pm2 or systemd behind Nginx or Caddy for HTTPS.

Static-only hosts (Netlify Drop, GitHub Pages) can serve `frontend/` alone, but without the backend:
browser-only accounts, built-in tasks, no AI.

## Email verification and forgot password

Both features need email. The app sends email through Resend (https://resend.com) with one setting.

1. Create a Resend account and an API key. Put it in `.env` as `RESEND_API_KEY=...`.
2. Set `PUBLIC_URL` to your website address (for example `https://yourname.com`). Links in emails use it.
3. For real use, verify your own domain in Resend and set `MAIL_FROM` to an address on it. Resend's
   built-in test sender (`onboarding@resend.dev`) only delivers to your own account email, so other
   people will not receive anything until you do this.
4. Restart. New users must now confirm their email before signing in, and "Forgot password?" appears on the sign-in page.

How it behaves: verification links work for 24 hours, reset links for 1 hour and only once. Resetting a
password signs the user out everywhere. The forgot-password page gives the same answer whether or not
the email exists, and requests are rate limited. Accounts created before you turned this on stay verified.

Testing on your own computer without a key: emails are printed in the terminal where `npm start` runs.
Copy the link from there. Set `REQUIRE_VERIFY=true` to try the verification flow locally.

These features work only with the server. Browser-only mode (opening `frontend/index.html` directly or
static hosting) has no email, so no recovery there.

## Accounts and security (what is included)

- Sign up, sign in, sign out; email verification; forgot password and reset link.
- Change password (profile page). It signs out all other devices and keeps the current one signed in.
- Delete account (profile page, asks for the password). Removes the account and its saved progress.
- API endpoints: `POST /api/signup`, `POST /api/login`, `GET /api/verify`, `POST /api/resend-verification`,
  `POST /api/forgot`, `POST /api/reset`, `GET/PUT /api/me`, `PUT /api/password`, `POST /api/delete-account`,
  `POST /api/generate`, `GET /api/health`.
- Passwords are hashed with scrypt; login tokens are signed and last 30 days; sign-in, reset and AI requests are rate limited.

## Notes before real users arrive

- The JSON-file database suits a few hundred users. Beyond that, replace `backend/src/db.js` with PostgreSQL or SQLite.
- Back up `backend/data/db.json` (or your volume).
- Scores are practice estimates based on IELTS band descriptors and published conversion tables, not official results.
- Links in the 8+ playbook point to outside sites and may change.

Run the tests with `npm test`.
