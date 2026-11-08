'use strict';
/** Tokens, password hashing, rate limiting and HTTP helpers. */
const crypto = require('crypto');
const { SECRET, TRUST_PROXY } = require('./config');
const { db } = require('./db');
// ---------- helpers ----------
const b64 = s => Buffer.from(s).toString('base64url');
function sign(uid) {
  const p = b64(JSON.stringify({ u: uid, v: (db.users[uid] && db.users[uid].sv) || 0, e: Date.now() + 30 * 864e5 }));
  return p + '.' + crypto.createHmac('sha256', SECRET).update(p).digest('base64url');
}
function verify(tok) {
  if (!tok || tok.indexOf('.') < 0) return null;
  const [p, s] = tok.split('.');
  const x = crypto.createHmac('sha256', SECRET).update(p).digest('base64url');
  const a = Buffer.from(s || ''), b = Buffer.from(x);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const d = JSON.parse(Buffer.from(p, 'base64url').toString()); const usr = db.users[d.u]; return d.e > Date.now() && usr && (d.v || 0) === (usr.sv || 0) ? usr : null; } catch (e) { return null; }
}
const scrypt = (pw, salt) => new Promise((res, rej) => crypto.scrypt(pw, salt, 64, (e, k) => e ? rej(e) : res(k.toString('hex'))));
const today = () => new Date().toISOString().slice(0, 10);
const hits = new Map();
function limited(key, max, ms) {
  const now = Date.now(), arr = (hits.get(key) || []).filter(t => now - t < ms);
  arr.push(now); hits.set(key, arr);
  return arr.length > max;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some(t => now - t < 3600e3)) hits.delete(k); }, 600e3).unref();
const ip = req => (TRUST_PROXY && req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : req.socket.remoteAddress) || '?';
const pub = u => ({ id: u.id, name: u.name, email: u.email, photo: u.photo || null, st: u.st, av: u.av || 0, state: u.state || {} });
function send(res, code, obj) { const s = JSON.stringify(obj); res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(s); }
function readBody(req, limit = 1e6) {
  return new Promise((resolve, reject) => {
    let n = 0; const c = [];
    req.on('data', d => { n += d.length; if (n > limit) { reject({ status: 413, error: 'Request too large.' }); req.destroy(); return; } c.push(d); });
    req.on('end', () => { try { resolve(c.length ? JSON.parse(Buffer.concat(c).toString()) : {}); } catch (e) { reject({ status: 400, error: 'Invalid JSON.' }); } });
    req.on('error', () => reject({ status: 400, error: 'Bad request.' }));
  });
}
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;


module.exports = { b64, sign, verify, scrypt, today, limited, ip, pub, send, readBody, EMAIL };
