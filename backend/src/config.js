'use strict';
/** Settings: reads .env (project root) and environment variables. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
// ---------- config (.env is optional) ----------
(function loadEnv() {
  try {
    const f = path.join(__dirname, '..', '..', '.env');
    if (!fs.existsSync(f)) return;
    for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch (e) { /* ignore */ }
})();
const env = process.env;
const PORT = +env.PORT || 3000;
const DATA_DIR = path.resolve(env.DATA_DIR || path.join(__dirname, '..', 'data'));
const DAILY_LIMIT = +env.DAILY_LIMIT || 40;          // AI requests per user per day
const MAX_PROMPT = +env.MAX_PROMPT || 9000;          // characters
const MODEL = env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const API_KEY = env.ANTHROPIC_API_KEY || '';
const MOCK = env.ANTHROPIC_MOCK === '1';            // for tests: fake AI answers
const ALLOW_SIGNUP = env.ALLOW_SIGNUP !== 'false';
const TRUST_PROXY = env.TRUST_PROXY === '1';        // set to 1 behind Render/Railway/Nginx
let SECRET = env.SECRET;
if (!SECRET) { SECRET = crypto.randomBytes(32).toString('hex'); console.warn('[warn] SECRET is not set: users will be signed out whenever the server restarts.'); }


// ---------- email (verification + password reset) ----------
const RESEND_API_KEY = env.RESEND_API_KEY || '';
const MAIL_MODE = env.MAIL_MODE || (RESEND_API_KEY ? 'resend' : 'console');   // resend | console | capture (tests)
const MAIL_FROM = env.MAIL_FROM || 'IELTS Coach <onboarding@resend.dev>';
const REQUIRE_VERIFY = env.REQUIRE_VERIFY ? env.REQUIRE_VERIFY === 'true' : MAIL_MODE === 'resend';
const PUBLIC_URL = (env.PUBLIC_URL || 'http://localhost:' + PORT).replace(/\/+$/, '');
if (MAIL_MODE === 'resend' && !env.PUBLIC_URL) console.warn('[warn] PUBLIC_URL is not set: links in emails will point to localhost.');

module.exports = { RESEND_API_KEY, MAIL_MODE, MAIL_FROM, REQUIRE_VERIFY, PUBLIC_URL, env, PORT, DATA_DIR, DAILY_LIMIT, MAX_PROMPT, MODEL, API_KEY, MOCK, ALLOW_SIGNUP, TRUST_PROXY, SECRET };
