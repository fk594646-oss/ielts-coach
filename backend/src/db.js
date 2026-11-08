'use strict';
/** Tiny JSON-file database (swap for PostgreSQL/SQLite when you outgrow it). */
const fs = require('fs'), path = require('path');
const { DATA_DIR } = require('./config');
// ---------- tiny JSON database ----------
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, 'db.json');
let db = { users: {} };
try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { /* first run */ }
db.users = db.users || {};
const emailIndex = new Map(Object.values(db.users).map(u => [u.email, u.id]));
let timer = null;
function flush() { clearTimeout(timer); const tmp = DB_FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(db)); fs.renameSync(tmp, DB_FILE); }
function persist() { clearTimeout(timer); timer = setTimeout(flush, 250); }
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { try { flush(); } catch (e) {} process.exit(0); });


module.exports = { db, emailIndex, flush, persist };
