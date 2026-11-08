'use strict';
/** All /api/* endpoints: health, signup, login, me, generate. */
const crypto = require('crypto');
const { env, ALLOW_SIGNUP, DAILY_LIMIT, MAX_PROMPT, MOCK, API_KEY, REQUIRE_VERIFY, PUBLIC_URL } = require('./config');
const { db, emailIndex, persist } = require('./db');
const { sign, verify, scrypt, today, limited, ip, pub, send, readBody, EMAIL } = require('./utils');
const { askClaude } = require('./claude');
const { sendMail, layout } = require('./mailer');

const sha = x => crypto.createHash('sha256').update(String(x)).digest('hex');
async function sendVerification(u) {
  const t = crypto.randomBytes(32).toString('hex');
  u.vtok = sha(t); u.vexp = Date.now() + 24 * 3600e3;
  const link = PUBLIC_URL + '/api/verify?token=' + t;
  await sendMail({ to: u.email, subject: 'Confirm your email for IELTS Coach',
    text: 'Hi ' + u.name + ',\n\nConfirm your email to start practising:\n' + link + '\n\nThis link works for 24 hours. If you did not sign up, you can ignore this message.',
    html: layout('Confirm your email', 'Hi ' + u.name + ', confirm your email to start practising. This link works for 24 hours. If you did not sign up, you can ignore this message.', 'Confirm my email', link) });
}
async function sendReset(u) {
  const t = crypto.randomBytes(32).toString('hex');
  u.rtok = sha(t); u.rexp = Date.now() + 3600e3;
  const link = PUBLIC_URL + '/?reset=' + t;
  await sendMail({ to: u.email, subject: 'Reset your IELTS Coach password',
    text: 'Hi ' + u.name + ',\n\nChoose a new password here:\n' + link + '\n\nThis link works for 1 hour. If you did not ask for this, you can ignore this message and your password will stay the same.',
    html: layout('Reset your password', 'Hi ' + u.name + ', use the button below to choose a new password. This link works for 1 hour. If you did not ask for this, ignore this message and your password stays the same.', 'Choose a new password', link) });
}

// ---------- API ----------
async function api(req, res, url) {
  const route = req.method + ' ' + url.pathname;
  if (route === 'GET /api/health') return send(res, 200, { ok: true, ai: MOCK || !!API_KEY, signup: ALLOW_SIGNUP, publicUrl: env.PUBLIC_URL || '' });

  if (route === 'POST /api/signup' || route === 'POST /api/login') {
    const b = await readBody(req, 20000), email = String(b.email || '').trim().toLowerCase(), pw = String(b.password || '');
    if (limited('auth:' + ip(req), 20, 15 * 60e3)) return send(res, 429, { error: 'Too many attempts. Try again in a few minutes.' });
    if (!EMAIL.test(email) || email.length > 254) return send(res, 400, { error: 'Enter a valid email address.' });
    if (route.endsWith('signup')) {
      const name = String(b.name || '').trim().slice(0, 60);
      if (!ALLOW_SIGNUP) return send(res, 403, { error: 'Sign-ups are closed.' });
      if (!name) return send(res, 400, { error: 'Enter your full name.' });
      if (pw.length < 8 || pw.length > 128) return send(res, 400, { error: 'Your password needs at least 8 characters.' });
      if (emailIndex.has(email)) return send(res, 409, { error: 'An account with this email already exists. Try signing in.' });
      const salt = crypto.randomBytes(16).toString('hex'), id = crypto.randomUUID();
      const u = { id, name, email, salt, hash: await scrypt(pw, salt), st: 'Intermediate', av: 0, photo: null, state: { level: 'Band 6-7', target: '7' }, usage: { d: '', n: 0 }, verified: !REQUIRE_VERIFY, sv: 0, created: new Date().toISOString() };
      db.users[id] = u; emailIndex.set(email, id);
      if (REQUIRE_VERIFY) { try { await sendVerification(u); } catch (e) { console.error('[mail]', e.message); } persist(); return send(res, 201, { needsVerify: true }); }
      persist(); return send(res, 201, { token: sign(id), user: pub(u) });
    }
    const u = db.users[emailIndex.get(email)];
    const ok = u && crypto.timingSafeEqual(Buffer.from(await scrypt(pw, u.salt)), Buffer.from(u.hash));
    if (!ok) return send(res, 401, { error: 'Incorrect email or password.' });
    if (REQUIRE_VERIFY && u.verified === false) return send(res, 403, { error: 'Please verify your email first. Check your inbox for the link.', code: 'unverified' });
    return send(res, 200, { token: sign(u.id), user: pub(u) });
  }

  if (route === 'GET /api/verify') {
    const t = sha(url.searchParams.get('token') || '');
    const u = Object.values(db.users).find(x => x.vtok && x.vtok === t && x.vexp > Date.now());
    if (u) { u.verified = true; u.vtok = null; persist(); }
    res.writeHead(302, { Location: '/?' + (u ? 'verified=1' : 'verify_error=1') }); return res.end();
  }

  if (route === 'POST /api/resend-verification') {
    const b = await readBody(req, 5000), email = String(b.email || '').trim().toLowerCase();
    if (limited('rv:' + ip(req), 10, 3600e3) || limited('rv:' + email, 3, 3600e3)) return send(res, 429, { error: 'Too many requests. Try again later.' });
    const u = db.users[emailIndex.get(email)];
    if (u && u.verified === false) { try { await sendVerification(u); persist(); } catch (e) { console.error('[mail]', e.message); } }
    return send(res, 200, { ok: true });
  }

  if (route === 'POST /api/forgot') {
    const b = await readBody(req, 5000), email = String(b.email || '').trim().toLowerCase();
    if (limited('fg:' + ip(req), 10, 3600e3) || limited('fg:' + email, 3, 3600e3)) return send(res, 429, { error: 'Too many requests. Try again later.' });
    const u = db.users[emailIndex.get(email)];
    if (u) { try { await sendReset(u); persist(); } catch (e) { console.error('[mail]', e.message); } }
    return send(res, 200, { ok: true, message: 'If an account exists for that email, we have sent a reset link.' });
  }

  if (route === 'POST /api/reset') {
    const b = await readBody(req, 5000), pw = String(b.password || '');
    if (limited('rs:' + ip(req), 20, 3600e3)) return send(res, 429, { error: 'Too many attempts. Try again later.' });
    if (pw.length < 8 || pw.length > 128) return send(res, 400, { error: 'Your password needs at least 8 characters.' });
    const t = sha(b.token || '');
    const u = Object.values(db.users).find(x => x.rtok && x.rtok === t && x.rexp > Date.now());
    if (!u) return send(res, 400, { error: 'This reset link is invalid or has expired. Please request a new one.' });
    u.salt = crypto.randomBytes(16).toString('hex'); u.hash = await scrypt(pw, u.salt);
    u.rtok = null; u.verified = true; u.sv = (u.sv || 0) + 1; persist();
    return send(res, 200, { ok: true });
  }

  const user = verify((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  if (!user) return send(res, 401, { error: 'Please sign in.' });

  if (route === 'GET /api/me') return send(res, 200, { user: pub(user) });

  if (route === 'PUT /api/password' || route === 'POST /api/delete-account') {
    const b = await readBody(req, 5000);
    if (limited('pw:' + user.id, 10, 3600e3)) return send(res, 429, { error: 'Too many attempts. Try again later.' });
    const same = crypto.timingSafeEqual(Buffer.from(await scrypt(route.startsWith('PUT') ? String(b.current || '') : String(b.password || ''), user.salt)), Buffer.from(user.hash));
    if (!same) return send(res, 400, { error: 'Your current password is not correct.' });
    if (route.startsWith('POST')) { delete db.users[user.id]; emailIndex.delete(user.email); persist(); return send(res, 200, { ok: true }); }
    const nw = String(b.password || '');
    if (nw.length < 8 || nw.length > 128) return send(res, 400, { error: 'Your new password needs at least 8 characters.' });
    if (nw === String(b.current || '')) return send(res, 400, { error: 'Choose a password different from your current one.' });
    user.salt = crypto.randomBytes(16).toString('hex'); user.hash = await scrypt(nw, user.salt); user.sv = (user.sv || 0) + 1; persist();
    return send(res, 200, { ok: true, token: sign(user.id) });   // this device stays signed in; other devices are signed out
  }

  if (route === 'PUT /api/me') {
    const b = await readBody(req, 600000);
    if (typeof b.name === 'string' && b.name.trim()) user.name = b.name.trim().slice(0, 60);
    if (b.photo === null || (typeof b.photo === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(b.photo) && b.photo.length < 200000)) user.photo = b.photo;
    if (['Beginner', 'Intermediate', 'Advanced'].includes(b.st)) user.st = b.st;
    if (Number.isInteger(b.av) && b.av >= 0 && b.av < 8) user.av = b.av;
    if (b.state && typeof b.state === 'object' && JSON.stringify(b.state).length < 300000) user.state = b.state;
    persist(); return send(res, 200, { user: pub(user) });
  }

  if (route === 'POST /api/generate') {
    const b = await readBody(req, 60000), prompt = b.prompt;
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > MAX_PROMPT) return send(res, 400, { error: 'Invalid request.' });
    if (limited('gen:' + user.id, 12, 60e3)) return send(res, 429, { error: 'Slow down a little and try again in a minute.' });
    if (user.usage.d !== today()) user.usage = { d: today(), n: 0 };
    if (user.usage.n >= DAILY_LIMIT) return send(res, 429, { error: 'You have reached today\'s limit of ' + DAILY_LIMIT + ' AI requests. Built-in practice is still available, and the limit resets tomorrow.' });
    user.usage.n++;
    try { const data = await askClaude(prompt); persist(); return send(res, 200, { data, remaining: DAILY_LIMIT - user.usage.n }); }
    catch (e) { user.usage.n--; throw e; }
  }
  return send(res, 404, { error: 'Not found.' });
}


module.exports = { api };
