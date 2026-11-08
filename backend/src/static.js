'use strict';
/** Serves the website files from /frontend. */
const fs = require('fs'), path = require('path');
// ---------- static files ----------
const PUB = path.join(__dirname, '..', '..', 'frontend');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json' };
function serve(req, res, url) {
  let p; try { p = decodeURIComponent(url.pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (p.endsWith('/')) p += 'index.html';
  let f = path.normalize(path.join(PUB, p));
  if (f !== PUB && !f.startsWith(PUB + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { if (path.extname(p)) { res.writeHead(404); return res.end('Not found'); } f = path.join(PUB, 'index.html'); }
  const ext = path.extname(f).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600' });
  fs.createReadStream(f).pipe(res);
}


module.exports = { serve };
