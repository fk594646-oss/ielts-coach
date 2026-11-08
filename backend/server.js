'use strict';
/** Entry point: node backend/server.js  (Node 18+, no npm packages needed) */
const http = require('http');
const { PORT, API_KEY } = require('./src/config');
const { flush } = require('./src/db');
const { send } = require('./src/utils');
const { api } = require('./src/routes');
const { serve } = require('./src/static');

function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'");
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    api(req, res, url).catch(e => { if (!res.headersSent) send(res, e && e.status || 500, { error: e && e.error || 'Server error.' }); if (!(e && e.status)) console.error(e); });
  } else if (req.method === 'GET' || req.method === 'HEAD') serve(req, res, url);
  else { res.writeHead(405); res.end(); }
}

function createApp() { return http.createServer(handler); }
module.exports = { createApp, flush };
if (require.main === module) {
  createApp().listen(PORT, () => console.log(`IELTS Coach running on http://localhost:${PORT}  (AI: ${API_KEY ? 'enabled' : 'NOT configured, built-in practice only'})`));
}
