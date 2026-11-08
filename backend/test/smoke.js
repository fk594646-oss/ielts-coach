// Run with: npm test   (starts the server on a random port with fake AI answers)
const os = require('os'), fs = require('fs'), path = require('path'), assert = require('assert');
process.env.ANTHROPIC_MOCK = '1'; process.env.SECRET = 'test-secret'; process.env.DAILY_LIMIT = '2';
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ielts-'));
const { createApp, flush } = require('../server');
const srv = createApp();
srv.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;
  const call = async (p, o = {}, t) => { const r = await fetch(base + p, { ...o, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) } }); let j = {}; try { j = await r.json(); } catch (e) {} return { s: r.status, j }; };
  const post = (p, b, t) => call(p, { method: 'POST', body: JSON.stringify(b) }, t);
  try {
    assert.strictEqual((await call('/api/health')).j.ok, true);
    assert.strictEqual((await call('/api/me')).s, 401);
    let r = await post('/api/signup', { name: 'Test User', email: 'T@Example.com', password: 'password123' });
    assert.strictEqual(r.s, 201); const tok = r.j.token;
    assert.strictEqual((await post('/api/signup', { name: 'X', email: 't@example.com', password: 'password123' })).s, 409);
    assert.strictEqual((await post('/api/signup', { name: 'X', email: 'a@b.co', password: 'short' })).s, 400);
    assert.strictEqual((await post('/api/login', { email: 't@example.com', password: 'wrong-password' })).s, 401);
    r = await post('/api/login', { email: 't@example.com', password: 'password123' });
    assert.strictEqual(r.s, 200); assert.strictEqual(r.j.user.name, 'Test User');
    assert.strictEqual((await call('/api/me', {}, tok)).j.user.email, 't@example.com');
    r = await call('/api/me', { method: 'PUT', body: JSON.stringify({ name: 'New Name', st: 'Advanced', state: { xp: 120 } }) }, tok);
    assert.strictEqual(r.j.user.name, 'New Name'); assert.strictEqual(r.j.user.state.xp, 120);
    assert.strictEqual((await post('/api/generate', { prompt: 'x' })).s, 401);
    assert.strictEqual((await post('/api/generate', { prompt: '' }, tok)).s, 400);
    assert.strictEqual((await post('/api/generate', { prompt: 'make a task' }, tok)).s, 200);
    assert.strictEqual((await post('/api/generate', { prompt: 'again' }, tok)).s, 200);
    assert.strictEqual((await post('/api/generate', { prompt: 'third' }, tok)).s, 429);
    assert.strictEqual((await call('/api/me', {}, tok + 'x')).s, 401);
    const h = await fetch(base + '/'); assert.strictEqual(h.status, 200); assert.ok((await h.text()).includes('IELTS'));
    assert.strictEqual((await fetch(base + '/css/styles.css')).status, 200);
    assert.strictEqual((await fetch(base + '/js/11-main.js')).status, 200);
    assert.notStrictEqual((await fetch(base + '/%2e%2e/server.js')).status, 200);
    flush(); console.log('All tests passed'); srv.close(); process.exit(0);
  } catch (e) { console.error('TEST FAILED:', e); process.exit(1); }
});
